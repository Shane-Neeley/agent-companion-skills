import {readFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {BOOM_COMMANDS,BOOM_OPERATIONS} from './operations.mjs';
import {validatePostInput} from './post-input.mjs';

const contract=JSON.parse(await readFile(new URL('./contracts/boomscrolling.openapi.json',import.meta.url),'utf8'));
const keywords=new Set(['type','properties','required','additionalProperties','minLength','maxLength','pattern','minimum','maximum','enum','minItems','maxItems','items','maxProperties','propertyNames','const','uniqueItems','oneOf']);
const aliases={post:'publishPost','post-status':'getPublicationRequest','connect-x':'requestXConnection'};

export function operationSchema(name) {
 const method=Object.hasOwn(BOOM_COMMANDS,name)?BOOM_COMMANDS[name]:Object.hasOwn(aliases,name)?aliases[name]:name;
 const id=Object.hasOwn(BOOM_OPERATIONS,method)?BOOM_OPERATIONS[method].name:name;
 const operation=Object.values(contract.paths).flatMap(route=>Object.values(route)).find(op=>op.operationId===id);
 if(!operation)throw Error('Unknown operation in the local schema snapshot.');
 const body=operation.requestBody?.content?.['application/json']?.schema;
 const parameters=operation.parameters||[];
 if(parameters.some(p=>!['query','path'].includes(p.in)))throw Error('Unsupported parameter schema in the local snapshot.');
 return {operation:id,schema:body||{type:'object',properties:Object.fromEntries(parameters.map(p=>[p.name,p.schema])),required:parameters.filter(p=>p.required).map(p=>p.name),additionalProperties:false}};
}

// Only the vocabulary used by the shipped input contract is supported. Unknown
// rules fail closed so a future contract cannot silently weaken local checks.
export function schemaErrors(value,schema,path='$') {
 if(Object.keys(schema).some(k=>!keywords.has(k)))throw Error('Unsupported validation rule in the local schema snapshot.');
 const errors=[],add=message=>errors.push({path,message});
 if(schema.oneOf&&schema.oneOf.filter(s=>schemaErrors(value,s,path).length===0).length!==1)add('Must match exactly one allowed shape.');
 const types=Array.isArray(schema.type)?schema.type:[schema.type];
 const matches=type=>type===undefined||type==='null'&&value===null||type==='array'&&Array.isArray(value)||type==='object'&&value!==null&&typeof value==='object'&&!Array.isArray(value)||type==='integer'&&Number.isSafeInteger(value)||type==='number'&&typeof value==='number'&&Number.isFinite(value)||['string','boolean'].includes(type)&&typeof value===type;
 if(!types.some(matches)){add('Expected '+types.join(' or ')+'.');return errors;}
 if(Object.hasOwn(schema,'const')&&!isDeepStrictEqual(value,schema.const))add('Does not match the required constant.');
 if(schema.enum&&!schema.enum.some(item=>isDeepStrictEqual(item,value)))add('Not an allowed value.');
 if(typeof value==='string') {
  // Match the product validator's JavaScript string length (UTF-16 units),
  // including its stricter limit for astral characters; never truncate input.
  const length=value.length;
  if(schema.minLength!==undefined&&length<schema.minLength)add('Must contain at least '+schema.minLength+' characters.');
  if(schema.maxLength!==undefined&&length>schema.maxLength)add('Must contain at most '+schema.maxLength+' characters.');
  if(schema.pattern&&!new RegExp(schema.pattern,'u').test(value))add('Does not match the required format.');
 }
 if(typeof value==='number') {
  if(schema.minimum!==undefined&&value<schema.minimum)add('Must be at least '+schema.minimum+'.');
  if(schema.maximum!==undefined&&value>schema.maximum)add('Must be at most '+schema.maximum+'.');
 }
 if(Array.isArray(value)) {
  if(schema.minItems!==undefined&&value.length<schema.minItems)add('Too few items; minimum '+schema.minItems+'.');
  if(schema.maxItems!==undefined&&value.length>schema.maxItems)add('Too many items; maximum '+schema.maxItems+'.');
  if(schema.uniqueItems&&value.some((item,i)=>value.slice(0,i).some(other=>isDeepStrictEqual(item,other))))add('Items must be unique.');
  if(schema.items)value.forEach((item,i)=>errors.push(...schemaErrors(item,schema.items,path+'['+i+']')));
 }
 if(value!==null&&typeof value==='object'&&!Array.isArray(value)) {
  if(schema.maxProperties!==undefined&&Object.keys(value).length>schema.maxProperties)add('Too many properties; maximum '+schema.maxProperties+'.');
  for(const key of schema.required||[])if(!Object.hasOwn(value,key))errors.push({path:path+'.'+key,message:'Required property is missing.'});
  for(const [key,item] of Object.entries(value)) {
   // Unknown keys can themselves contain private text; don't echo them.
   if(schema.propertyNames&&schemaErrors(key,schema.propertyNames).length)add('A property name does not match the required format.');
   if(Object.hasOwn(schema.properties||{},key))errors.push(...schemaErrors(item,schema.properties[key],path+'.'+key));
   else if(schema.additionalProperties===false)add('Contains an unexpected property.');
   else if(schema.additionalProperties&&typeof schema.additionalProperties==='object')errors.push(...schemaErrors(item,schema.additionalProperties,path+'.*'));
  }
 }
 return errors;
}

export function validateOperationInput(name,input) {
 const {operation,schema}=operationSchema(name),errors=schemaErrors(input,schema);
 if(!errors.length&&['publish_post','queue_post'].includes(operation)) {
  const {scheduledAt,...post}=input;void scheduledAt;
  try {validatePostInput(post);}catch(error){errors.push({path:'$',message:error.message});}
 }
 return {source:'contract_snapshot',operation,valid:errors.length===0,errors,networkUsed:false,checks:'Local shape and post-text constraints only; server access, current revision, slots and readiness remain authoritative.'};
}
