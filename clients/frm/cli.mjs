#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createClient} from './client.mjs';
const args=process.argv.slice(2);
async function main(){
 if (args.length===1&&args[0]==='--demo') {
  const calls=[];
  const client=createClient(async(name,input)=>{calls.push({name,input});return {structuredContent:{synthetic:true,product_access:true,reviewRequired:true}};});
  const result=await client.boom.propose({requestId:'fictional-demo-1',expectedRevision:3,postId:'fictional-source',sourceVersion:'fictional-version',form:'reply',text:'Could we repair it before replacing it?'});
  console.log(JSON.stringify({mode:'offline fictional example; no connection, purchase or posting',calls,result},null,2));return;
 }
 const [flag,modulePath,product,operation,payload]=args;
 if(flag!=='--transport'||!modulePath||!['boom','kit'].includes(product)||!['capabilities','context','manifest','propose'].includes(operation)||args.length>5)throw Error('Use --demo, or --transport /trusted/adapter.mjs boom|kit capabilities|context|manifest|propose [JSON].');
 const transport=await import(pathToFileURL(resolve(modulePath)).href);
 const client=createClient(transport.callTool);
 const method=client[product][operation];if(typeof method!=='function')throw Error('Operation unavailable for this product.');
 const input=payload?JSON.parse(payload):{};
 console.log(JSON.stringify(await method(input),null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
