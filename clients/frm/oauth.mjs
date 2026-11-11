// Product OAuth only. This module never handles an agent provider's credentials.
import {createServer} from 'node:http';
import {randomBytes, createHash, timingSafeEqual} from 'node:crypto';
import {constants} from 'node:fs';
import {open, mkdir, lstat, rename, unlink} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';

export const PRODUCTS=Object.freeze({
  boom:Object.freeze({origin:'https://boomscrolling.fortrockmedia.com',scopes:['boom.workspace.read','boom.drafts.write']}),
  kit:Object.freeze({origin:'https://fortrockmedia.com',scopes:['kit.workspace.read','kit.workspace.export']}),
});
const VERSION='2026-07-28';
const random=()=>randomBytes(32).toString('base64url');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const fail=message=>{throw new Error(message);};
function originURL(input) {
  const url=new URL(input);
  // Plain HTTP is only available to injected local test fixtures, never CLI targets.
  if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&url.hostname==='127.0.0.1')))fail('Invalid product origin.');
  return url.origin;
}
async function json(response,label) {
  if(!response.ok)fail(`${label} failed (HTTP ${response.status}). Reconnect if authorization expired.`);
  try{return await response.json();}catch{fail(`${label} returned invalid JSON.`);}
}
function endpoint(value,origin,path) {
  if(value!==origin+path)fail('Unexpected OAuth endpoint; refusing to send credentials.');
  return value;
}
async function request(url,options={}) {
  // Never forward credentials across redirects. All network waits are bounded.
  return fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(20_000)});
}
async function discover(origin) {
  const resource=origin+'/agent/mcp';
  const protectedResource=await json(await request(origin+'/.well-known/oauth-protected-resource/agent/mcp'),'Resource discovery');
  if(protectedResource.resource!==resource||!Array.isArray(protectedResource.authorization_servers)||!protectedResource.authorization_servers.includes(origin))fail('Unexpected OAuth resource or issuer.');
  const metadata=await json(await request(origin+'/.well-known/oauth-authorization-server'),'Authorization discovery');
  if(metadata.issuer!==origin||!metadata.code_challenge_methods_supported?.includes('S256'))fail('Issuer must support PKCE S256.');
  return {
    resource,issuer:origin,
    authorization:endpoint(metadata.authorization_endpoint,origin,'/agent/authorize'),
    token:endpoint(metadata.token_endpoint,origin,'/agent/token'),
    register:endpoint(metadata.registration_endpoint,origin,'/agent/register'),
    revoke:endpoint(metadata.revocation_endpoint,origin,'/agent/revoke'),
  };
}
function validateToken(token,scopes) {
  if(!token||typeof token.access_token!=='string'||!token.access_token||token.token_type?.toLowerCase()!=='bearer'||typeof token.refresh_token!=='string'||!token.refresh_token||!Number.isFinite(token.expires_in)||token.expires_in<=0)fail('Invalid token response.');
  const granted=typeof token.scope==='string'?token.scope.split(' ').filter(Boolean):scopes;
  if(granted.some(scope=>!scopes.includes(scope)))fail('Unexpected granted scope.');
  return {accessToken:token.access_token,refreshToken:token.refresh_token,expiresAt:Date.now()+token.expires_in*1000,scopes:granted};
}

// Credentials remain outside the checkout. POSIX hosts require owner-only files.
export class CredentialStore {
  constructor(directory=process.env.FRM_CONFIG_DIR||join(homedir(),'.config','fort-rock-media')) {this.directory=resolve(directory);}
  path(product) {if(!Object.hasOwn(PRODUCTS,product))fail('Choose boom or kit.');return join(this.directory,product+'.json');}
  async secure(stat,isDirectory=false) {
    if(stat.isSymbolicLink()||!(isDirectory?stat.isDirectory():stat.isFile())||(process.getuid&&stat.uid!==process.getuid())||(process.platform!=='win32'&&(stat.mode&0o077)!==0))fail('Credential storage must be owned by you with directory mode 0700 and file mode 0600; symbolic links are not allowed.');
  }
  async prepare() {await mkdir(this.directory,{recursive:true,mode:0o700});await this.secure(await lstat(this.directory),true);}
  async read(product) {
    await this.prepare();let file;
    try{file=await open(this.path(product),constants.O_RDONLY|constants.O_NOFOLLOW);}catch(error){if(error.code==='ENOENT')return null;throw error;}
    try{await this.secure(await file.stat());return JSON.parse(await file.readFile('utf8'));}finally{await file.close();}
  }
  async write(product,value) {
    await this.prepare();
    // Do not silently replace an existing unsafe credential file.
    try{await this.secure(await lstat(this.path(product)));}catch(error){if(error.code!=='ENOENT')throw error;}
    const temp=this.path(product)+'.'+random()+'.tmp';
    const file=await open(temp,'wx',0o600);
    try{await file.writeFile(JSON.stringify(value)+'\n');await file.sync();await file.close();await rename(temp,this.path(product));}
    finally{await file.close().catch(()=>{});await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  }
  async remove(product) {await unlink(this.path(product)).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  async locked(product,operation) {
    await this.prepare();const path=this.path(product)+'.lock';let file;
    // No lock stealing or automatic grant retries: another process may be rotating tokens.
    try{file=await open(path,'wx',0o600);}catch(error){if(error.code==='EEXIST')fail('Another FRM command is active. Wait for it to finish; if it crashed, remove the .lock file from your private FRM config directory.');throw error;}
    try{return await operation();}finally{await file.close();await unlink(path);}
  }
}

export function createOAuthClient(product,{store=new CredentialStore(),origin:injectedOrigin,timeoutMs=300_000,protocolVersion=VERSION}={}) {
  const config=PRODUCTS[product];if(!config)fail('Choose boom or kit.');
  const origin=originURL(injectedOrigin||config.origin),resource=origin+'/agent/mcp';
  if(![VERSION,'2025-11-25'].includes(protocolVersion))fail('Unsupported MCP protocol version.');
  function credential(value) {
    if(!value||value.issuer!==origin||value.resource!==resource||typeof value.clientId!=='string'||typeof value.refreshToken!=='string'||typeof value.accessToken!=='string'||!Array.isArray(value.scopes)||value.scopes.some(scope=>!config.scopes.includes(scope))||!Number.isFinite(value.expiresAt))fail('Missing or incompatible credentials. Run login for this product.');
    return value;
  }
  async function form(url,values,label) {
    return json(await request(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(values)}),label);
  }
  async function login({onAuthorization,readOnly=false}={}) {
    if(typeof onAuthorization!=='function')fail('Supply onAuthorization(url) to open or display the browser sign-in URL.');
    return store.locked(product,async()=>{
      // Existing grants must be explicitly logged out before replacement.
      if(await store.read(product))fail('Already connected. Log out before connecting a different account or changing scopes.');
      const metadata=await discover(origin),state=random(),verifier=random();
      const scopes=readOnly?config.scopes.slice(0,1):config.scopes;
      let settle,settled=false,timer;
      const callback=new Promise((resolve,reject)=>{settle=(error,value)=>{if(settled)return;settled=true;error?reject(error):resolve(value);};});
      // Attach rejection immediately while registration/browser setup is in progress.
      callback.catch(()=>{});
      const server=createServer((req,res)=>{
        const url=new URL(req.url,'http://127.0.0.1');
        res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
        if(req.method!=='GET'||url.pathname!=='/callback'){res.writeHead(404).end('Not found.');return;}
        // Foreign callbacks cannot terminate an active login.
        if(!equal(url.searchParams.get('state'),state)){res.writeHead(400).end('Invalid login state.');return;}
        if(url.searchParams.get('iss')!==origin){res.writeHead(400).end('Invalid authorization issuer.');settle(new Error('Authorization issuer mismatch.'));return;}
        if(url.searchParams.has('error')){res.writeHead(400).end('Authorization was not granted.');settle(new Error('Authorization was not granted.'));return;}
        const code=url.searchParams.get('code');
        if(!code){res.writeHead(400).end('Missing authorization code.');settle(new Error('Missing authorization code.'));return;}
        res.writeHead(200).end('Sign-in received. Return to the terminal to finish connecting.');settle(null,code);
      });
      await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
      timer=setTimeout(()=>settle(new Error('Browser sign-in timed out. Run login again.')),timeoutMs);timer.unref();
      try{
        const redirect='http://127.0.0.1:'+server.address().port+'/callback';
        const registration=await json(await request(metadata.register,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:'Fort Rock Media command-line client',redirect_uris:[redirect],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']})}),'Client registration');
        if(typeof registration.client_id!=='string'||!registration.client_id)fail('Registration did not return a client ID.');
        const url=new URL(metadata.authorization);
        for(const [key,value] of Object.entries({response_type:'code',client_id:registration.client_id,redirect_uri:redirect,resource,scope:scopes.join(' '),state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}))url.searchParams.set(key,value);
        await onAuthorization(url.href);
        const code=await callback;
        const tokens=validateToken(await form(metadata.token,{grant_type:'authorization_code',client_id:registration.client_id,redirect_uri:redirect,code,code_verifier:verifier,resource},'Token exchange'),scopes);
        await store.write(product,{version:1,issuer:origin,resource,clientId:registration.client_id,...tokens});
        return {connected:true,product,scopes:tokens.scopes};
      }finally{clearTimeout(timer);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    });
  }
  async function status() {
    return store.locked(product,async()=>{const saved=await store.read(product);if(!saved)return {connected:false,product};const value=credential(saved);return {connected:true,product,scopes:value.scopes,expiresAt:new Date(value.expiresAt).toISOString()};});
  }
  async function logout() {
    return store.locked(product,async()=>{
      const saved=await store.read(product);if(!saved)return {connected:false,product};
      const value=credential(saved),metadata=await discover(origin);
      const response=await request(metadata.revoke,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:value.refreshToken,token_type_hint:'refresh_token',client_id:value.clientId})});
      if(!response.ok)fail(`Revocation failed (HTTP ${response.status}); local credentials retained so you can retry logout.`);
      await store.remove(product);return {connected:false,product,revoked:true};
    });
  }
  async function authorized(scope,operation) {
    return store.locked(product,async()=>{
      let value=credential(await store.read(product));
      if(!value.scopes.includes(scope))fail('Operation is unavailable for this connection or granted scopes.');
      if(value.expiresAt<=Date.now()+30_000){
        const metadata=await discover(origin);
        const tokens=validateToken(await form(metadata.token,{grant_type:'refresh_token',refresh_token:value.refreshToken,client_id:value.clientId,resource},'Token refresh'),value.scopes);
        value={...value,...tokens};await store.write(product,value);
        if(!value.scopes.includes(scope))fail('The refreshed connection lacks the required scope. Reconnect to update permissions.');
      }
      return operation(value);
    });
  }
  async function downloadKitExport(manifest) {
    if(product!=='kit')fail('Workspace export is only available for Kit connections.');
    const maxBytes=2*1024*1024;
    const {snapshot_id:snapshotId,download_path:path,content_type:contentType,bytes:expectedBytes,sha256}=manifest||{};
    if(typeof snapshotId!=='string'||!/^kit_[a-f0-9]{64}$/.test(snapshotId)||path!=='/agent/kit/workspace/export?snapshot_id='+snapshotId||contentType!=='application/zip'||!Number.isSafeInteger(expectedBytes)||expectedBytes<0||expectedBytes>maxBytes||typeof sha256!=='string'||!/^[a-f0-9]{64}$/.test(sha256))fail('Invalid Kit export manifest. Expected an exact resource-relative snapshot path and an export no larger than 2 MiB.');
    return authorized('kit.workspace.export',async value=>{
      const response=await request(origin+path,{headers:{Authorization:'Bearer '+value.accessToken,Accept:'application/zip'}});
      if(!response.ok)fail(`Kit export failed (HTTP ${response.status}). Read the current manifest if your workspace changed.`);
      if(response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/zip')fail('Kit export returned an unexpected content type.');
      const length=response.headers.get('Content-Length');
      if(length!==null&&(!/^\d+$/.test(length)||Number(length)!==expectedBytes))fail('Kit export size differs from its manifest.');
      const snapshot=response.headers.get('X-Kit-Snapshot-Id');
      if(snapshot!==null&&snapshot!==snapshotId)fail('Kit export snapshot differs from its manifest.');
      const reader=response.body?.getReader(),chunks=[];let received=0;
      if(reader)try{
        while(true){
          const {done,value:chunk}=await reader.read();if(done)break;
          received+=chunk.byteLength;
          if(received>expectedBytes||received>maxBytes)fail('Kit export exceeds its manifest size.');
          chunks.push(chunk);
        }
      }catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
      if(received!==expectedBytes)fail('Kit export size differs from its manifest.');
      const bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      if(createHash('sha256').update(bytes).digest('hex')!==sha256)fail('Kit export checksum differs from its manifest.');
      return bytes;
    });
  }
  async function callTool(name,args={}) {
    const scope=name==='propose_draft'?'boom.drafts.write':name==='kit_get_export_manifest'?'kit.workspace.export':product==='boom'?'boom.workspace.read':'kit.workspace.read';
    const allowed=product==='boom'?['get_capabilities','get_workspace_context','propose_draft']:['kit_get_capabilities','kit_get_workspace_context','kit_get_export_manifest'];
    if(!allowed.includes(name))fail('Tool is unavailable for this product.');
    return authorized(scope,async value=>{
      const clientInfo={name:'fort-rock-media-client',version:'1.0.0'};
      const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream',Authorization:'Bearer '+value.accessToken,'MCP-Protocol-Version':protocolVersion};
      const post=(method,params,notification=false)=>request(resource,{method:'POST',headers:{...headers,...(protocolVersion===VERSION?{'Mcp-Method':method,...(params.name?{'Mcp-Name':params.name}:{})}:{})},body:JSON.stringify({jsonrpc:'2.0',...(notification?{}:{id:1}),method,params})});
      if(protocolVersion==='2025-11-25'){
        // Explicit compatibility mode; no fallback/replay after a resource call.
        const initialized=await json(await post('initialize',{protocolVersion,capabilities:{},clientInfo}),'MCP initialization');
        if(initialized.result?.protocolVersion!==protocolVersion)fail('MCP server did not accept the selected protocol.');
        const notified=await post('notifications/initialized',{},true);
        if(!notified.ok)fail('MCP initialization notification failed.');
      }
      const meta={'io.modelcontextprotocol/protocolVersion':VERSION,'io.modelcontextprotocol/clientCapabilities':{},'io.modelcontextprotocol/clientInfo':clientInfo};
      const response=await post('tools/call',{name,arguments:args,...(protocolVersion===VERSION?{_meta:meta}:{})});
      // Never retry a resource call: a timeout may have happened after a draft was saved.
      const envelope=await json(response,'MCP call');
      if(envelope.jsonrpc!=='2.0'||envelope.id!==1)fail('Invalid MCP response.');
      if(envelope.error)fail('MCP request failed. Check granted scopes and current product access.');
      if(!envelope.result)fail('MCP result missing.');
      return envelope.result;
    });
  }
  return Object.freeze({login,status,logout,callTool,downloadKitExport});
}
