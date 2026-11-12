// A host supplies an already-authorized MCP call. Credentials stay in the host.
export class ToolError extends Error {
  constructor(message, result) { super(message); this.name='ToolError'; this.result=result; }
}
export function createClient(callTool) {
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
  return Object.freeze({
    boom:Object.freeze({capabilities:()=>call('get_capabilities'),context:(args={})=>call('get_workspace_context',args),propose:args=>call('propose_draft',args),
      writerContext:(args={})=>call('get_writer_context',args),submitCandidates:args=>call('submit_candidates',args),uploadMedia:args=>call('upload_media',args)}),
    kit:Object.freeze({capabilities:()=>call('kit_get_capabilities'),context:()=>call('kit_get_workspace_context'),manifest:()=>call('kit_get_export_manifest')}),
  });
}
