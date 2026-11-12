import test from 'node:test';
import assert from 'node:assert/strict';
import {composeLink,shareLink,profileLink,writingContext,takeCard} from './helpers.mjs';
import {boomMasthead,terminalBrand,BOOM_TAGLINE} from './terminal.mjs';
import {createHash} from 'node:crypto';

test('the exact BoomScrolling line is human-only, honors color choice and JSON suppression',()=>{
 assert.equal(BOOM_TAGLINE,'your doomscrolling time isn’t valuable. your boomscrolling time is.');
 assert.ok(boomMasthead().includes(BOOM_TAGLINE));assert.ok(!boomMasthead().includes('\u001b['));assert.ok(boomMasthead({color:true}).includes('\u001b['));
 const output=[],stream={isTTY:true,write:value=>output.push(value)};
 terminalBrand(stream,{env:{NO_COLOR:''}});assert.ok(!output[0].includes('\u001b['));
 terminalBrand(stream,{json:true});assert.equal(output.length,1);
 terminalBrand({...stream,isTTY:false});assert.equal(output.length,1);
});
test('manual links preserve exact words and original parents without sending',()=>{
 const sourceUrl='https://x.com/fixture/status/123';
 const reply=composeLink({form:'reply',sourceUrl,text:'Exact words & punctuation.'}),url=new URL(reply.url);
 assert.equal(url.searchParams.get('in_reply_to'),'123');assert.equal(url.searchParams.get('text'),'Exact words & punctuation.');assert.equal(reply.sends,false);
 assert.equal(new URL(composeLink({form:'quote',sourceUrl,text:'Quote'}).url).searchParams.get('url'),'https://x.com/i/status/123');
 assert.equal(shareLink({sourceUrl}).url,'https://x.com/i/status/123');
 assert.equal(shareLink({url:'https://example.invalid/article'}).url,'https://example.invalid/article');
 assert.deepEqual(profileLink({handle:'fixture'}),{url:'https://x.com/fixture',action:'View or follow this account on X',sends:false});
 for(const sourceUrl of ['javascript:alert(1)','https://x.com.attacker.test/fixture/status/123','https://x.com@attacker.test/fixture/status/123'])assert.throws(()=>composeLink({form:'reply',sourceUrl,text:'No'}));
});
test('writing recipes are local prompts and the SVG export escapes supplied text',()=>{
 const context=writingContext({sourceText:'Source',intent:'My point',draft:'My draft',approach:'shorter'});
 assert.match(context.prompt,/Cut filler/);assert.equal(context.sends,false);assert.equal(new URL(context.chatgptUrl).searchParams.get('q'),context.prompt);
 const card=takeCard({text:'<script>alert("no")</script>',author:'Fixture & author'}),bytes=Buffer.from(card.dataBase64,'base64');
 assert.equal(card.bytes,bytes.length);assert.equal(createHash('sha256').update(bytes).digest('hex'),card.sha256);assert.ok(!bytes.toString().includes('<script>'));assert.match(bytes.toString(),/Fixture &amp; author/);
});
