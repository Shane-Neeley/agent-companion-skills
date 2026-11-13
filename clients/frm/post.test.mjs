import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parsePostArguments,validatePostArguments,postStatusArguments,publicationExit,connectXArguments} from './post.mjs';

const flags=['--account','1234567890123456789','--request-id','exact-post-1','--confirm'];
test('publish inputs preserve exact text, Unicode form, file whitespace and stdin',async t=>{
 const text='  Cafe\u0301 & repair.\r\nSecond line.  ';
 const expected={text,targetAccountId:flags[1],requestId:'exact-post-1',confirmed:true};
 assert.deepEqual(await parsePostArguments(['--text',text,...flags]),expected);
 assert.deepEqual(await parsePostArguments(['--stdin',...flags],{stdin:Readable.from([Buffer.from(text)])}),expected);
 const directory=await mkdtemp(join(tmpdir(),'boom-post-text-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const file=join(directory,'text.txt');await writeFile(file,text);
 assert.deepEqual(await parsePostArguments(['--text-file',file,...flags]),expected);
 const invalid=join(directory,'invalid.txt');await writeFile(invalid,Buffer.from([0xff,0xfe]));await assert.rejects(parsePostArguments(['--text-file',invalid,...flags]),/UTF-8/);
});
test('publish refuses missing confirmation, ambiguous sources, handles and invalid request IDs before delivery',async()=>{
 for(const args of [
  ['--text','Exact words','--account',flags[1],'--request-id','stable'],
  ['--text','Words','--stdin',...flags],['--stdin','--stdin',...flags],
  ['--text','Words','--account','@fixture','--request-id','stable','--confirm'],
  ['--text','Words','--account',flags[1],'--request-id','bad key','--confirm'],
  ['--text','',...flags],['--text','x'.repeat(281),...flags],['--text','é'.repeat(141),...flags],
  ['--text','Words','--media','file.png',...flags],
 ])await assert.rejects(parsePostArguments(args));
 assert.throws(()=>validatePostArguments({text:'Words',targetAccountId:flags[1],requestId:'stable',confirmed:true,sourceUrl:'https://x.com/fixture/status/1'}));
 assert.deepEqual(postStatusArguments(['exact-post-1']),{requestId:'exact-post-1'});assert.throws(()=>postStatusArguments(['exact-post-1','--confirm']));
});
test('publication status distinguishes confirmed receipt evidence from an unresolved send',()=>{
 const confirmed={requestHash:'a'.repeat(64),requestId:'stable',status:'confirmed',targetAccountId:flags[1],receipt:{requestHash:'a'.repeat(64),postId:'456',url:'https://x.com/i/status/456',accountId:flags[1],textVerified:true,evidence:'bound-create-response'}};
 assert.equal(publicationExit(confirmed).code,0);
 assert.equal(publicationExit({...confirmed,receipt:{...confirmed.receipt,evidence:'verified-post-readback'}}).code,0);
 for(const status of ['preparing','submitting','uncertain','held']){const state=publicationExit({requestId:'stable',status});assert.equal(state.code,2);assert.match(state.message,/post-status stable/);assert.match(state.message,/do not submit/);}
 assert.equal(publicationExit({status:'rejected'}).code,1);
 assert.equal(publicationExit({...confirmed,receipt:null}).code,2);
});

 test('write-authorization setup is explicit and defaults to the read-only connection purpose',()=>{
 assert.deepEqual(connectXArguments(['--request-id','stable','--confirm']),{requestId:'stable',confirmed:true});
 assert.deepEqual(connectXArguments(['--posting','--request-id','write-stable','--confirm']),{posting:true,requestId:'write-stable',confirmed:true});
 assert.throws(()=>connectXArguments(['--posting','--request-id','stable']));
 });

test('image and native-parent inputs preserve exact owned references and request separate media consent',async t=>{
 const media=[{key:'owner-objects/'+'a'.repeat(64)+'/'+'b'.repeat(64)+'.png',type:'photo',alt:'Exact alt text.'}];
 const directory=await mkdtemp(join(tmpdir(),'boom-post-media-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const file=join(directory,'media.json');await writeFile(file,JSON.stringify(media));
 const result=await parsePostArguments(['--text','Exact words','--media-file',file,'--mode','quote','--parent','456',...flags]);
 assert.deepEqual(result.media,media);assert.equal(result.mode,'quote');assert.equal(result.parentId,'456');assert.ok(Object.isFrozen(result.media[0]));
 assert.throws(()=>validatePostArguments({...result,parentId:undefined}));
 assert.throws(()=>validatePostArguments({...result,media:[{...media[0],key:'https://example.com/not-owned.png'}]}));
 assert.throws(()=>validatePostArguments({...result,mode:'original'}));
 assert.deepEqual(connectXArguments(['--posting','--media','--request-id','image-consent','--confirm']),{posting:true,media:true,requestId:'image-consent',confirmed:true});
 assert.throws(()=>connectXArguments(['--media','--request-id','image-consent','--confirm']));
});
