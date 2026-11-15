import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateOperationInput,schemaErrors} from './validation.mjs';
import {BOOM_OPERATIONS} from './operations.mjs';

const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
const settings={requestId:'fixture',revision:0,enabled:true,voice:'Fictional notes.'};
test('offline validation resolves query/body aliases and preserves exact input',()=>{
 assert.equal(validateOperationInput('get-feed',{view:'home',limit:5}).valid,true);
 assert.equal(validateOperationInput('get_feed',{limit:51}).valid,false);
 const input={requestId:'fixture',targetAccountId:'12345',confirmed:true,text:'  Exact fictional words.\n',scheduledAt:1900000020000};
 const copy=structuredClone(input);
 assert.equal(validateOperationInput('queue-post',input).valid,true);assert.deepEqual(input,copy);
 assert.equal(validateOperationInput('queue_post',{...input,text:'a'.repeat(281)}).valid,false);
 assert.equal(validateOperationInput('queue_post',{...input,confirmed:false}).valid,false);
 assert.equal(validateOperationInput('queue_post',{...input,targetAccountId:'@fixture'}).valid,false);
 assert.equal(validateOperationInput('queue_post',{...input,scheduledAt:1.5}).valid,false);
 assert.throws(()=>validateOperationInput('constructor',{}),/Unknown operation/);
 for(const op of Object.values(BOOM_OPERATIONS))assert.doesNotThrow(()=>validateOperationInput(op.name,{}),op.name);
});
test('writer notes use server UTF-16 limits, retain exact content and never echo private values',()=>{
 for(const voice of ['a'.repeat(2000),'😀'.repeat(1000)])assert.equal(validateOperationInput('update_writer_settings',{...settings,voice}).valid,true);
 for(const voice of ['private'.repeat(286),'😀'.repeat(1001)]) {
  const result=validateOperationInput('update-writer-settings',{...settings,voice});
  assert.equal(result.valid,false);assert.ok(result.errors.some(e=>e.path==='$.voice'&&e.message.includes('2000')));
  assert.ok(!JSON.stringify(result).includes(voice));
 }
 assert.equal(validateOperationInput('update_writer_settings',{...settings,revision:-1}).valid,false);
 assert.equal(validateOperationInput('update_writer_settings',{...settings,private_unknown_key:'secret'}).valid,false);
 assert.ok(!JSON.stringify(validateOperationInput('update_writer_settings',{secret_name:'secret_value'})).includes('secret_'));
});
test('nested arrays, dictionaries, alternatives and unknown rules are not silently accepted',()=>{
 const rule={type:'object',properties:{rows:{type:'array',minItems:1,maxItems:2,uniqueItems:true,items:{type:'integer',minimum:1}}},required:['rows'],additionalProperties:false};
 assert.equal(schemaErrors({rows:[1,2]},rule).length,0);
 for(const value of [{rows:[1,1]},{rows:[]},{rows:[0]},{rows:[1],extra:2},{}])assert.ok(schemaErrors(value,rule).length);
 const dict={type:'object',maxProperties:1,propertyNames:{pattern:'^[a-z]+$'},additionalProperties:{type:'string',maxLength:3}};
 assert.equal(schemaErrors({key:'yes'},dict).length,0);assert.ok(schemaErrors({BAD:'long'},dict).length);
 assert.ok(schemaErrors('x',{oneOf:[{type:'string'},{type:'string'}]}).length);
 assert.throws(()=>schemaErrors('x',{format:'future-rule'}),/Unsupported/);
});
test('validate is offline and oversized live notes stop before transport or credential access',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'frm-validation-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const adapter=join(dir,'transport.mjs');await writeFile(adapter,'export async function callTool(){throw Error("NETWORK_MUST_NOT_RUN");}');
 const input=JSON.stringify({...settings,voice:'x'.repeat(2001)});
 for(const args of [['boom','validate','update-writer-settings','-'],['--transport',adapter,'boom','update-writer-settings','-'],['--transport',adapter,'boom','call','update_writer_settings','-'],['boom','update-writer-settings','-']]) {
  const r=spawnSync(process.execPath,[cli,...args],{input,encoding:'utf8',env:{...process.env,FRM_CONFIG_DIR:'/nonexistent/offline-validation-must-not-write'}});
  assert.equal(r.status,1,r.stderr);assert.equal(r.stderr,'');assert.equal(JSON.parse(r.stdout).valid,false);assert.ok(!r.stdout.includes('NETWORK_MUST_NOT_RUN'));
 }
 const valid=spawnSync(process.execPath,[cli,'boom','validate','update_writer_settings','-'],{input:JSON.stringify(settings),encoding:'utf8',env:{...process.env,FRM_CONFIG_DIR:'/nonexistent/offline-validation-must-not-write'}});
 assert.equal(valid.status,0,valid.stderr);assert.equal(JSON.parse(valid.stdout).networkUsed,false);
});
