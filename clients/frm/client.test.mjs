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
