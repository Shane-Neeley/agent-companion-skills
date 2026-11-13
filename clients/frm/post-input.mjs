// One immutable exact-content request shared by SDK and CLI preparation.
export const POST_INPUT_MAX_BYTES=16384;
export const POST_REQUEST_PATTERN=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export function validatePostInput(input) {
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['text','targetAccountId','requestId','confirmed','media','mode','parentId'].includes(key)))throw Error('Use only exact post text/media/mode, a numeric target account, stable request ID and explicit confirmation.');
 const {text,targetAccountId,requestId,confirmed}=input;
 if(confirmed!==true)throw Error('Publishing requires explicit confirmed:true (--confirm in the CLI) for this exact user-directed post.');
 if(typeof requestId!=='string'||!POST_REQUEST_PATTERN.test(requestId))throw Error('Supply a stable request ID (1–128 letters, digits, dots, underscores, colons or hyphens).');
 if(typeof targetAccountId!=='string'||!/^[1-9]\d{0,19}$/.test(targetAccountId))throw Error('Supply the exact numeric X account ID; handles are not accepted.');
 if(typeof text!=='string'||!text.trim()||new TextEncoder().encode(text).byteLength>POST_INPUT_MAX_BYTES||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))throw Error('Supply valid nonempty post text without control characters.');
 // Match the service's conservative portable guard without changing the words.
 const weight=[...text.normalize('NFC')].reduce((sum,character)=>sum+(character.codePointAt(0)<128?1:2),0);
 if(weight>280)throw Error(`Shorten this original post (${weight} of 280 conservative characters).`);
 const {media,mode,parentId}=input;
 if(mode!==undefined&&!['original','quote','reply'].includes(mode))throw Error('Use original, quote or reply mode.');
 if((mode || 'original')==='original'?parentId!==undefined:typeof parentId!=='string'||!/^[1-9]\d{0,19}$/.test(parentId))throw Error('Originals omit a parent; quotes and replies require the exact numeric parentId.');
 if(media!==undefined) {
  if(!Array.isArray(media)||media.length<1||media.length>4||new Set(media.map(item=>item?.key)).size!==media.length)throw Error('Use one to four distinct account-owned image references.');
  for(const item of media)if(!item||Object.keys(item).some(key=>!['key','type','alt'].includes(key))||!/^owner-objects\/[a-f0-9]{64}\/[a-f0-9]{64}\.(png|jpg|gif|webp)$/.test(item.key)||!['photo','animated_gif'].includes(item.type)||item.alt!==undefined&&(typeof item.alt!=='string'||item.alt.length>1000))throw Error('Use uploaded owned image keys, photo/animated_gif type and optional alt text.');
  if(media.some(item=>item.type==='animated_gif')&&media.length!==1)throw Error('An animated GIF must be the only attachment.');
 }
 return Object.freeze({requestId,text,targetAccountId,confirmed:true,...(mode!==undefined?{mode}:{}),...(parentId!==undefined?{parentId}:{}),...(media?{media:Object.freeze(media.map(item=>Object.freeze({...item})))}:{})});
}
