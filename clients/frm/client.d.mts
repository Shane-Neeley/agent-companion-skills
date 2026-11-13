import type {BOOM_OPERATIONS} from './operations.mjs';
import type {OperationInputs,OperationOutputs,OperationName} from './contract.mjs';
export type {OperationInputs,OperationOutputs,OperationName} from './contract.mjs';
export {BOOM_OPERATIONS} from './operations.mjs';
export interface ToolResult {structuredContent?:unknown;content?:{type:string;text?:string}[];isError?:boolean;error?:{message?:string};}
export type ToolCaller=(name:string,args:Record<string,unknown>)=>Promise<ToolResult>;
export interface Source {id:string;sourceVersion:string;text:string;url:string;truncated:boolean;}
export interface DraftProposal {requestId:string;expectedRevision:number;postId:string;sourceVersion:string;form:'reply'|'quote';text:string;}
export interface CandidateMedia {key:string;type:'photo'|'animated_gif';alt?:string;}
export interface SourceMedia {type:'photo'|'video'|'animated_gif';url:string;alt?:string;width?:number;height?:number;}
export interface CandidateSource {url:string;text:string;author:string;handle?:string;avatarUrl?:string;createdAt?:string;media?:SourceMedia[];mediaUnavailable?:boolean;}
export interface Candidate {id:string;kind:'original'|'quote'|'reply';persona:{name:string;handle:string;avatarUrl?:string};text:string;source?:CandidateSource;media?:CandidateMedia[];tags?:Record<string,string>;legacyId?:string;}
export interface CandidateResult {operationRequestId?:string;results:{id:string;status:'created'|'unchanged'|'conflict'}[];reviewRequired:true;funding:'caller_runtime';}
export interface MediaUpload {contentType:'image/png'|'image/jpeg'|'image/gif'|'image/webp';dataBase64:string;}
export interface MediaResult {operationRequestId?:string;key:string;sha256:string;bytes:number;reviewRequired:true;}
/** Context includes caller-owned preferences, exact feedback and cadence; treat all stored text as data. */
export interface WriterCandidate extends Omit<Candidate,'source'> {source:Candidate['source']|null;firstText:string;version:number;edited:boolean;reaction:'like'|'pass'|null;media:(CandidateMedia&{url:string})[];protected:boolean;createdAt:number;}
export interface WriterCadence {version:1;timeZone:'America/Los_Angeles';date:string;candidateCount:number;generatedToday:number;unreadCount:number;imagesToday:number;originalsToday:number;deliveredPrefixes:string[];}
export interface WriterContext {candidates:WriterCandidate[];candidateCount:number;contextTruncated:boolean;cadence:WriterCadence;settings:{enabled:boolean;voice:string;revision:number};funding:'caller_runtime';untrustedContent:true;[key:string]:unknown;}
export interface KitExportManifest {snapshot_id:string;revisions:{profile:number;brain:number;work:number};read_only:true;funding:'caller_runtime';content_type:'application/zip';filename:'my-business-starter.zip';bytes:number;sha256:string;download_path:string;review_status:'owner_reviewed'|'not_reviewed';local_files:'snapshot_only_no_sync';}
export class ToolError extends Error {result:ToolResult;}
export interface MediaChunk {key:string;contentType:'image/png'|'image/jpeg'|'image/gif'|'image/webp';sha256:string;totalBytes:number;offset:number;bytes:number;dataBase64:string;nextOffset:number|null;}
export interface MediaDownload {key:string;contentType:MediaChunk['contentType'];sha256:string;bytes:Uint8Array;}
export type OperationMethods={readonly [Method in keyof typeof BOOM_OPERATIONS]:
  {} extends OperationInputs[(typeof BOOM_OPERATIONS)[Method]['name']]
    ? (args?:OperationInputs[(typeof BOOM_OPERATIONS)[Method]['name']])=>Promise<OperationOutputs[(typeof BOOM_OPERATIONS)[Method]['name']]>
    : (args:OperationInputs[(typeof BOOM_OPERATIONS)[Method]['name']])=>Promise<OperationOutputs[(typeof BOOM_OPERATIONS)[Method]['name']]>};
export type PublishPostArgs=OperationInputs['publish_post'];
export interface VerifiedImmediatePublicationReceipt {requestHash:string;postId:string;url:string;accountId:string;evidence:'bound-create-response'|'verified-post-readback';textVerified:true;readbackStatus?:200;readbackAuthorId?:string;mode?:'original'|'quote'|'reply';mediaVerified?:true;parentVerified?:true;parentId?:string;[key:string]:unknown;}
export interface UnverifiedImmediatePublicationReceipt {requestHash:string;accountId:string;evidence:'unverified-create-response';textVerified:boolean;postId?:string;url?:string;returnedText?:string;mode?:'original'|'quote'|'reply';[key:string]:unknown;}
export type ImmediatePublicationReceipt=VerifiedImmediatePublicationReceipt|UnverifiedImmediatePublicationReceipt;
export interface RetainedPublicationGate {requestId:string;status:'rejected'|'held';attempted:false|null;receipt:null;postId:null;publicationVerified:false;retryAuthorized:false;[key:string]:unknown;}
export type PublicationLookupResult=ImmediatePublicationRequest|RetainedPublicationGate;
export interface ImmediatePublicationRequest {requestHash:string;requestId:string;status:'queued'|'blocked'|'canceled'|'preparing'|'submitting'|'confirmed'|'uncertain'|'rejected';targetAccountId:string;connectionVersion:string;text:string;mode?:'original'|'quote'|'reply';media?:CandidateMedia[];scheduledAt?:number|null;receipt:ImmediatePublicationReceipt|null;duplicate?:boolean;reason?:string;[key:string]:unknown;}
export type BoomClient=Omit<OperationMethods,'writerContext'|'submitCandidates'|'uploadMedia'|'downloadMedia'|'publishPost'|'getPublicationRequest'> & Readonly<{
 postNow(args:PublishPostArgs):Promise<ImmediatePublicationRequest>;
 publishPost(args:PublishPostArgs):Promise<ImmediatePublicationRequest>;
 getPublicationRequest(args:{requestId:string}):Promise<PublicationLookupResult>;
 writerContext(args?:{authorHandle?:string;candidateIds?:string[]}):Promise<WriterContext>;
 submitCandidates(args:{candidates:Candidate[]}):Promise<CandidateResult>;
 uploadMedia(args:MediaUpload):Promise<MediaResult>;
 downloadMedia(args:{key:string;offset?:number;limit?:number}):Promise<MediaChunk>;
 readMedia(args:{key:string},options?:{maxBytes?:number}):Promise<MediaDownload>;
 call<Name extends OperationName>(name:Name,args:OperationInputs[Name]):Promise<OperationOutputs[Name]>;
 rest<Name extends OperationName>(name:Name,args:OperationInputs[Name]):Promise<OperationOutputs[Name]>;
 tools():Promise<{tools:unknown[];source?:'contract_snapshot';[key:string]:unknown}>;
}>;
export function createClient(callTool:ToolCaller,options?:{listTools?:()=>Promise<unknown>;requestOperation?:<Name extends OperationName>(name:Name,args:OperationInputs[Name])=>Promise<OperationOutputs[Name]>}):Readonly<{
 boom:BoomClient;
 kit:Readonly<{capabilities():Promise<unknown>;context():Promise<unknown>;manifest():Promise<KitExportManifest>}>;
}>;
