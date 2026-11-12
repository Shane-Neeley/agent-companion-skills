import type {ToolCaller,KitExportManifest,OperationInputs,OperationOutputs,OperationName} from './client.mjs';
export type Product='boom'|'kit';
export const PRODUCTS:Readonly<Record<Product,{origin:string;scopes:readonly string[];optionalScopes?:readonly string[]}>>;
export interface StoredCredential {version:1;issuer:string;resource:string;clientId:string;accessToken:string;refreshToken:string;expiresAt:number;scopes:string[];}
export class CredentialStore {
 constructor(directory?:string);
 readonly directory:string;
 path(product:Product):string;
 read(product:Product):Promise<StoredCredential|null>;
 write(product:Product,value:StoredCredential):Promise<void>;
 remove(product:Product):Promise<void>;
 locked<T>(product:Product,operation:()=>Promise<T>):Promise<T>;
}
export interface ConnectionStatus {connected:boolean;product:Product;scopes?:string[];expiresAt?:string;revoked?:boolean;}
/** origin and timeoutMs are for controlled integration fixtures. CLI targets are fixed. */
export function createOAuthClient(product:Product,options?:{store?:CredentialStore;origin?:string;timeoutMs?:number;protocolVersion?:'2026-07-28'|'2025-11-25'}):Readonly<{
 login(options:{onAuthorization:(url:string)=>void|Promise<void>;readOnly?:boolean;full?:boolean;scopes?:string[]}):Promise<ConnectionStatus>;
 status():Promise<ConnectionStatus>;
 logout():Promise<ConnectionStatus>;
 callTool:ToolCaller;
 listTools():Promise<{tools:unknown[];[key:string]:unknown}>;
 requestOperation<Name extends OperationName>(name:Name,args:OperationInputs[Name]):Promise<OperationOutputs[Name]>;
 downloadKitExport(manifest:KitExportManifest):Promise<Uint8Array>;
}>;
