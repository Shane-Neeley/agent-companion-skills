import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {mkdtemp,rm,stat,chmod,symlink,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CredentialStore,createOAuthClient} from './oauth.mjs';
import {createClient} from './client.mjs';

async function fixture(t,{badIssuer=false,redirectToken=false,failedCall=false,failedRevocation=false,product='boom',exportCase}={}) {
  const directory=await mkdtemp(join(tmpdir(),'frm-oauth-fixture-'));
  const store=new CredentialStore(join(directory,'credentials'));
  const calls=[],registrations=[];let authorization,refresh=0;
  const exportBytes=new TextEncoder().encode('PK\x03\x04fictional archive');
  const snapshot='kit_'+'a'.repeat(64);
  const manifest={snapshot_id:snapshot,revisions:{profile:1,brain:1,work:1},read_only:true,funding:'caller_runtime',content_type:'application/zip',filename:'my-business-starter.zip',bytes:exportBytes.byteLength,sha256:createHash('sha256').update(exportBytes).digest('hex'),download_path:'/agent/kit/workspace/export?snapshot_id='+snapshot,review_status:'owner_reviewed',local_files:'snapshot_only_no_sync'};
  const server=createServer(async(req,res)=>{
    const url=new URL(req.url,origin);let body='';for await(const chunk of req)body+=chunk;
    calls.push({path:url.pathname,method:req.method,headers:req.headers,body});
    const send=(status,value)=>res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(value));
    if(url.pathname==='/.well-known/oauth-protected-resource/agent/mcp')return send(200,{resource:origin+'/agent/mcp',authorization_servers:[origin]});
    if(url.pathname==='/.well-known/oauth-authorization-server')return send(200,{issuer:badIssuer?'https://wrong.invalid':origin,authorization_endpoint:origin+'/agent/authorize',token_endpoint:origin+'/agent/token',registration_endpoint:origin+'/agent/register',revocation_endpoint:origin+'/agent/revoke',code_challenge_methods_supported:['S256']});
    if(url.pathname==='/agent/register'){registrations.push(JSON.parse(body));return send(201,{client_id:'fictional-client'});}
    if(url.pathname==='/agent/token'){
      if(redirectToken)return res.writeHead(307,{Location:origin+'/unexpected-token-destination'}).end();
      const form=new URLSearchParams(body);assert.equal(form.get('client_id'),'fictional-client');assert.equal(form.get('resource'),origin+'/agent/mcp');
      if(form.get('grant_type')==='authorization_code'){
        assert.equal(form.get('code'),'fictional-code');assert.equal(form.get('redirect_uri'),authorization.searchParams.get('redirect_uri'));
        assert.equal(createHash('sha256').update(form.get('code_verifier')).digest('base64url'),authorization.searchParams.get('code_challenge'));
      }else{assert.equal(form.get('grant_type'),'refresh_token');assert.equal(form.get('refresh_token'),'fictional-refresh-'+refresh);refresh++;}
      return send(200,{access_token:'fictional-access-'+refresh,refresh_token:'fictional-refresh-'+refresh,token_type:'Bearer',expires_in:3600,scope:authorization.searchParams.get('scope')});
    }
    if(url.pathname==='/agent/mcp'){
      assert.equal(req.headers.authorization,'Bearer fictional-access-'+refresh);
      const rpc=JSON.parse(body);
      if(req.headers['mcp-protocol-version']==='2025-11-25'){
        if(rpc.method==='initialize')return send(200,{jsonrpc:'2.0',id:rpc.id,result:{protocolVersion:'2025-11-25',capabilities:{tools:{}},serverInfo:{name:'fixture',version:'1'}}});
        if(rpc.method==='notifications/initialized')return res.writeHead(202).end();
        assert.equal(rpc.params._meta,undefined);
      }else{assert.equal(req.headers['mcp-protocol-version'],'2026-07-28');assert.equal(rpc.params._meta['io.modelcontextprotocol/protocolVersion'],'2026-07-28');}
      return send(failedCall?503:200,{jsonrpc:'2.0',id:rpc.id,result:{structuredContent:{synthetic:true,name:rpc.params.name}}});
    }
    if(url.pathname==='/agent/kit/workspace/export'){
      assert.equal(req.headers.authorization,'Bearer fictional-access-'+refresh);assert.equal(url.searchParams.get('snapshot_id'),snapshot);
      if(exportCase==='redirect')return res.writeHead(307,{Location:origin+'/unexpected-export-destination'}).end();
      if(exportCase==='changed')return send(409,{error:'revision_conflict'});
      const headers={'Content-Type':exportCase==='content-type'?'text/html':'application/zip','X-Kit-Snapshot-Id':exportCase==='snapshot'?'kit_'+'b'.repeat(64):snapshot};
      if(exportCase==='length')headers['Content-Length']=String(exportBytes.byteLength+10);
      res.writeHead(200,headers);
      if(exportCase==='short')return res.end(exportBytes.slice(0,-1));
      if(exportCase==='hash')return res.end(new Uint8Array(exportBytes.byteLength));
      res.write(exportBytes);return res.end(exportCase==='oversized'?'extra':'');
    }
    if(url.pathname==='/agent/revoke'){
      const form=new URLSearchParams(body);assert.equal(form.get('token'),'fictional-refresh-'+refresh);assert.equal(form.get('token_type_hint'),'refresh_token');
      return send(failedRevocation?503:200,{});
    }
    send(404,{error:'not_found'});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});});
  const connection=createOAuthClient(product,{store,origin,timeoutMs:500});
  async function authorize(url,{wrongStateFirst=false,wrongIssuer=false}={}) {
    authorization=new URL(url);assert.equal(authorization.origin,origin);assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');
    assert.equal(authorization.searchParams.get('resource'),origin+'/agent/mcp');
    const callback=new URL(authorization.searchParams.get('redirect_uri'));callback.searchParams.set('code','fictional-code');callback.searchParams.set('state',authorization.searchParams.get('state'));callback.searchParams.set('iss',wrongIssuer?'https://wrong.invalid':origin);
    if(wrongStateFirst){const bad=new URL(callback);bad.searchParams.set('state','wrong');assert.equal((await fetch(bad)).status,400);}
    return fetch(callback);
  }
  return {connection,store,calls,authorize,directory,registrations,origin,manifest,exportBytes};
}

test('browser PKCE login, owner-only persistence, scoped MCP call, rotating refresh, logout',async t=>{
  const f=await fixture(t);
  assert.deepEqual(await f.connection.status(),{connected:false,product:'boom'});
  const login=await f.connection.login({onAuthorization:url=>f.authorize(url,{wrongStateFirst:true})});
  assert.equal(login.connected,true);assert.deepEqual(login.scopes,['boom.workspace.read','boom.drafts.write','boom.writer.read','boom.writer.write']);
  assert.equal(f.registrations[0].token_endpoint_auth_method,'none');
  if(process.platform!=='win32'){
    assert.equal((await stat(f.store.directory)).mode&0o777,0o700);
    assert.equal((await stat(f.store.path('boom'))).mode&0o777,0o600);
  }
  assert.equal((await createClient(f.connection.callTool).boom.context()).synthetic,true);
  const saved=await f.store.read('boom');await f.store.write('boom',{...saved,expiresAt:0});
  await f.connection.callTool('get_capabilities');
  assert.equal((await f.store.read('boom')).refreshToken,'fictional-refresh-1');
  assert.equal(f.calls.filter(call=>call.path==='/agent/token').length,2);
  assert.equal((await f.connection.logout()).revoked,true);
  assert.deepEqual(await f.connection.status(),{connected:false,product:'boom'});
  assert.equal(f.calls.some(call=>call.path.includes('fictional-access')||call.path.includes('fictional-refresh')),false);
  assert.deepEqual(await readdir(f.store.directory),[]);
});

test('read-only login refuses draft calls before network and prevents overwriting a grant',async t=>{
  const f=await fixture(t);
  await f.connection.login({readOnly:true,onAuthorization:f.authorize});
  await assert.rejects(f.connection.callTool('propose_draft',{}),/granted scopes/);
  for(const name of ['get_writer_context','submit_candidates','upload_media'])await assert.rejects(f.connection.callTool(name,{}),/granted scopes/);
  await assert.rejects(f.connection.callTool('kit_get_workspace_context'),/unavailable/);
  assert.equal(f.calls.some(call=>call.path==='/agent/mcp'),false);
  await assert.rejects(f.connection.login({onAuthorization:f.authorize}),/Already connected/);
});

test('explicit legacy HTTP mode initializes before exactly one tool call',async t=>{
  const f=await fixture(t);await f.connection.login({onAuthorization:f.authorize});
  const legacy=createOAuthClient('boom',{store:f.store,origin:f.origin,protocolVersion:'2025-11-25'});
  assert.equal((await createClient(legacy.callTool).boom.context()).synthetic,true);
  assert.deepEqual(f.calls.filter(call=>call.path==='/agent/mcp').map(call=>JSON.parse(call.body).method),['initialize','notifications/initialized','tools/call']);
});
test('writer-scoped login sends each supplied operation once and an old source-only grant cannot read feedback',async t=>{
 const f=await fixture(t);await f.connection.login({onAuthorization:f.authorize});
 for(const name of ['get_writer_context','submit_candidates','upload_media'])await f.connection.callTool(name,{fixture:true});
 assert.deepEqual(f.calls.filter(item=>item.path==='/agent/mcp').map(item=>JSON.parse(item.body).params.name),['get_writer_context','submit_candidates','upload_media']);
 const saved=await f.store.read('boom');await f.store.write('boom',{...saved,scopes:['boom.workspace.read','boom.drafts.write']});
 const before=f.calls.length;
 for(const name of ['get_writer_context','submit_candidates','upload_media'])await assert.rejects(f.connection.callTool(name,{}),/granted scopes/);
 assert.equal(f.calls.length,before);
});

test('untrusted discovery issuer fails before registration',async t=>{
  const f=await fixture(t,{badIssuer:true});
  await assert.rejects(f.connection.login({onAuthorization:()=>assert.fail('must not authorize')}),/Issuer/);
  assert.equal(f.registrations.length,0);assert.equal(await f.store.read('boom'),null);
});

test('issuer mismatch and token redirects fail closed without saving credentials',async t=>{
  const wrong=await fixture(t);
  await assert.rejects(wrong.connection.login({onAuthorization:url=>wrong.authorize(url,{wrongIssuer:true})}),/issuer mismatch/);
  assert.equal(await wrong.store.read('boom'),null);
  const redirected=await fixture(t,{redirectToken:true});
  await assert.rejects(redirected.connection.login({onAuthorization:redirected.authorize}));
  assert.equal(redirected.calls.some(call=>call.path==='/unexpected-token-destination'),false);
  assert.equal(await redirected.store.read('boom'),null);
});

test('resource failure is not retried and unsuccessful revocation retains credentials',async t=>{
  const f=await fixture(t,{failedCall:true,failedRevocation:true});
  await f.connection.login({onAuthorization:f.authorize});
  await assert.rejects(f.connection.callTool('propose_draft',{requestId:'fictional-draft'}),/HTTP 503/);
  assert.equal(f.calls.filter(call=>call.path==='/agent/mcp').length,1);
  await assert.rejects(f.connection.logout(),/local credentials retained/);
  assert.ok(await f.store.read('boom'));
});

test('credential origin mismatch never transmits a token',async t=>{
  const f=await fixture(t);await f.connection.login({onAuthorization:f.authorize});
  const saved=await f.store.read('boom');await f.store.write('boom',{...saved,resource:'https://wrong.invalid/agent/mcp'});
  await assert.rejects(f.connection.callTool('get_capabilities'),/incompatible credentials/);
  assert.equal(f.calls.some(call=>call.path==='/agent/mcp'),false);
});

test('insecure or symlinked credential files and concurrent rotations are rejected',async t=>{
  const f=await fixture(t);await f.connection.login({onAuthorization:f.authorize});
  if(process.platform!=='win32'){
    await chmod(f.store.path('boom'),0o644);await assert.rejects(f.store.read('boom'),/0600/);await chmod(f.store.path('boom'),0o600);
  }
  let release;const held=f.store.locked('boom',()=>new Promise(resolve=>{release=resolve;}));
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(f.connection.callTool('get_capabilities'),/Another FRM command/);release();await held;
  const target=join(f.directory,'unrelated.json');await writeFile(target,'{}',{mode:0o600});
  await rm(f.store.path('boom'));await symlink(target,f.store.path('boom'));
  await assert.rejects(f.store.read('boom'));
});

test('browser timeout closes listener and releases storage lock',async t=>{
  const f=await fixture(t);
  await assert.rejects(f.connection.login({onAuthorization:()=>{}}),/timed out/);
  assert.equal(await f.store.read('boom'),null);
  assert.deepEqual(await readdir(f.store.directory),[]);
});

test('Kit snapshot download uses its bearer scope, refreshes first, and verifies returned bytes',async t=>{
  const f=await fixture(t,{product:'kit'});await f.connection.login({onAuthorization:f.authorize});
  const saved=await f.store.read('kit');await f.store.write('kit',{...saved,expiresAt:0});
  const bytes=await f.connection.downloadKitExport(f.manifest);
  assert.ok(bytes instanceof Uint8Array);assert.deepEqual(bytes,f.exportBytes);
  assert.equal((await f.store.read('kit')).refreshToken,'fictional-refresh-1');
  assert.equal(f.calls.filter(call=>call.path==='/agent/kit/workspace/export').length,1);
});

test('Kit export rejects missing permission and unsafe manifest paths before any download',async t=>{
  const f=await fixture(t,{product:'kit'});await f.connection.login({onAuthorization:f.authorize,readOnly:true});
  await assert.rejects(f.connection.downloadKitExport(f.manifest),/granted scopes/);
  for(const manifest of [
    {...f.manifest,download_path:'https://other.invalid/agent/kit/workspace/export?snapshot_id='+f.manifest.snapshot_id},
    {...f.manifest,download_path:f.manifest.download_path+'&extra=1'},
    {...f.manifest,download_path:'/api/v1/kit/workspace/export?snapshot_id='+f.manifest.snapshot_id},
    {...f.manifest,bytes:2*1024*1024+1},
    {...f.manifest,sha256:'invalid'},
  ])await assert.rejects(f.connection.downloadKitExport(manifest),/Invalid Kit export manifest/);
  assert.equal(f.calls.some(call=>call.path==='/agent/kit/workspace/export'),false);
  const boom=await fixture(t);await assert.rejects(boom.connection.downloadKitExport(f.manifest),/only available for Kit/);
});

test('Kit download rejects changed snapshots, bad type, size, checksum and redirects without retrying',async t=>{
  for(const [exportCase,message] of [['changed',/HTTP 409/],['content-type',/content type/],['snapshot',/snapshot differs/],['length',/size differs/],['short',/size differs/],['oversized',/exceeds/],['hash',/checksum differs/],['redirect',/fetch failed/]]){
    await t.test(exportCase,async t=>{
      const f=await fixture(t,{product:'kit',exportCase});await f.connection.login({onAuthorization:f.authorize});
      await assert.rejects(f.connection.downloadKitExport(f.manifest),message);
      assert.equal(f.calls.filter(call=>call.path==='/agent/kit/workspace/export').length,1);
      assert.equal(f.calls.some(call=>call.path==='/unexpected-export-destination'),false);
    });
  }
});
