import {readFile,stat} from 'node:fs/promises';
import {validatePostInput,POST_INPUT_MAX_BYTES,POST_REQUEST_PATTERN} from './post-input.mjs';
const maxBytes=POST_INPUT_MAX_BYTES,requestPattern=POST_REQUEST_PATTERN;
export const validatePostArguments=validatePostInput;
function decode(bytes) {
 if(bytes.byteLength>maxBytes)throw Error('Post text is limited to 16 KiB before the character check.');
 try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw Error('Post text must contain valid UTF-8.');}
}
export async function parsePostArguments(tokens,{stdin=process.stdin}={}) {
 const values={},sources=[];
 for(let index=0;index<tokens.length;index++) {
  const flag=tokens[index];
  if(!['--text','--text-file','--stdin','--account','--request-id','--confirm','--media-file','--mode','--parent'].includes(flag))throw Error('Use post --text TEXT|--text-file FILE|--stdin [--media-file JSON_FILE] [--mode original|quote|reply --parent ID] --account NUMERIC_ID --request-id KEY --confirm.');
  if(Object.hasOwn(values,flag))throw Error('Do not repeat post flags.');
  if(['--stdin','--confirm'].includes(flag))values[flag]=true;
  else {if(index+1>=tokens.length)throw Error('Supply a value after '+flag+'.');values[flag]=tokens[++index];}
  if(['--text','--text-file','--stdin'].includes(flag))sources.push(flag);
 }
 if(sources.length!==1)throw Error('Choose exactly one of --text, --text-file or --stdin.');
 let text;
 if(sources[0]==='--text')text=values['--text'];
 if(sources[0]==='--text-file') {
  if((await stat(values['--text-file'])).size>maxBytes)throw Error('Post text files are limited to 16 KiB.');
  text=decode(await readFile(values['--text-file']));
 }
 if(sources[0]==='--stdin') {
  const chunks=[];let length=0;
  for await(const chunk of stdin){length+=chunk.length;if(length>maxBytes)throw Error('Post stdin is limited to 16 KiB.');chunks.push(chunk);}
  text=decode(Buffer.concat(chunks));
 }
 let media;
 if(values['--media-file']!==undefined){if((await stat(values['--media-file'])).size>16384)throw Error('The media reference file is limited to 16 KiB.');media=JSON.parse(await readFile(values['--media-file'],'utf8'));}
 return validatePostArguments({text,targetAccountId:values['--account'],requestId:values['--request-id'],confirmed:values['--confirm']===true,...(media!==undefined?{media}:{}),...(values['--mode']!==undefined?{mode:values['--mode']}:{}),...(values['--parent']!==undefined?{parentId:values['--parent']}:{})});
}
export function postStatusArguments(tokens) {
 if(tokens.length!==1||!requestPattern.test(tokens[0]||''))throw Error('Use post-status STABLE_REQUEST_ID.');
 return {requestId:tokens[0]};
}
export function publicationExit(result) {
 if(result?.status==='confirmed'&&(result.media?.length&&result.receipt?.mediaVerified!==true||result.mode&&result.mode!=='original'&&result.receipt?.parentVerified!==true))return {code:2,message:'The retained result does not verify the exact media or native parent. Inspect status; do not resend.'};
 if(result?.status==='confirmed'&&typeof result.receipt?.postId==='string'&&/^[1-9]\d{0,19}$/.test(result.receipt.postId)&&result.receipt.url==='https://x.com/i/status/'+result.receipt.postId&&result.receipt.accountId===result.targetAccountId&&/^[a-f0-9]{64}$/.test(result.requestHash||'')&&result.receipt.requestHash===result.requestHash&&result.receipt.textVerified===true&&['bound-create-response','verified-post-readback'].includes(result.receipt.evidence))return {code:0,message:''};
 if(result?.status==='rejected')return {code:1,message:'The service rejected this request. Inspect the reason and current readiness; do not blindly resend.'};
 return {code:2,message:`Publication is ${result?.status||'unresolved'}. Inspect boom post-status ${result?.requestId||'YOUR_REQUEST_ID'}; do not submit a new send.`};
}
export function connectXArguments(tokens) {
 const input={};
 for(let index=0;index<tokens.length;index++) {
  const flag=tokens[index];
  if(flag==='--posting'){if(input.posting!==undefined)throw Error('Do not repeat --posting.');input.posting=true;}
  else if(flag==='--media'){if(input.media!==undefined)throw Error('Do not repeat --media.');input.media=true;}
  else if(flag==='--confirm'){if(input.confirmed)throw Error('Do not repeat --confirm.');input.confirmed=true;}
  else if(flag==='--request-id'){if(input.requestId!==undefined||index+1>=tokens.length)throw Error('Supply one stable --request-id.');input.requestId=tokens[++index];}
  else throw Error('Use connect-x [--posting [--media]] --request-id STABLE_KEY --confirm.');
 }
 if(input.confirmed!==true||!requestPattern.test(input.requestId||''))throw Error('Use connect-x [--posting] --request-id STABLE_KEY --confirm.');
 if(input.media&&!input.posting)throw Error('--media also requires explicit --posting.');
 return input;
}
