import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient,ToolError} from './client.mjs';
test('structured and legacy results have the same client view',async()=>{
 for(const result of [{structuredContent:{revision:4}},{content:[{type:'text',text:'{"revision":4}'}]}]) assert.deepEqual(await createClient(async()=>result).boom.context(),{revision:4});
});
test('proposal passes exact key/revision/version/text and never calls approval or retries',async()=>{
 const calls=[],args={requestId:'one',expectedRevision:2,sourceVersion:'exact',postId:'s',form:'reply',text:'My exact words'};
 const client=createClient(async(name,input)=>{calls.push({name,input});return {isError:true,structuredContent:{error:'Uncertain response. Reconcile first.'}};});
 await assert.rejects(client.boom.propose(args),ToolError);assert.deepEqual(calls,[{name:'propose_draft',input:args}]);
});
test('Kit only exposes capability, reviewed context and export-manifest calls',async()=>{
 const calls=[];const client=createClient(async(name,input)=>{calls.push({name,input});return {structuredContent:{ok:true}};});
 await client.kit.capabilities();await client.kit.context();await client.kit.manifest();
 assert.deepEqual(calls.map(x=>x.name),['kit_get_capabilities','kit_get_workspace_context','kit_get_export_manifest']);
 assert.equal(client.kit.approve,undefined);assert.equal(client.boom.publish,undefined);
});
test('writer uses caller-owned context and supplied candidate/media without approvals or automatic retry',async()=>{
 const calls=[],client=createClient(async(name,input)=>{calls.push({name,input});return {structuredContent:{reviewRequired:true}};});
 const candidate={id:'fictional-slot-1',kind:'original',persona:{name:'Fixture',handle:'fixture'},text:'The repair manual needs a repair manual.'};
 const media={contentType:'image/png',dataBase64:'iVBORw0KGgo='};
 await client.boom.writerContext({authorHandle:'fixture'});await client.boom.uploadMedia(media);await client.boom.submitCandidates({candidates:[candidate]});
 assert.deepEqual(calls,[{name:'get_writer_context',input:{authorHandle:'fixture'}},{name:'upload_media',input:media},{name:'submit_candidates',input:{candidates:[candidate]}}]);
 assert.equal(client.boom.approve,undefined);assert.equal(client.boom.schedule,undefined);
 const failed=createClient(async()=>{throw Error('Connection lost');});await assert.rejects(failed.boom.submitCandidates({candidates:[candidate]}),/Connection lost/);
});
test('SDK preserves every mixed candidate outcome for explicit caller inspection',async()=>{
 const results={results:[{id:'one',status:'created'},{id:'two',status:'conflict'}],reviewRequired:true,funding:'caller_runtime'};
 let calls=0;const client=createClient(async()=>{calls++;return {structuredContent:results};});
 assert.deepEqual(await client.boom.submitCandidates({candidates:[]}),results);assert.equal(calls,1);
});

import {BOOM_OPERATIONS} from './operations.mjs';
import {createHash} from 'node:crypto';
test('every shared operation has an exact SDK method and unknown calls are refused before transport',async()=>{
 const calls=[],client=createClient(async(name,input)=>{calls.push({name,input});return {structuredContent:{ok:true}};});
 for(const [method,operation] of Object.entries(BOOM_OPERATIONS)){if(method==='publishPost')continue;const args={fixture:method};await client.boom[method](args);assert.deepEqual(calls.at(-1),{name:operation.name,input:args});}
 const before=calls.length;await assert.rejects(client.boom.call('publish_now',{}),/Unknown BoomScrolling operation/);assert.equal(calls.length,before);
});
test('tool discovery uses the supplied live host and labels the fallback snapshot',async()=>{
 const tools={tools:[{name:'get_source'}]};
 assert.equal(await createClient(async()=>{}, {listTools:async()=>tools}).boom.tools(),tools);
 assert.equal((await createClient(async()=>{}).boom.tools()).source,'contract_snapshot');
});
test('private media is read in ordered bounded chunks and verified before returning bytes',async()=>{
 const bytes=Buffer.from('fictional image bytes'),sha256=createHash('sha256').update(bytes).digest('hex'),calls=[];
 const client=createClient(async(name,args)=>{
  calls.push({name,args});const data=bytes.subarray(args.offset,args.offset+7);
  return {structuredContent:{key:'fixture',contentType:'image/png',sha256,totalBytes:bytes.length,offset:args.offset,bytes:data.length,dataBase64:data.toString('base64'),nextOffset:args.offset+data.length<bytes.length?args.offset+data.length:null}};
 });
 const file=await client.boom.readMedia({key:'fixture'});assert.deepEqual(Buffer.from(file.bytes),bytes);assert.equal(file.sha256,sha256);
 assert.deepEqual(calls.map(call=>call.args.offset),[0,7,14]);assert.ok(calls.every(call=>call.name==='download_media'&&call.args.limit===262144));
});
test('media rejects bad sizes, swapped images, invalid base64 and continuation loops without retrying',async()=>{
 const bytes=Buffer.from('small fixture'),sha256=createHash('sha256').update(bytes).digest('hex');
 for(const change of [{totalBytes:5*1024*1024+1},{bytes:1},{dataBase64:'invalid!'},{sha256:'0'.repeat(64)},{nextOffset:0},{offset:1}]){
  let calls=0;const client=createClient(async()=>{calls++;return {structuredContent:{key:'fixture',contentType:'image/png',sha256,totalBytes:bytes.length,offset:0,bytes:bytes.length,dataBase64:bytes.toString('base64'),nextOffset:null,...change}};});
  await assert.rejects(client.boom.readMedia({key:'fixture'}));assert.equal(calls,1);
 }
});

test('immediate post helper resolves the numeric target and sends exact text once',async()=>{
 const calls=[],input={requestId:'post-stable',text:'  Exact words.\nSecond line.  ',targetAccountId:'1234567890123456789',confirmed:true};
 const receipt={requestHash:'a'.repeat(64),postId:'456',url:'https://x.com/i/status/456',accountId:input.targetAccountId,evidence:'bound-create-response',textVerified:true};
 const result={...input,requestHash:'a'.repeat(64),status:'confirmed',connectionVersion:'generation',receipt};
 const client=createClient(async(name,args)=>{calls.push({name,args});return {structuredContent:name==='get_account_status'?{publication:{immediate:{ready:true,target:{userId:input.targetAccountId}}}}:result};});
 assert.deepEqual(await client.boom.postNow(input),result);
 assert.deepEqual(calls,[{name:'get_account_status',args:{}},{name:'publish_post',args:input}]);
});
test('immediate posting stops on mismatched account, unavailable readiness and missing exact consent',async()=>{
 const input={requestId:'stable',text:'Exact words',targetAccountId:'123',confirmed:true};
 for(const immediate of [{ready:true,target:{userId:'456'}},{ready:false,reason:'Write grant unavailable',target:{userId:'123'}}]){
  const calls=[],client=createClient(async name=>{calls.push(name);return {structuredContent:{publication:{immediate}}};});
  await assert.rejects(client.boom.postNow(input));assert.deepEqual(calls,['get_account_status']);
 }
 let calls=0;const client=createClient(async()=>{calls++;return {};});await assert.rejects(client.boom.postNow({...input,confirmed:false}));assert.equal(calls,0);
});
test('an uncertain publication or lost response never triggers another send',async()=>{
 const input={requestId:'stable',text:'Exact words',targetAccountId:'123',confirmed:true};
 for(const lost of [false,true]){
  const calls=[],client=createClient(async name=>{calls.push(name);if(name==='get_account_status')return {structuredContent:{publication:{immediate:{ready:true,target:{userId:'123'}}}}};if(lost)throw Error('Connection lost');return {structuredContent:{...input,status:'uncertain',receipt:null}};});
  if(lost)await assert.rejects(client.boom.postNow(input),/lost/);else assert.equal((await client.boom.postNow(input)).status,'uncertain');
  assert.deepEqual(calls,['get_account_status','publish_post']);
 }
});
test('post preparation freezes the exact text before asynchronous account inspection',async()=>{
 const original={requestId:'immutable-post',text:'The exact authorized words',targetAccountId:'123',confirmed:true},calls=[];
 const client=createClient(async(name,args)=>{
  calls.push({name,args});
  if(name==='get_account_status'){original.text='A later unrelated draft';return {structuredContent:{publication:{immediate:{ready:true,target:{userId:'123'}}}}};}
  return {structuredContent:{...args,status:'uncertain',connectionVersion:'generation',receipt:null}};
 });
 const result=await client.boom.postNow(original);assert.equal(result.text,'The exact authorized words');assert.equal(calls[1].args.text,'The exact authorized words');assert.equal(original.text,'A later unrelated draft');
});
test('a receipt that does not bind the exact request remains unresolved and is never retried',async()=>{
 const input={requestId:'receipt-fixture',text:'Exact words',targetAccountId:'123',confirmed:true},hash='a'.repeat(64);
 for(const change of [{text:'Different words'},{receipt:{requestHash:'b'.repeat(64)}},{receipt:{url:'https://x.com/i/status/999'}}]){
  const calls=[],client=createClient(async name=>{calls.push(name);if(name==='get_account_status')return {structuredContent:{publication:{immediate:{ready:true,target:{userId:'123'}}}}};
   const receipt={requestHash:hash,postId:'789',url:'https://x.com/i/status/789',accountId:'123',evidence:'bound-create-response',textVerified:true,...change.receipt};
   return {structuredContent:{...input,requestHash:hash,status:'confirmed',connectionVersion:'generation',...change,receipt}};
  });
  await assert.rejects(client.boom.postNow(input),error=>error.publicationAttempted===true);assert.deepEqual(calls,['get_account_status','publish_post']);
 }
});

test('image publication uses current media readiness and verifies the exact bound attachment receipt',async()=>{
 const sha='b'.repeat(64),media=[{key:'owner-objects/'+'a'.repeat(64)+'/'+sha+'.png',type:'photo',alt:'Exact image.'}],input={requestId:'image',text:'Exact image words.',targetAccountId:'123',confirmed:true,media},hash='c'.repeat(64);
 for(const mode of ['ready','not-ready','wrong-image']) {
  const calls=[],client=createClient(async(name,args)=>{
   calls.push(name);
   if(name==='get_account_status')return {structuredContent:{publication:{immediate:{ready:true,target:{userId:'123'},media:{ready:mode!=='not-ready',reason:'Reconnect with media.write.'}}}}};
   const receipt={requestHash:hash,postId:'789',url:'https://x.com/i/status/789',accountId:'123',evidence:'verified-post-readback',textVerified:true,mediaVerified:mode!=='wrong-image',media:[{...media[0],sha256:sha}]};
   return {structuredContent:{...args,requestHash:hash,status:'confirmed',connectionVersion:'generation',receipt}};
  });
  if(mode==='ready'){assert.equal((await client.boom.publishPost(input)).receipt.mediaVerified,true);assert.deepEqual(calls,['get_account_status','publish_post']);}
  else {await assert.rejects(client.boom.publishPost(input));assert.equal(calls.length,mode==='not-ready'?1:2);}
 }
});
