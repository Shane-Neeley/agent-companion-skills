import {validatePostInput} from './post-input.mjs';
import {BOOM_OPERATIONS,BOOM_OPERATION_SCOPES} from './operations.mjs';
export {BOOM_OPERATIONS} from './operations.mjs';
// A host supplies an already-authorized MCP call. Credentials stay in the host.
export class ToolError extends Error {
  constructor(message, result) { super(message); this.name='ToolError'; this.result=result; }
}
export function createClient(callTool,{listTools,requestOperation}={}) {
  if (typeof callTool !== 'function') throw new TypeError('Supply an authenticated callTool(name, arguments) function.');
  async function call(name,args={}) {
    const result=await callTool(name,args);
    let data=result.structuredContent;
    if (data===undefined && Array.isArray(result.content)) {
      const text=result.content.find(item=>item.type==='text')?.text;
      if (text) { try {data=JSON.parse(text);} catch {data={message:text};} }
    }
    if (result.isError || result.error) throw new ToolError(data?.error || data?.message || result.error?.message || 'The tool failed.',result);
    return data===undefined?result:data;
  }
  async function boomCall(name,args={}) {
    if(!Object.hasOwn(BOOM_OPERATION_SCOPES,name))throw new TypeError('Unknown BoomScrolling operation. Update the contract snapshot or use a supported operation.');
    return call(name,args);
  }
  async function postNow(args) {
    args=validatePostInput(args);
    const preflightError=message=>Object.assign(new Error(message),{publicationAttempted:false});
    let current;try{current=await boomCall('get_account_status');}catch(error){error.publicationAttempted=false;throw error;}
    const immediate=current?.publication?.immediate;
    if(immediate?.ready!==true)throw preflightError(immediate?.reason||'Immediate posting is unavailable for this connected account.');
    if(!immediate.target?.userId||String(immediate.target.userId)!==args.targetAccountId)throw preflightError('The connected numeric X account differs from this requested target. Read account status before publishing.');
    if(args.media?.length&&immediate.media?.ready!==true)throw preflightError(immediate.media?.reason||'Image publication is unavailable for this grant or media budget.');
    if(args.mode&&args.mode!=='original'&&immediate.modes?.[args.mode]?.ready!==true)throw preflightError(immediate.modes?.[args.mode]?.reason||'This native publication mode is unavailable.');
    let result;try{result=await boomCall('publish_post',args);}catch(error){error.publicationAttempted=error.resourceRequestSent!==false&&error.result?.structuredContent?.code!=='SCOPE_REQUIRED';throw error;}
    const resultError=message=>Object.assign(new Error(message),{publicationAttempted:true});
    if(result?.requestId!==args.requestId||result?.targetAccountId!==args.targetAccountId||result?.text!==args.text)throw resultError('The publication result does not match the exact request. Inspect its status; do not resend.');
    if(result.status==='confirmed') {
      const receipt=result.receipt;
      if(!receipt||!/^[a-f0-9]{64}$/.test(result.requestHash||'')||receipt.requestHash!==result.requestHash||receipt.accountId!==args.targetAccountId||receipt.textVerified!==true||!['bound-create-response','verified-post-readback'].includes(receipt.evidence)||typeof receipt.postId!=='string'||!/^\d+$/.test(receipt.postId)||receipt.url!=='https://x.com/i/status/'+receipt.postId)throw resultError('The publication receipt is not bound to the exact requested text/account. Inspect status; do not resend.');
      if(args.media?.length&&(receipt.mediaVerified!==true||receipt.media?.length!==args.media.length||!receipt.media.every((item,i)=>item.key===args.media[i].key&&item.type===args.media[i].type&&(item.alt || '')===(args.media[i].alt || '')&&item.key.includes('/'+item.sha256+'.'))))throw resultError('The receipt does not verify the exact attached images. Inspect status; do not resend.');
      if(args.mode&&args.mode!=='original'&&(receipt.mode!==args.mode||receipt.parentId!==args.parentId||receipt.parentVerified!==true))throw resultError('The receipt does not verify the exact native parent. Inspect status; do not resend.');
    }
    return result;
  }
  async function readMedia({key}, {maxBytes=5*1024*1024}={}) {
    if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>5*1024*1024)throw new TypeError('Media downloads are limited to 5 MiB.');
    const chunks=[];let offset=0,totalBytes,sha256,contentType;
    do {
      if(chunks.length>=1024)throw Error('Media download exceeded its bounded chunk count.');
      const chunk=await boomCall('download_media',{key,offset,limit:262144});
      if(!chunk||chunk.key!==key||chunk.offset!==offset||!Number.isSafeInteger(chunk.totalBytes)||chunk.totalBytes<1||chunk.totalBytes>maxBytes||!Number.isSafeInteger(chunk.bytes)||chunk.bytes<1||chunk.bytes>262144||typeof chunk.dataBase64!=='string'||chunk.dataBase64.length!==Math.ceil(chunk.bytes/3)*4||typeof chunk.sha256!=='string'||!/^[a-f0-9]{64}$/.test(chunk.sha256)||!['image/png','image/jpeg','image/gif','image/webp'].includes(chunk.contentType))throw Error('Invalid media download chunk.');
      let binary;try{binary=atob(chunk.dataBase64);}catch{throw Error('Invalid media base64.');}
      // A plain loop decodes each chunk far faster than a per-character callback.
      const bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
      if(btoa(binary)!==chunk.dataBase64||bytes.length!==chunk.bytes||offset+chunk.bytes>chunk.totalBytes)throw Error('Media download bytes differ from the chunk manifest.');
      if(offset===0){totalBytes=chunk.totalBytes;sha256=chunk.sha256;contentType=chunk.contentType;}
      if(totalBytes!==chunk.totalBytes||sha256!==chunk.sha256||contentType!==chunk.contentType)throw Error('Media changed during download.');
      offset+=bytes.length;chunks.push(bytes);
      if(chunk.nextOffset!==(offset<totalBytes?offset:null))throw Error('Invalid media download continuation.');
    } while(offset<totalBytes);
    const bytes=new Uint8Array(totalBytes);let start=0;for(const chunk of chunks){bytes.set(chunk,start);start+=chunk.length;}
    const actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');
    if(actual!==sha256)throw Error('Media download checksum differs from the manifest.');
    return {key,contentType,sha256,bytes};
  }
  return Object.freeze({
    boom:Object.freeze({...Object.fromEntries(Object.entries(BOOM_OPERATIONS).map(([method,operation])=>[method,(args={})=>boomCall(operation.name,args)])),
      call:boomCall,postNow,publishPost:postNow,rest:async(name,args={})=>{if(!Object.hasOwn(BOOM_OPERATION_SCOPES,name))throw new TypeError('Unknown BoomScrolling operation.');if(!requestOperation)throw new TypeError('Supply the authorized product REST transport.');return requestOperation(name,args);},readMedia,tools:async()=>listTools?listTools():{tools:Object.values(BOOM_OPERATIONS),source:'contract_snapshot'}}),
    kit:Object.freeze({capabilities:()=>call('kit_get_capabilities'),context:()=>call('kit_get_workspace_context'),manifest:()=>call('kit_get_export_manifest')}),
  });
}
