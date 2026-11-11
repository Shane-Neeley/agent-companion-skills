#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createClient} from './client.mjs';
import {createOAuthClient} from './oauth.mjs';
const args=process.argv.slice(2);
async function main(){
 if (args.length===1&&args[0]==='--demo') {
  const calls=[];
  const client=createClient(async(name,input)=>{calls.push({name,input});return {structuredContent:{synthetic:true,product_access:true,reviewRequired:true}};});
  const result=await client.boom.propose({requestId:'fictional-demo-1',expectedRevision:3,postId:'fictional-source',sourceVersion:'fictional-version',form:'reply',text:'Could we repair it before replacing it?'});
  console.log(JSON.stringify({mode:'offline fictional example; no connection, purchase or posting',calls,result},null,2));return;
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
  if(!modulePath||args.length>5)throw Error('Use --transport /trusted/adapter.mjs boom|kit capabilities|context|manifest|propose [JSON].');
  ({callTool}=await import(pathToFileURL(resolve(modulePath)).href));
  product=target;operation=command;payload=input;
 }else {
  [product,operation,payload]=args;
  if(args.length>3)throw Error('Too many arguments.');
  callTool=createOAuthClient(product).callTool;
 }
 if(!['boom','kit'].includes(product)||!['capabilities','context','manifest','propose'].includes(operation))throw Error('Use --demo, login|logout|status boom|kit, or boom|kit capabilities|context|manifest|propose [JSON].');
 const client=createClient(callTool);
 const method=client[product][operation];if(typeof method!=='function')throw Error('Operation unavailable for this product.');
 const input=payload?JSON.parse(payload):{};
 console.log(JSON.stringify(await method(input),null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
