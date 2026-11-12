// Developer-only: publish the reviewed shared schema, never runtime/private data.
import {writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const source=process.argv[2];
if(!source)throw Error('Pass the reviewed BoomScrolling source checkout path.');
const destination=dirname(fileURLToPath(import.meta.url));
const {productOperations,productToolScopes}=await import(pathToFileURL(resolve(source,'worker/product-operations.mjs')).href);
const {productOpenAPI}=await import(pathToFileURL(resolve(source,'worker/product-openapi.mjs')).href);
const legacy={get_capabilities:'capabilities',get_workspace_context:'context',propose_draft:'propose',get_writer_context:'writerContext',submit_candidates:'submitCandidates',upload_media:'uploadMedia'};
const camel=name=>name.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase());
const entries=productOperations.map(operation=>[legacy[operation.name]||camel(operation.name),{name:operation.name,scope:operation.scope||productToolScopes[operation.name],http:operation.http}]);
if(entries.some(([,operation])=>!operation.scope||!operation.http))throw Error('Every product operation needs scope and HTTP metadata.');
if(new Set(entries.map(([method])=>method)).size!==entries.length)throw Error('Duplicate SDK method.');
function type(schema) {
 if(schema===true)return 'unknown';if(schema===false)return 'never';if(!schema||typeof schema!=='object')return 'unknown';
 if('$ref' in schema)throw Error('Resolve schema references before generating declarations.');
 if(Object.hasOwn(schema,'const'))return JSON.stringify(schema.const);
 if(schema.enum)return schema.enum.map(value=>JSON.stringify(value)).join(' | ');
 if(schema.oneOf||schema.anyOf)return '('+(schema.oneOf||schema.anyOf).map(type).join(' | ')+')';
 if(schema.allOf)return '('+schema.allOf.map(type).join(' & ')+')';
 if(Array.isArray(schema.type))return schema.type.map(value=>type({...schema,type:value})).join(' | ');
 if(schema.type==='string')return 'string';if(['integer','number'].includes(schema.type))return 'number';if(schema.type==='boolean')return 'boolean';if(schema.type==='null')return 'null';
 if(schema.type==='array')return `Array<${type(schema.items)}>`;
 if(schema.type==='object'||schema.properties){
  const required=new Set(schema.required||[]),fields=Object.entries(schema.properties||{}).map(([name,rule])=>`${JSON.stringify(name)}${required.has(name)?'':'?'}: ${type(rule)};`);
  if(schema.additionalProperties)fields.push(`[key: string]: ${schema.additionalProperties===true?'unknown':type(schema.additionalProperties)};`);
  return fields.length?'{ '+fields.join(' ')+' }':'Record<string, never>';
 }
 return 'unknown';
}
const registry=`// Generated from the reviewed shared product operation contract.\nconst entries=${JSON.stringify(entries,null,2)};\nexport const BOOM_OPERATIONS=Object.freeze(Object.fromEntries(entries.map(([method,operation])=>[method,Object.freeze(operation)])));\nexport const BOOM_OPERATION_SCOPES=Object.freeze(Object.fromEntries(entries.map(([,operation])=>[operation.name,operation.scope])));\nexport const BOOM_COMMANDS=Object.freeze(Object.fromEntries(entries.map(([method])=>[method.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),method])));\n`;
const declarations=`// Generated from the reviewed shared product operation contract.\nexport const BOOM_OPERATIONS: Readonly<{\n${entries.map(([method,operation])=>` ${JSON.stringify(method)}: Readonly<{name:${JSON.stringify(operation.name)};scope:${JSON.stringify(operation.scope)};http:Readonly<{method:${JSON.stringify(operation.http.method)};path:${JSON.stringify(operation.http.path)}}>}>;`).join('\n')}\n}>;\nexport const BOOM_OPERATION_SCOPES: Readonly<Record<${entries.map(([,operation])=>JSON.stringify(operation.name)).join(' | ')},string>>;\nexport const BOOM_COMMANDS: Readonly<Record<string,keyof typeof BOOM_OPERATIONS>>;\n`;
const interfaces=`// Generated input/output types. Runtime validation remains server-owned.\nexport interface OperationInputs {\n${productOperations.map(operation=>` ${JSON.stringify(operation.name)}: ${type(operation.inputSchema)};`).join('\n')}\n}\nexport interface OperationOutputs {\n${productOperations.map(operation=>` ${JSON.stringify(operation.name)}: ${type(operation.outputSchema)};`).join('\n')}\n}\nexport type OperationName=keyof OperationInputs;\n`;
await Promise.all([writeFile(join(destination,'operations.mjs'),registry),writeFile(join(destination,'operations.d.mts'),declarations),writeFile(join(destination,'contract.d.mts'),interfaces),writeFile(join(destination,'contracts/boomscrolling.openapi.json'),JSON.stringify(productOpenAPI,null,2)+'\n')]);
console.log(`Generated ${productOperations.length} BoomScrolling operations, declarations and OpenAPI snapshot.`);
