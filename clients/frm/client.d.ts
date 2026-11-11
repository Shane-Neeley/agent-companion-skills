export interface ToolResult {structuredContent?:unknown;content?:{type:string;text?:string}[];isError?:boolean;error?:{message?:string};}
export type ToolCaller=(name:string,args:Record<string,unknown>)=>Promise<ToolResult>;
export interface Source {id:string;sourceVersion:string;text:string;url:string;truncated:boolean;}
export interface DraftProposal {requestId:string;expectedRevision:number;postId:string;sourceVersion:string;form:'reply'|'quote';text:string;}
export class ToolError extends Error {result:ToolResult;}
export function createClient(callTool:ToolCaller):Readonly<{
 boom:Readonly<{capabilities():Promise<unknown>;context(args?:{limit?:number;cursor?:string}):Promise<{revision:number;sources:Source[];nextCursor:string|null}>;propose(args:DraftProposal):Promise<{revision:number;reviewRequired:true;duplicate:boolean;draft:{id:string;text:string;status:'draft'}}>}>;
 kit:Readonly<{capabilities():Promise<unknown>;context():Promise<unknown>;manifest():Promise<unknown>}>;
}>;
