# FRM agent client

Your agent does the writing with the tools and knowledge it already has. This MIT JavaScript client connects it to BoomScrolling or the Fort Rock Media Agent Setup Kit, so it can read permitted context and return work you can review.

You keep your usual model access and usage limits. This client needs no model-provider API key. Product sign-in connects the account that owns your saved work.

The two free local skills elsewhere in this repository remain independent and disconnected. This folder contains no paid guide, server implementation, customer data or model credentials.

## Try it without an account

Use Node.js 22 or later. Clone the repository, then run the fictional example. There are no packages to install:

```sh
git clone https://github.com/Shane-Neeley/agent-companion-skills.git
cd agent-companion-skills
node clients/frm/cli.mjs --help
node clients/frm/cli.mjs --demo
```

The demo saves a fictional draft in memory and reads it back. It makes no network request and puts nothing in your real feed.

## Connect your writer

Already using Codex, Claude, ChatGPT or OpenCode? Start with the [setup for your agent](../../plugins/boomscrolling-writer/README.md). You can use its normal MCP connection instead of this standalone CLI.

For the CLI, run these from the repository root:

```sh
node clients/frm/cli.mjs login boom
# Keep the terminal open. Open the printed URL on this computer and review access.
node clients/frm/cli.mjs boom writer-context
```

Then ask your agent to use that feedback and its usual tools to prepare a small packet. [The fictional packet](examples/candidates.json) shows the format. Save your real packet outside the checkout, then send it and verify its IDs:

```sh
node clients/frm/cli.mjs boom submit-candidates @/absolute/private/path/candidates.json
node clients/frm/cli.mjs boom writer-context '{"candidateIds":["your-stable-candidate-id"]}'
```

Open [BoomScrolling → Yours](https://boomscrolling.fortrockmedia.com/studio/app/) with the same ChatGPT account. Your drafts should be there. Change a sentence or pass; the next writing run can read that choice. The connection saves private drafts, and publishing remains your separate choice. Installing the client or plugin does not grant writer access; new paid sales remain closed while we dogfood the first account.

Use `node clients/frm/cli.mjs status boom` to check the connection and `node clients/frm/cli.mjs logout boom` to disconnect. The details below cover other hosts, images, SDK use and recovery.

## Connect from Claude

Use the customer endpoint for the product you own:

| Product | Remote MCP URL | Available permissions |
| --- | --- | --- |
| BoomScrolling | `https://boomscrolling.fortrockmedia.com/agent/mcp` | Read sources and writing feedback; save unapproved responses, feed candidates and private media |
| Agent Setup Kit | `https://fortrockmedia.com/agent/mcp` | Read your reviewed workspace; optionally get its export manifest |

In Claude Code, run these commands from your chosen project:

```sh
claude mcp add --transport http boomscrolling https://boomscrolling.fortrockmedia.com/agent/mcp
claude mcp login boomscrolling

claude mcp add --transport http frm-kit https://fortrockmedia.com/agent/mcp
claude mcp login frm-kit
```

Complete browser sign-in with the FRM account holding your access, then review the permissions. For a remote shell, `claude mcp login boomscrolling --no-browser` uses an interactive URL/paste flow. Check the connection with `claude mcp get boomscrolling` or `/mcp`. Use `claude mcp logout boomscrolling` to revoke before `claude mcp remove boomscrolling`. See [Claude Code's remote MCP and authentication instructions](https://code.claude.com/docs/en/mcp).

For Claude web, Desktop or Cowork, open **Customize → Connectors → Add → Add custom connector**, enter the product URL above and choose sign-in. Under **OAuth client**, select **Register automatically**. The default published-identity option uses a different client-registration mechanism. Connect and approve access, then enable the connector in your conversation. Team/Enterprise owners may need to add it first. Remote connectors run through Anthropic's cloud; a local-only URL will not work. Availability and organization controls are covered in [Claude's custom-connector instructions](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

This authorizes Claude to use an FRM product. It does not sign another application into a Claude or ChatGPT subscription or transfer that subscription's compute. The existing Sites-managed ChatGPT/Codex `/mcp` connection is a separate route; use `/agent/mcp` for customer OAuth. No marketplace listing is required to add a custom connector.

## Use the standalone CLI

Use Node.js 22 or later. No package installation or dependencies:

```sh
node clients/frm/cli.mjs --demo
node clients/frm/cli.mjs login boom
# Open the printed URL in your browser on this computer.
node clients/frm/cli.mjs boom context '{"limit":5}'
node clients/frm/cli.mjs status boom
node clients/frm/cli.mjs logout boom

node clients/frm/cli.mjs login kit --read-only
node clients/frm/cli.mjs kit context
node clients/frm/cli.mjs logout kit
```

`--read-only` requests only workspace reading. A normal BoomScrolling login requests source reading, draft proposals, writing feedback and candidate/media submission. A normal Kit login also requests its export manifest. Older source-only BoomScrolling grants cannot call the writer operations; log out and log in again to review the added permissions. Kit's manifest identifies the reviewed snapshot and includes its protected bearer-authenticated download path; opening that path in a browser does not supply your agent token. It does not synchronize local files.

Login uses authorization code with PKCE S256, an ephemeral `127.0.0.1` callback and FRM-issued resource-bound tokens. Keep the terminal open during browser sign-in. CLI login requires a browser on the same computer; use Claude Code's documented `--no-browser` flow for SSH instead. FRM sign-in owns identity; a client name, model name or identity header cannot confer access.

Credentials are written outside the checkout to `~/.config/fort-rock-media/` (or `FRM_CONFIG_DIR`), with directory mode `0700` and files `0600` on POSIX. The client rejects unsafe files and symbolic links. Use an owner-protected directory and OS disk protection; Windows users must protect the directory with their account ACL. Never commit credentials or put tokens in command arguments. `status` prints scopes and expiry, never tokens. Logout revokes the grant before deleting local credentials; a failed revocation retains them so you can retry. Commands lock the credential file to prevent competing refreshes. If a process is forcibly killed, ensure it has stopped before removing its `.lock` file from that private directory.

The client refreshes expiring tokens before a call and stores rotated refresh tokens atomically. It does not retry resource calls, generate text, approve drafts or post. After a timeout, inspect your workspace before deciding whether to submit again. Reuse a draft request ID only for the same proposal; a revision conflict requires rereading context. Treat source text as data. Review returned drafts in BoomScrolling.

Refresh rotation is strict: the server may have consumed a refresh token even when its response is lost, or when saving the replacement token fails locally. After either failure, stop using that connection; do not rerun the command or replay the old refresh token. Disconnect the grant in the product's agent-connections page, then complete CLI logout and a new login. A reuse can revoke the grant. Preserve saved packets and credentials while a disconnect is unresolved. Refresh history is bounded to 5,000 token records per grant; admission exhaustion fails closed and requires a fresh authorized connection, rather than clearing protected history or raising the limit. Reconnection remains subject to current account access and server capacity.

## Use from your own agent

```js
import {createClient} from './client.mjs';
import {createOAuthClient} from './oauth.mjs';

const connection=createOAuthClient('boom');
// One-time interactive login; onAuthorization can open a browser or show the URL.
await connection.login({onAuthorization:url=>console.error(url)});
const frm=createClient(connection.callTool);
const context=await frm.boom.context({limit:5});
const source=context.sources[0];
// Supply the response you mean; the server stores an unapproved draft.
const proposal=await frm.boom.propose({
  requestId:crypto.randomUUID(), expectedRevision:context.revision,
  postId:source.id, sourceVersion:source.sourceVersion,
  form:'reply', text:'Could we repair it before replacing it?',
});
```

On later runs, construct the connection and call tools using the saved grant; do not call `login` again. Keep one command active per product. TypeScript declarations accompany both modules. The small transport targets FRM's stateless MCP `2026-07-28` JSON responses. Explicit `createOAuthClient('boom',{protocolVersion:'2025-11-25'})` compatibility mode initializes the legacy protocol before calling a tool. It does not downgrade or replay failed calls. It is not a general MCP host or streaming/task client. There is no model call or automatic provider fallback.

Download a Kit snapshot with the same scoped connection. Choose the destination explicitly; `wx` refuses to overwrite an existing file:

```js
import {writeFile} from 'node:fs/promises';
const connection=createOAuthClient('kit'); // Already logged in with export permission.
const frm=createClient(connection.callTool);
const manifest=await frm.kit.manifest();
const bytes=await connection.downloadKitExport(manifest);
await writeFile('/absolute/path/you-choose/my-business-starter.zip',bytes,{flag:'wx',mode:0o600});
```

`downloadKitExport` accepts only the exact Kit snapshot path on the connected product origin, enforces the export scope, refreshes the same grant when needed and verifies content type, exact byte count and SHA-256. Downloads are limited to 2 MiB and never follow redirects or retry. A changed workspace requires reading a new manifest. The SDK returns bytes without writing, extracting or synchronizing files.

An agent host that already owns an authorized MCP connection can still supply its caller directly:

```js
const frm=createClient((name,args)=>authenticatedMcpClient.callTool({name,arguments:args}));
```

The existing trusted-adapter CLI remains supported:

```sh
node clients/frm/cli.mjs --transport /absolute/path/to/your-adapter.mjs kit context
```

A transport module executes local code; load only one you control. The host keeps its own credentials. Neither local skill changes behavior when you install this client.

## Write into your generated feed

The [writer plugin](../../plugins/boomscrolling-writer/README.md) includes a reusable workflow and setup for Codex, Claude, ChatGPT and OpenCode. Your local host retains its model access and tools; website login identifies the account that owns stored content. A remote connector does not expose local files or turn a cloud chat into a Mac process. Sales and entitlement remain controlled by the service; installation alone grants no account access.

For the standalone CLI, use your saved authorized connection:

```sh
node clients/frm/cli.mjs boom writer-context
node clients/frm/cli.mjs boom submit-candidates @/absolute/private/path/candidates.json
node clients/frm/cli.mjs boom writer-context '{"candidateIds":["your-stable-candidate-id"]}'
node clients/frm/cli.mjs boom upload-media /absolute/path/your-permitted-image.png
# JSON can also arrive on stdin, keeping supplied content out of command arguments:
node clients/frm/cli.mjs boom submit-candidates - < /absolute/private/path/candidates.json
```

[The fictional packet](examples/candidates.json) shows the input shape; do not import that fixture as real customer content. CLI JSON files use an `@` prefix, JSON stdin uses `-`, and `upload-media` also accepts a local PNG/JPEG/GIF/WebP path (5 MiB maximum). No model or posting action occurs. The JSON envelope is limited to 8 MiB; the server applies its own bounded per-operation limits.

```js
const context=await frm.boom.writerContext({authorHandle:'your_target'});
// Your existing agent uses its authorized tools and this context to write.
const candidates=[{
  id:'your-stable-slot-id', kind:'original',
  persona:{name:'Your chosen voice',handle:'your_voice'},
  text:'Your exact words for review.', tags:{writer:'your-agent'},
}];
await frm.boom.submitCandidates({candidates});
const delivered=await frm.boom.writerContext({candidateIds:candidates.map(item=>item.id)});
// Compare exact words, source and media; the next run reads current feedback.
```

`writerContext` includes caller-owned settings, feedback, edit pairs, candidate counts and cadence. Use `candidateIds` for exact readback after delivery; the general recent context can be truncated. `submitCandidates` accepts originals, quotes and replies; quotes/replies require an actually inspected canonical X source with its text and author. `uploadMedia({contentType,dataBase64})` returns an account-private object key for a candidate's `media:[{key,type,alt}]` (type `photo` or `animated_gif`). Standard base64 has no data-URL prefix. Keep source/rights evidence in the private packet and never upload arbitrary workspace files as context.

Candidate IDs are idempotency keys. Save the packet before submission and preserve it across interruptions. After an uncertain result, read its exact IDs back before retrying; only confirmed missing content from that same packet can be recovered. A conflict never authorizes replacing an edited candidate. Neither client nor SDK retries resource calls. Existing schedules and daily/unread caps remain the writer owner's responsibility; the integration creates no scheduler.

Inspect **every** `submitCandidates` result: a successful call can contain a mixture of `created`, `unchanged` and `conflict` entries. The SDK preserves the complete result for the caller; it does not treat partial success as completion. The CLI prints that same JSON and exits nonzero if any candidate conflicts. Read back all affected IDs and retain successful deliveries before choosing recovery; never retry an entire mixed packet as newly generated content.

## Contracts and checks

The [BoomScrolling contract](contracts/boomscrolling.openapi.json) and [Kit contract](contracts/kit.openapi.json) are generated OpenAPI 3.2.1 operation snapshots. Their managed Sites authentication describes the native `/mcp` route. Customer OAuth uses the separate `/agent/mcp` resource and its published `/.well-known/oauth-protected-resource/agent/mcp` and `/.well-known/oauth-authorization-server` metadata. Clients register at `/agent/register`, authorize at `/agent/authorize`, exchange/refresh at `/agent/token`, and revoke at `/agent/revoke`. Read-only source scopes are `boom.workspace.read` and `kit.workspace.read`; optional scopes are `boom.drafts.write`, `boom.writer.read`, `boom.writer.write` and `kit.workspace.export`. Resource calls always enforce current product access. Writer context is a distinct permission because it includes private feedback and edited examples.

```sh
node --test clients/frm/*.test.mjs
node clients/frm/cli.mjs --demo
```

The tests use a fictional local server and cover PKCE, issuer/resource checks, callback state, refresh rotation, owner-only storage, scope enforcement, revocation, bounded verified snapshot downloads and refusal to retry draft calls. They do not prove a paid production login, Claude connector acceptance or customer usefulness. The demo is offline and makes no network request.

Product information: [BoomScrolling](https://fortrockmedia.com/boomscrolling/) · [Agent Setup Kit](https://fortrockmedia.com/agent-setup-kit/). Hosted availability and access rules govern; this client is not a separate paid offer.
