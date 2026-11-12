import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
test('help and an empty command explain the writer path without touching credentials',()=>{
 for(const args of [[],['--help'],['-h'],['help']]) {
  const result=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',env:{...process.env,FRM_CONFIG_DIR:'/a/nonexistent/help-must-not-write-here'}});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/fictional offline writer loop/);
  assert.match(result.stdout,/submit-candidates @FILE/);
  assert.match(result.stdout,/No command approves or publishes/);
  assert.match(result.stdout,/your doomscrolling time isn’t valuable\. your boomscrolling time is\./);
  assert.ok(!result.stdout.includes('\u001b['));
  assert.equal(result.stderr,'');
 }
});
test('CLI reads saved packets, stdin and image files without putting bytes in command arguments',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-cli-fixture-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const adapter=join(directory,'trusted-adapter.mjs');
 await writeFile(adapter,'export async function callTool(name,args){return {structuredContent:{name,args}};}');
 const packet={candidates:[{id:'fictional-one',kind:'original',persona:{name:'Fixture',handle:'fixture'},text:'Original fixture words'}]};
 const path=join(directory,'packet.json');await writeFile(path,JSON.stringify(packet));
 const run=(operation,payload,input)=>spawnSync(process.execPath,[cli,'--transport',adapter,'boom',operation,payload],{input,encoding:'utf8'});
 for(const [payload,input] of [['@'+path,undefined],['-',JSON.stringify(packet)]]){
  const result=run('submit-candidates',payload,input);assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),{name:'submit_candidates',args:packet});
 }
 const image=join(directory,'fixture.png'),bytes=Buffer.from([137,80,78,71,13,10,26,10]);await writeFile(image,bytes);
 const media=run('upload-media',image);assert.equal(media.status,0,media.stderr);
 assert.deepEqual(JSON.parse(media.stdout),{name:'upload_media',args:{contentType:'image/png',dataBase64:bytes.toString('base64')}});
 const invalid=run('submit-candidates','-','not json');assert.notEqual(invalid.status,0);assert.equal(invalid.stdout,'');
 const large=run('submit-candidates','-',JSON.stringify({text:'x'.repeat(8*1024*1024)}));assert.notEqual(large.status,0);assert.equal(large.stdout,'');
});
test('offline demo saves one fictional candidate and reads its exact stable ID back',()=>{
 const result=spawnSync(process.execPath,[cli,'--demo'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const data=JSON.parse(result.stdout);assert.equal(data.readback.candidates[0].id,'fictional-demo-slot-1');
 assert.deepEqual(data.calls.map(item=>item.name),['get_writer_context','submit_candidates','get_writer_context']);
 assert.equal(data.calls.some(item=>/publish|approve/.test(item.name)),false);
});
test('CLI retains mixed candidate results and exits nonzero when any ID conflicts',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-cli-conflict-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const adapter=join(directory,'trusted-adapter.mjs');
 const result={results:[{id:'new-id',status:'created'},{id:'saved-id',status:'unchanged'},{id:'edited-id',status:'conflict'}],reviewRequired:true,funding:'caller_runtime'};
 await writeFile(adapter,'export async function callTool(){return {structuredContent:'+JSON.stringify(result)+'};}');
 const child=spawnSync(process.execPath,[cli,'--transport',adapter,'boom','submit-candidates','-'],{input:JSON.stringify({candidates:[]}),encoding:'utf8'});
 assert.equal(child.status,1);assert.deepEqual(JSON.parse(child.stdout),result);assert.match(child.stderr,/Inspect every result/);
});

import {readFile,stat as fileStat} from 'node:fs/promises';
import {BOOM_COMMANDS,BOOM_OPERATIONS} from './operations.mjs';
import {createHash} from 'node:crypto';
test('every shared operation maps to an exact CLI alias and generic calls preserve arguments',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-cli-mapping-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const adapter=join(directory,'trusted-adapter.mjs');await writeFile(adapter,'export async function callTool(name,args){return {structuredContent:{name,args}};} export async function listTools(){return {tools:[{name:"get_source"}]};}');
 for(const [command,method] of Object.entries(BOOM_COMMANDS)){
  const result=spawnSync(process.execPath,[cli,'--transport',adapter,'boom',command,'{"fixture":true}'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{name:BOOM_OPERATIONS[method].name,args:{fixture:true}});
 }
 const generic=spawnSync(process.execPath,[cli,'--json','--transport',adapter,'boom','call','get_source','{"sourceId":"exact"}'],{encoding:'utf8'});assert.deepEqual(JSON.parse(generic.stdout),{name:'get_source',args:{sourceId:'exact'}});assert.equal(generic.stderr,'');
 const tools=spawnSync(process.execPath,[cli,'--transport',adapter,'boom','tools'],{encoding:'utf8'});assert.deepEqual(JSON.parse(tools.stdout),{tools:[{name:'get_source'}]});
 const rest=join(directory,'rest.mjs');await writeFile(rest,'export async function requestOperation(name,args){return {name,args,rest:true};}');
 const direct=spawnSync(process.execPath,[cli,'--rest','--transport',rest,'boom','get-source','{"sourceId":"exact"}'],{encoding:'utf8'});assert.equal(direct.status,0,direct.stderr);assert.deepEqual(JSON.parse(direct.stdout),{name:'get_source',args:{sourceId:'exact'},rest:true});
});

test('media output is complete, verified, private, and never overwrites an existing file',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-cli-download-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const adapter=join(directory,'trusted-adapter.mjs'),bytes=Buffer.from('fictional complete image'),sha256=createHash('sha256').update(bytes).digest('hex');
 await writeFile(adapter,`const bytes=Buffer.from(${JSON.stringify(bytes.toString('base64'))},'base64'); export async function callTool(name,args){const data=bytes.subarray(args.offset,args.offset+7);return {structuredContent:{key:args.key,offset:args.offset,totalBytes:bytes.length,bytes:data.length,dataBase64:data.toString('base64'),contentType:'image/png',sha256:${JSON.stringify(sha256)},nextOffset:args.offset+data.length<bytes.length?args.offset+data.length:null}};}`);
 const path=join(directory,'image.png'),run=()=>spawnSync(process.execPath,[cli,'--transport',adapter,'boom','download-media','{"key":"fixture"}','--output',path],{encoding:'utf8'});
 const child=run();assert.equal(child.status,0,child.stderr);assert.deepEqual(await readFile(path),bytes);assert.equal(JSON.parse(child.stdout).sha256,sha256);
 if(process.platform!=='win32')assert.equal((await fileStat(path)).mode&0o777,0o600);
 const second=run();assert.notEqual(second.status,0);assert.deepEqual(await readFile(path),bytes);assert.equal(second.stdout,'');
});

test('full file exports gather every collection and page; changed snapshots leave no destination',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-cli-export-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const adapter=join(directory,'trusted-adapter.mjs');
 await writeFile(adapter,`export async function callTool(name,args){return {structuredContent:{collection:args.collection,revision:4,records:[{fixture:args.cursor?'second':'first'}],nextCursor:args.cursor?null:'next-'+args.collection}};}`);
 const path=join(directory,'workspace.json');const child=spawnSync(process.execPath,[cli,'--transport',adapter,'boom','export-workspace','{}','--output',path],{encoding:'utf8'});assert.equal(child.status,0,child.stderr);
 const data=JSON.parse(await readFile(path,'utf8'));assert.equal(data.allCollections,true);assert.deepEqual(data.exports.map(section=>section.collection),['sources','drafts','history','feedback','exposures']);assert.ok(data.exports.every(section=>section.pages.length===2&&section.complete));
 const bad=join(directory,'bad-adapter.mjs');await writeFile(bad,`export async function callTool(name,args){return {structuredContent:{collection:args.collection,watermark:args.cursor?'changed':'first',records:[],nextCursor:args.cursor?null:'next'}};}`);
 const badPath=join(directory,'must-not-exist.json'),failed=spawnSync(process.execPath,[cli,'--transport',bad,'boom','export-writer-data','{"collection":"events"}','--output',badPath],{encoding:'utf8'});assert.notEqual(failed.status,0);assert.equal(failed.stdout,'');await assert.rejects(fileStat(badPath),error=>error.code==='ENOENT');
});

test('JSON help and local writing/card helpers work without account access',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'frm-cli-local-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const help=spawnSync(process.execPath,[cli,'--json','--help'],{encoding:'utf8'});assert.equal(JSON.parse(help.stdout).tagline,'your doomscrolling time isn’t valuable. your boomscrolling time is.');assert.equal(help.stderr,'');
 const link=spawnSync(process.execPath,[cli,'boom','compose','{"form":"reply","sourceUrl":"https://x.com/fixture/status/123","text":"Exact words"}'],{encoding:'utf8',env:{...process.env,FRM_CONFIG_DIR:'/a/nonexistent/local-help-must-not-write'}});assert.equal(link.status,0,link.stderr);assert.equal(JSON.parse(link.stdout).sends,false);
 const card=join(directory,'card.svg'),image=spawnSync(process.execPath,[cli,'boom','take-card','{"text":"My own words","author":"Fixture"}','--output',card],{encoding:'utf8'});assert.equal(image.status,0,image.stderr);assert.match(await readFile(card,'utf8'),/My own words/);
});
