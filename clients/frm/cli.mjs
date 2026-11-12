#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFile,stat} from 'node:fs/promises';
import {createClient} from './client.mjs';
import {createOAuthClient} from './oauth.mjs';
const args=process.argv.slice(2);
const commands={'writer-context':'writerContext','submit-candidates':'submitCandidates','upload-media':'uploadMedia'};
const maxPayload=8*1024*1024;
const help=`FRM agent client

Your agent supplies the words. This client moves permitted context and drafts.

Start here (Node.js 22+, no package installation):
  node clients/frm/cli.mjs --demo
  node clients/frm/cli.mjs login boom
  node clients/frm/cli.mjs boom writer-context

Commands:
  --help, -h                      Show this help; no connection needed
  --demo                          Try the fictional offline writer loop
  login boom|kit [--read-only]     Connect your product account in a browser
  status boom|kit                  Check the saved connection; never prints tokens
  logout boom|kit                  Revoke and remove the saved connection
  boom capabilities               Check your available operations
  boom context [JSON]             Read saved source posts
  boom writer-context [JSON]      Read your notes, feedback and exact draft IDs
  boom submit-candidates @FILE     Save an agent-prepared JSON packet for review
  boom submit-candidates -        Read that packet from stdin
  boom upload-media IMAGE         Upload a permitted PNG/JPEG/GIF/WebP (max 5 MiB)
  boom propose JSON               Save a source-bound, unapproved response
  kit context                     Read your reviewed business workspace
  kit manifest                    Get its export manifest (requires export permission)

JSON arguments also accept @FILE or - for stdin. File paths can be absolute.
Keep the terminal open during login; its browser must be on this computer.
Use your existing agent and its normal model access to write the packet.
Read back exact candidate IDs after saving; inspect every result for conflicts.
Writer access is required. This client never generates, approves or publishes.
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
async function main(){
 if(!args.length || args.length===1&&['--help','-h','help'].includes(args[0])) {
  console.log(help);return;
 }
 if (args.length===1&&args[0]==='--demo') {
  const calls=[];
  const candidates=[];
  const client=createClient(async(name,input)=>{calls.push({name,input});if(name==='submit_candidates'){candidates.push(...input.candidates);return {structuredContent:{results:input.candidates.map(item=>({id:item.id,status:'created'})),reviewRequired:true,funding:'caller_runtime'}};}return {structuredContent:{synthetic:true,candidates,funding:'caller_runtime',untrustedContent:true}};});
  await client.boom.writerContext();
  const candidate={id:'fictional-demo-slot-1',kind:'original',persona:{name:'Repair Notes',handle:'repair_notes'},text:'The repair manual needs a repair manual.',tags:{writer:'example'}};
  const result=await client.boom.submitCandidates({candidates:[candidate]});
  const readback=await client.boom.writerContext({candidateIds:[candidate.id]});
  console.log(JSON.stringify({mode:'offline fictional example; no connection, purchase or posting',calls,result,readback},null,2));return;
 }
 if(['login','logout','status'].includes(args[0])) {
  const [operation,product,option]=args;
  if(!['boom','kit'].includes(product)||args.length>3||(option&&!(operation==='login'&&option==='--read-only')))throw Error('Use login boom|kit [--read-only], logout boom|kit, or status boom|kit.');
  const connection=createOAuthClient(product);
  const result=operation==='login'?await connection.login({readOnly:option==='--read-only',onAuthorization:url=>console.error('Open this URL in your browser on this computer, sign in to your FRM account, and review the requested access:\n'+url)}):await connection[operation]();
  console.log(JSON.stringify(result,null,2));return;
 }
 let product,operation,payload,callTool;
 if(args[0]==='--transport') {
  const [,modulePath,target,command,input]=args;
  if(!modulePath||args.length>5)throw Error('Use --transport /trusted/adapter.mjs boom|kit <operation> [JSON|@file|-].');
  ({callTool}=await import(pathToFileURL(resolve(modulePath)).href));
  product=target;operation=command;payload=input;
 }else {
  [product,operation,payload]=args;
  if(args.length>3)throw Error('Too many arguments.');
  callTool=createOAuthClient(product).callTool;
 }
 operation=commands[operation]||operation;
 if(!['boom','kit'].includes(product)||!['capabilities','context','manifest','propose','writerContext','submitCandidates','uploadMedia'].includes(operation))throw Error('Use --demo, login|logout|status boom|kit, or boom|kit capabilities|context|manifest|propose|writer-context|submit-candidates|upload-media [JSON|@file|-].');
 const client=createClient(callTool);
 const method=client[product][operation];if(typeof method!=='function')throw Error('Operation unavailable for this product.');
 const input=await readPayload(payload,operation);
 const result=await method(input);
 console.log(JSON.stringify(result,null,2));
 if(operation==='submitCandidates'&&result?.results?.some(item=>item.status==='conflict')) {
  console.error('Some candidate IDs conflict. Inspect every result and read back the exact IDs before recovery.');
  process.exitCode=1;
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
