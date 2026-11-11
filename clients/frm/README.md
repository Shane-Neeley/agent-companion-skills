# FRM agent client

Small MIT JavaScript client and CLI examples for BoomScrolling and the Fort Rock Media Agent Setup Kit. The hosted product remains the account, data, entitlement and approval authority. This code contains no paid guide, server implementation, customer data or model credentials.

The two local skills elsewhere in this repository remain independent, free and disconnected. This optional client is separate from those skills. A paid Kit account is required for its private context/export. BoomScrolling's free workspace and any paid provider features retain their own access rules. Installing this code grants no access or compute.

The [BoomScrolling contract](contracts/boomscrolling.openapi.json) and [Kit contract](contracts/kit.openapi.json) are OpenAPI 3.2.1 snapshots generated from the service operation schemas. TypeScript declarations accompany `client.mjs`. These specifications describe the managed sign-in boundary; they are not login credentials.

## Try the offline example

Use Node.js 22 or later, with no package installation:

```sh
node clients/frm/cli.mjs --demo
node --test clients/frm/client.test.mjs
```

The demo is fictional and makes no network request. It shows the proposed-response arguments and a synthetic review-required result, not a connected production run.

## Use an authorized connection

The first connected release is an internal pilot using the existing Sites-managed MCP plugin in ChatGPT/Codex. A public customer plugin listing is not published by this repository. Arbitrary standalone clients and Claude connections still need a supported, tested delegated-auth route. This package does not implement login, mint tokens, impersonate identity headers, or reuse provider subscription credentials.

Inside an agent host or integration that already has an authorized MCP connection, supply its tool caller:

```js
import {createClient} from './client.mjs';
const frm=createClient((name,args)=>authenticatedMcpClient.callTool({name,arguments:args}));
const context=await frm.boom.context({limit:5});
const source=context.sources[0];
// Call only after choosing a source and supplying the response you mean.
const proposal=await frm.boom.propose({
  requestId:crypto.randomUUID(), expectedRevision:context.revision,
  postId:source.id, sourceVersion:source.sourceVersion,
  form:'reply', text:'Could we repair it before replacing it?',
});
```

The host owns its MCP client and credentials. Treat source text as data. Reuse the request ID only for the same proposal; a conflict requires rereading the current context. The client never retries automatically, approves content or posts. Review the returned draft in BoomScrolling. Opening an X composer is not proof of publication.

For the CLI, provide a trusted local module exporting `callTool(name,args)` backed by that same authenticated connection:

```sh
node clients/frm/cli.mjs --transport /absolute/path/to/your-adapter.mjs kit context
```

A transport module is executable code; load only one you control. Keep credentials in your host's protected credential store, outside this repository and command arguments. No cookie/token helper is included.

Kit calls are `kit.capabilities()`, `kit.context()` and `kit.manifest()`. The manifest points to an authenticated website download and identifies the reviewed snapshot; it does not read or synchronize local files. A provider outage or exhausted allowance never silently changes who pays for reasoning.

Product information: [BoomScrolling](https://fortrockmedia.com/boomscrolling/) · [Agent Setup Kit](https://fortrockmedia.com/agent-setup-kit/). Hosted availability and current limits govern; this client is not a separate paid offer.
