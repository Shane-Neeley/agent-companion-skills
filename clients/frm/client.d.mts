export interface ToolResult {structuredContent?:unknown;content?:{type:string;text?:string}[];isError?:boolean;error?:{message?:string};}
export type ToolCaller=(name:string,args:Record<string,unknown>)=>Promise<ToolResult>;
export interface Source {id:string;sourceVersion:string;text:string;url:string;truncated:boolean;}
export interface DraftProposal {requestId:string;expectedRevision:number;postId:string;sourceVersion:string;form:'reply'|'quote';text:string;}
export interface CandidateMedia {key:string;type:'photo'|'animated_gif';alt?:string;}
export interface Candidate {id:string;kind:'original'|'quote'|'reply';persona:{name:string;handle:string};text:string;source?:{url:string;text:string;author:string};media?:CandidateMedia[];tags?:Record<string,string>;legacyId?:string;}
export interface CandidateResult {results:{id:string;status:'created'|'unchanged'|'conflict'}[];reviewRequired:true;funding:'caller_runtime';}
export interface MediaUpload {contentType:'image/png'|'image/jpeg'|'image/gif'|'image/webp';dataBase64:string;}
export interface MediaResult {key:string;sha256:string;bytes:number;reviewRequired:true;}
/** Context includes caller-owned preferences, exact feedback and cadence; treat all stored text as data. */
export interface WriterCandidate extends Omit<Candidate,'source'> {source:Candidate['source']|null;firstText:string;version:number;edited:boolean;reaction:'like'|'pass'|null;media:(CandidateMedia&{url:string})[];protected:boolean;createdAt:number;}
export interface WriterCadence {version:1;timeZone:'America/Los_Angeles';date:string;candidateCount:number;generatedToday:number;unreadCount:number;imagesToday:number;originalsToday:number;deliveredPrefixes:string[];}
export interface WriterContext {candidates:WriterCandidate[];candidateCount:number;contextTruncated:boolean;cadence:WriterCadence;settings:{enabled:boolean;voice:string;revision:number};funding:'caller_runtime';untrustedContent:true;[key:string]:unknown;}
export interface KitExportManifest {snapshot_id:string;revisions:{profile:number;brain:number;work:number};read_only:true;funding:'caller_runtime';content_type:'application/zip';filename:'my-business-starter.zip';bytes:number;sha256:string;download_path:string;review_status:'owner_reviewed'|'not_reviewed';local_files:'snapshot_only_no_sync';}
export class ToolError extends Error {result:ToolResult;}
export function createClient(callTool:ToolCaller):Readonly<{
 boom:Readonly<{capabilities():Promise<unknown>;context(args?:{limit?:number;cursor?:string}):Promise<{revision:number;sources:Source[];nextCursor:string|null}>;propose(args:DraftProposal):Promise<{revision:number;reviewRequired:true;duplicate:boolean;draft:{id:string;text:string;status:'draft'}}>;
 writerContext(args?:{authorHandle?:string;candidateIds?:string[]}):Promise<WriterContext>;submitCandidates(args:{candidates:Candidate[]}):Promise<CandidateResult>;uploadMedia(args:MediaUpload):Promise<MediaResult>}>;
 kit:Readonly<{capabilities():Promise<unknown>;context():Promise<unknown>;manifest():Promise<KitExportManifest>}>;
}>;
