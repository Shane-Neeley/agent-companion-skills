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
  assert.match(result.stdout,/never generates, approves or publishes/);
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
