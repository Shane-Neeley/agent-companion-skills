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
