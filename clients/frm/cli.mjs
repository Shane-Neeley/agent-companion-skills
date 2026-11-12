#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFile,stat,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from './client.mjs';
import {createOAuthClient,PRODUCTS} from './oauth.mjs';
import {BOOM_COMMANDS,BOOM_OPERATIONS} from './operations.mjs';
import {BOOM_TAGLINE,boomMasthead,terminalBrand} from './terminal.mjs';
import {composeLink,shareLink,profileLink,writingContext,takeCard} from './helpers.mjs';
import {parsePostArguments,postStatusArguments,validatePostArguments,publicationExit,connectXArguments} from './post.mjs';
const rawArgs=process.argv.slice(2),args=[];
let jsonOnly=false,useRest=false,output;
// Post text is a literal argument, even when it happens to equal a global flag.
const valueFlags=new Set(['--text','--text-file','--account','--request-id','--scopes','--transport']);
for(let index=0;index<rawArgs.length;index++) {
 const flag=rawArgs[index];
 if(valueFlags.has(flag)){args.push(flag);if(index+1<rawArgs.length)args.push(rawArgs[++index]);continue;}
 if(flag==='--json'){if(jsonOnly)throw Error('Do not repeat --json.');jsonOnly=true;continue;}
 if(flag==='--rest'){if(useRest)throw Error('Do not repeat --rest.');useRest=true;continue;}
 if(flag==='--output'){if(output!==undefined||index+1>=rawArgs.length)throw Error('Supply exactly one file path after --output.');output=rawArgs[++index];continue;}
 args.push(flag);
}
const maxPayload=8*1024*1024,maxExport=16*1024*1024;
const help=`FRM agent client · BoomScrolling

Your agent supplies the words. This client moves permitted context and drafts.

Start here (Node.js 22+, no package installation):
  node clients/frm/cli.mjs --demo
  node clients/frm/cli.mjs login boom
  node clients/frm/cli.mjs boom writer-context

Commands:
  --help, -h                       Show this help; no connection needed
  --demo                           Try the fictional offline writer loop
  login boom|kit [--read-only]      Connect in your browser; current writer scopes
  login boom --full                Review all optional account permissions
  login boom --scopes A,B          Request an explicit subset of permissions
  status boom|kit                   Check the saved connection; never prints tokens
  logout boom|kit                   Revoke and remove the saved connection
  boom tools                       Discover the tools this connection can use
  boom commands                    List local command names and required scopes
  boom call OPERATION [JSON]        Call a named shared product operation
  boom list-sources [JSON]          Full saved-source reads, search and pagination
  boom list-drafts [JSON]           Inspect drafts and retained delivery history
  boom list-candidates [JSON]       Read your private feed and exact versions
  boom writer-context [JSON]       Read your notes, feedback and exact draft IDs
  boom submit-candidates @FILE      Save an agent-prepared JSON packet for review
  boom submit-candidates -         Read that packet from stdin
  boom upload-media IMAGE          Upload a permitted image (max 5 MiB)
  boom download-media JSON --output FILE  Verify and save the complete private image
  boom export-workspace JSON --output FILE  Save all pages of a scoped workspace export
  boom export-writer-data JSON --output FILE Save all pages of a private writer export
  boom post --text TEXT --account ID --request-id KEY --confirm
                                   Publish one exact user-directed original post now
  boom post --text-file FILE|--stdin --account ID --request-id KEY --confirm
                                   Preserve exact text from a UTF-8 file or stdin
  boom post-status KEY             Read the retained outcome; never resends
  boom connect-x --posting --request-id KEY --confirm
                                   Prepare explicit X write-authorization handoff
  boom compose JSON                Build an X review link; never sends
  boom share JSON                  Return the original source link
  boom profile JSON                Open/follow handoff URL for an exact X handle
  boom schema [OPERATION]          Inspect the offline shared API schema
  boom writing-context JSON        Local writing approach and ChatGPT handoff link
  boom take-card JSON --output FILE Export a shareable SVG of your own words
  kit context                      Read your reviewed business workspace
  kit manifest                     Get its export manifest (requires export permission)

Every shared operation has a kebab-case command. Run boom commands to see all.
JSON arguments also accept @FILE or - for stdin. File paths can be absolute.
--output refuses to overwrite files and writes with private file permissions.
JSON stdout stays clean. --json also suppresses the interactive stderr masthead.
--rest uses the same scoped token with the canonical product REST operation route.
NO_COLOR disables terminal color. Help always includes the BoomScrolling line.
Keep the terminal open during login; its browser must be on this computer.
New scopes require a fresh, explicitly reviewed connection; refresh cannot add them.
Review writes, hosted assistance and X reads require their own permissions and gates.
Only an explicit confirmed post command can publish, with separate publication permission.
Draft import, Like and unattended writing never publish. Composer links do not send.
After an uncertain result, use post-status with the same key; never create a blind retry.
Setup: https://github.com/Shane-Neeley/agent-companion-skills/tree/main/clients/frm
`;
async function readPayload(value,operation) {
 if(!value)return {};
 if(operation==='uploadMedia'&&!['@','{','-'].includes(value[0])) {
  const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'};
  const contentType=types[value.split('.').pop().toLowerCase()];
  if(!contentType)throw Error('Choose a PNG, JPEG, GIF or WebP file.');
  if((await stat(value)).size>5*1024*1024)throw Error('Images are limited to 5 MiB.');
  const bytes=await readFile(value);
  if(bytes.byteLength>5*1024*1024)throw Error('Images are limited to 5 MiB.');
  return {contentType,dataBase64:bytes.toString('base64')};
 }
 let json=value;
 if(value==='-') {
  const chunks=[];let length=0;
  for await(const chunk of process.stdin){length+=chunk.length;if(length>maxPayload)throw Error('JSON payload is limited to 8 MiB.');chunks.push(chunk);}
  json=Buffer.concat(chunks).toString('utf8');
 }else if(value.startsWith('@')) {
  const path=value.slice(1);if(!path)throw Error('Supply a JSON file path after @.');
  if((await stat(path)).size>maxPayload)throw Error('JSON payload is limited to 8 MiB.');
  json=await readFile(path,'utf8');
 }
 if(Buffer.byteLength(json)>maxPayload)throw Error('JSON payload is limited to 8 MiB.');
 return JSON.parse(json);
}
async function save(bytes,path,contentType) {
 const file=await open(path,'wx',0o600);
 try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}
 return {path:resolve(path),contentType,bytes:bytes.byteLength,sha256:createHash('sha256').update(bytes).digest('hex')};
}
async function exportFile(method,input,operation) {
 const collections=operation==='export_workspace'?['sources','drafts','history','feedback','exposures']:['candidates','versions','events','exposures','authored'];
 if(input.cursor&&!input.collection)throw Error('A continuation cursor requires its explicit collection.');
 const selected=input.collection?[input.collection]:collections;
 const exports=[];let used=0,snapshot;
 for(const collection of selected) {
  const pages=[],seen=new Set();let cursor=input.cursor;
  do {
   const page=await method({...input,collection,...(cursor?{cursor}:{})});
   if(!page||typeof page!=='object'||page.collection!==collection||!(page.nextCursor===null||typeof page.nextCursor==='string'&&page.nextCursor.length<=2048)||!Array.isArray(page.records))throw Error('Invalid export continuation.');
   const current=JSON.stringify({revision:page.revision,watermark:page.watermark});
   if(current==='{}')throw Error('The export did not identify its snapshot.');
   if(snapshot===undefined)snapshot=current;
   if(current!==snapshot)throw Error('The export changed between pages or collections. Read a new export before saving.');
   used+=Buffer.byteLength(JSON.stringify(page));if(used>maxExport)throw Error('The export exceeds 16 MiB. Export smaller supported collections.');
   pages.push(page);cursor=page.nextCursor;
   if(cursor){if(seen.has(cursor)||pages.length>10000)throw Error('The export repeated or exceeded its continuation limit.');seen.add(cursor);}
  } while(cursor);
  exports.push({collection,complete:!input.cursor,pages});
 }
 return Buffer.from(JSON.stringify({format:'boom-cli-export-v1',operation,complete:!input.cursor,allCollections:!input.collection,snapshot:JSON.parse(snapshot),exports},null,2)+'\n');
}
async function main(){
 if(!args.length||args.length===1&&['--help','-h','help','boom'].includes(args[0])) {
  if(output)throw Error('--output is available for explicit download/export commands.');
  console.log(jsonOnly?JSON.stringify({name:'FRM agent client',tagline:BOOM_TAGLINE,help},null,2):boomMasthead({color:!!process.stdout.isTTY&&!Object.hasOwn(process.env,'NO_COLOR')})+'\n\n'+help);return;
 }
 if(args.length===1&&args[0]==='--demo') {
  if(output)throw Error('--output is available for explicit download/export commands.');
  terminalBrand(process.stderr,{json:jsonOnly});
  const calls=[],candidates=[];
  const client=createClient(async(name,input)=>{calls.push({name,input});if(name==='submit_candidates'){candidates.push(...input.candidates);return {structuredContent:{results:input.candidates.map(item=>({id:item.id,status:'created'})),reviewRequired:true,funding:'caller_runtime'}};}return {structuredContent:{synthetic:true,candidates,funding:'caller_runtime',untrustedContent:true}};});
  await client.boom.writerContext();
  const candidate={id:'fictional-demo-slot-1',kind:'original',persona:{name:'Repair Notes',handle:'repair_notes'},text:'The repair manual needs a repair manual.',tags:{writer:'example'}};
  const result=await client.boom.submitCandidates({candidates:[candidate]});
  const readback=await client.boom.writerContext({candidateIds:[candidate.id]});
  console.log(JSON.stringify({mode:'offline fictional example; no connection, purchase or posting',calls,result,readback},null,2));return;
 }
 if(['login','logout','status'].includes(args[0])) {
  if(output)throw Error('--output is available for explicit download/export commands.');
  const [operation,product,...options]=args;
  if(!['boom','kit'].includes(product)||operation!=='login'&&options.length)throw Error('Use login boom|kit [--read-only|--full|--scopes A,B], logout boom|kit, or status boom|kit.');
  const loginOptions={};
  if(options.length){
   if(options.length===1&&options[0]==='--read-only')loginOptions.readOnly=true;
   else if(options.length===1&&options[0]==='--full')loginOptions.full=true;
   else if(options.length===2&&options[0]==='--scopes')loginOptions.scopes=options[1].split(/[ ,]+/).filter(Boolean);
   else throw Error('Choose one of --read-only, --full or --scopes A,B.');
  }
  if(product==='boom')terminalBrand(process.stderr,{json:jsonOnly});
  const connection=createOAuthClient(product);
  const result=operation==='login'?await connection.login({...loginOptions,onAuthorization:url=>console.error('Open this URL in your browser on this computer, sign in to your FRM account, and review the requested access:\n'+url)}):await connection[operation]();
  console.log(JSON.stringify(result,null,2));return;
 }
 let product,operation,payload,callTool,listTools,requestOperation,connection;
 let commands=args;
 if(args[0]==='--transport') {
  if(!args[1])throw Error('Supply the trusted transport module path.');
  ({callTool,listTools,requestOperation}=await import(pathToFileURL(resolve(args[1])).href));commands=args.slice(2);
 }
 [product,operation,payload]=commands;
 if(!['boom','kit'].includes(product))throw Error('Choose boom or kit; use --help for commands.');
 if(useRest&&product!=='boom')throw Error('--rest is available for BoomScrolling product operations.');
 if(product==='boom')terminalBrand(process.stderr,{json:jsonOnly});
 if(operation==='commands'&&product==='boom') {
  if(commands.length!==2||output)throw Error('Use boom commands without arguments.');
  console.log(JSON.stringify({source:'contract_snapshot',operations:Object.entries(BOOM_COMMANDS).map(([command,method])=>({command,method,...BOOM_OPERATIONS[method]})),scopes:PRODUCTS.boom},null,2));return;
 }
 if(operation==='schema'&&product==='boom') {
  if(commands.length>3||output)throw Error('Use boom schema [OPERATION] without --output.');
  const contract=JSON.parse(await readFile(new URL('./contracts/boomscrolling.openapi.json',import.meta.url),'utf8'));
  if(payload){const operation=Object.values(contract.paths).flatMap(route=>Object.values(route)).find(operation=>operation.operationId===payload);if(!operation)throw Error('Unknown operation in the local schema snapshot.');console.log(JSON.stringify({source:'contract_snapshot',operation},null,2));}
  else console.log(JSON.stringify({source:'contract_snapshot',contract},null,2));
  return;
 }
 const helpers={compose:composeLink,share:shareLink,profile:profileLink,'writing-context':writingContext,'take-card':takeCard};
 if(product==='boom'&&Object.hasOwn(helpers,operation)) {
  if(commands.length>3)throw Error('Supply one JSON argument, @FILE or stdin.');
  const result=helpers[operation](await readPayload(payload));
  if(output){if(operation!=='take-card')throw Error('--output is available for take-card and downloads/exports.');const bytes=Buffer.from(result.dataBase64,'base64');console.log(JSON.stringify(await save(bytes,output,result.contentType),null,2));}
  else console.log(JSON.stringify(result,null,2));
  return;
 }
 if(product==='boom'&&['post','post-status'].includes(operation)&&commands.length===3&&['--help','-h'].includes(commands[2])) {
  if(output)throw Error('--output is not available for posting help.');
  const usage=operation==='post'?'boom post --text TEXT|--text-file FILE|--stdin --account NUMERIC_X_ID --request-id STABLE_KEY --confirm':'boom post-status STABLE_REQUEST_ID';
  console.log(jsonOnly?JSON.stringify({usage,scope:'boom.publication.write',preflightScope:operation==='post'?'boom.account.read':null,retries:false},null,2):usage+'\n\nExplicit immediate originals only. A status lookup never resends.');return;
 }
 let directPost=false,statusLookup=false,directConnect=false;
 if(product==='boom'&&operation==='post') {
  if(output)throw Error('--output is not available for a live post.');
  payload=await parsePostArguments(commands.slice(2));operation='publishPost';directPost=true;
 }else if(product==='boom'&&operation==='connect-x') {
  if(output)throw Error('--output is not available for connection setup.');
  payload=connectXArguments(commands.slice(2));operation='requestXConnection';directConnect=true;
 }else if(product==='boom'&&operation==='post-status') {
  if(output)throw Error('--output is not available for post-status.');
  payload=postStatusArguments(commands.slice(2));operation='getPublicationRequest';statusLookup=true;
 }
 let genericName;
 if(operation==='call'&&product==='boom') {
  if(commands.length<3||commands.length>4)throw Error('Use boom call OPERATION [JSON|@FILE|-].');
  genericName=commands[2];payload=commands[3];
 }else if(!directPost&&!statusLookup&&!directConnect&&commands.length>3)throw Error('Too many arguments.');
 if(args[0]!=='--transport'){connection=createOAuthClient(product);callTool=connection.callTool;listTools=connection.listTools;requestOperation=connection.requestOperation;}
 if(useRest){if(typeof requestOperation!=='function')throw Error('This trusted adapter has no product REST transport.');callTool=async(name,input)=>({structuredContent:await requestOperation(name,input)});}
 const client=createClient(callTool,{listTools,requestOperation});
 operation=BOOM_COMMANDS[operation]||operation;
 const method=genericName?(input=>client.boom.call(genericName,input)):client[product][operation];
 if(typeof method!=='function'||['call','readMedia'].includes(operation)&&!genericName)throw Error('Operation unavailable for this product; run boom commands or --help.');
 const input=directPost||statusLookup||directConnect?payload:await readPayload(payload,operation);
 let result;
 if(output){
  if(product==='boom'&&operation==='downloadMedia'){
   if(Object.keys(input).some(key=>key!=='key'))throw Error('A complete media download accepts only key with --output.');
   const media=await client.boom.readMedia(input);result=await save(media.bytes,output,media.contentType);
  }else if(product==='boom'&&['exportWorkspace','exportWriterData'].includes(operation))result=await save(await exportFile(method,input,BOOM_OPERATIONS[operation].name),output,'application/json');
  else throw Error('--output is available for download-media, exports and take-card.');
 }else if(product==='boom'&&(operation==='publishPost'||genericName==='publish_post')) {
  const exact=validatePostArguments(input);
  try{result=await client.boom.postNow(exact);}catch(error){console.error(error.publicationAttempted===false?'This command did not submit the post.':'No automatic resend was attempted. Inspect boom post-status '+exact.requestId+' before choosing recovery.');throw error;}
 }else result=await method(input);
 console.log(JSON.stringify(result,null,2));
 if(product==='boom'&&(['publishPost','getPublicationRequest'].includes(operation)||['publish_post','get_publication_request'].includes(genericName))){const state=publicationExit(result);if(state.message)console.error(state.message);process.exitCode=state.code;}
 if(operation==='submitCandidates'&&result?.results?.some(item=>item.status==='conflict')) {
  console.error('Some candidate IDs conflict. Inspect every result and read back the exact IDs before recovery.');process.exitCode=1;
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=error.publicationAttempted===true?2:1;});
