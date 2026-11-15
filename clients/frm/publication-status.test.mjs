import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {publicationExit,publicationStatusExit} from './post.mjs';

const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
const queued={requestId:'fictional-queue',status:'queued',targetAccountId:'123',connectionVersion:'fictional-generation',text:'Fictional queue words.',requestHash:'a'.repeat(64),mode:'original',parentId:null,media:[],scheduledAt:1800000000000,receipt:null,postId:null,reason:null,attempted:false,confirmed:false,publicationVerified:false,independentReadback:false,retryAuthorized:false};
const canceled={...queued,status:'canceled',reason:'Canceled before submission.'};

test('reading healthy queued and canceled records succeeds without satisfying immediate publication',()=>{
 for(const result of [queued,canceled]){
  assert.deepEqual(publicationStatusExit(result,result.requestId),{code:0,message:''});
  assert.equal(publicationExit(result).code,2);
 }
 const quote={...queued,mode:'quote',parentId:'456'};
 assert.equal(publicationStatusExit(quote,quote.requestId).code,0);
 assert.equal(publicationStatusExit({...queued,scheduledAt:1800000000001},queued.requestId).code,0);
});
test('contradictory, malformed, mismatched and blocked unsent records stay unresolved',()=>{
 const patches=[
  {requestId:'different-key'},{requestHash:'bad'},{targetAccountId:'@fixture'},{text:''},{text:'x'.repeat(281)},
  {connectionVersion:null},{scheduledAt:null},{scheduledAt:1.5},{scheduledAt:NaN},
  {attempted:true},{attempted:null},{confirmed:true},{publicationVerified:true},{independentReadback:true},{retryAuthorized:true},
  {receipt:{}},{postId:'456'},{reason:'Waiting for account gap.'},{mode:'reply',parentId:null},{mode:'original',parentId:'456'},
  {mode:undefined},{parentId:undefined},{media:undefined},{media:[{key:'not-owned',type:'photo'}]},
  {status:'blocked',reason:'Not ready.'},{status:'uncertain'},{status:'submitting'},
 ];
 for(const patch of patches)assert.equal(publicationStatusExit({...queued,...patch},queued.requestId).code,2,JSON.stringify(patch));
 for(const key of ['attempted','confirmed','publicationVerified','independentReadback','retryAuthorized','receipt','postId']){
  const incomplete={...queued};delete incomplete[key];assert.equal(publicationStatusExit(incomplete,queued.requestId).code,2,key);
 }
 assert.equal(publicationStatusExit({...canceled,reason:null},queued.requestId).code,2);
 assert.equal(publicationStatusExit({...canceled,attempted:true},queued.requestId).code,2);
});
test('status lookup retains confirmed receipt checks and a matching rejected result',()=>{
 const receipt={requestHash:queued.requestHash,postId:'456',url:'https://x.com/i/status/456',accountId:queued.targetAccountId,textVerified:true,evidence:'bound-create-response'};
 const confirmed={...queued,status:'confirmed',receipt,postId:'456',attempted:true,confirmed:true,publicationVerified:true};
 assert.equal(publicationStatusExit(confirmed,queued.requestId).code,0);
 assert.equal(publicationStatusExit({...confirmed,receipt:{...receipt,textVerified:false}},queued.requestId).code,2);
 assert.equal(publicationStatusExit({...confirmed,receipt:{...receipt,accountId:'789'}},queued.requestId).code,2);
 assert.equal(publicationStatusExit(confirmed,'another-request').code,2);
 assert.equal(publicationStatusExit({requestId:queued.requestId,status:'rejected'},queued.requestId).code,1);
});
test('every status alias and both transports return healthy unsent JSON without a send',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-status-fixture-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const adapter=join(directory,'adapter.mjs'),fixture=join(directory,'result.json'),calls=join(directory,'calls.jsonl');
 await writeFile(adapter,`import {readFile,appendFile} from 'node:fs/promises';
 async function lookup(name,args){await appendFile(${JSON.stringify(calls)},JSON.stringify({name,args})+'\\n');if(name!=='get_publication_request')throw Error('Status must never send or preflight');return JSON.parse(await readFile(${JSON.stringify(fixture)},'utf8'));}
 export async function callTool(name,args){return {structuredContent:await lookup(name,args)};}
 export const requestOperation=lookup;`);
 const aliases=[['post-status',queued.requestId],...['get-publication-request','getPublicationRequest'].map(command=>[command,JSON.stringify({requestId:queued.requestId})]),['call','get_publication_request',JSON.stringify({requestId:queued.requestId})]];
 for(const result of [queued,canceled]){
  await writeFile(fixture,JSON.stringify(result));
  for(const rest of [false,true])for(const alias of aliases){
   const child=spawnSync(process.execPath,[cli,...(rest?['--rest']:[]),'--transport',adapter,'boom',...alias],{encoding:'utf8'});
   assert.equal(child.status,0,child.stderr);assert.equal(child.stderr,'');assert.deepEqual(JSON.parse(child.stdout),result);
  }
 }
 for(const result of [{...queued,status:'blocked',reason:'Not ready.'},{...queued,status:'uncertain',attempted:true},{...queued,receipt:{}},{...queued,requestId:'wrong-request'}]){
  await writeFile(fixture,JSON.stringify(result));
  const child=spawnSync(process.execPath,[cli,'--transport',adapter,'boom','post-status',queued.requestId],{encoding:'utf8'});
  assert.equal(child.status,2);assert.deepEqual(JSON.parse(child.stdout),result);assert.match(child.stderr,/do not submit/);
 }
 const observed=(await readFile(calls,'utf8')).trim().split('\n').map(JSON.parse);
 assert.equal(observed.length,20);
 assert.ok(observed.every(call=>call.name==='get_publication_request'&&call.args.requestId===queued.requestId));
});
