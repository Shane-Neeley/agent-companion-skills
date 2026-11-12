# FRM agent client

Your agent does the writing with the tools and knowledge it already has. Review its drafts in BoomScrolling. This folder has the CLI and JavaScript client for connecting a script or terminal agent.

## Start here

If you want your agent to write for BoomScrolling, [connect the agent you already use](https://boomscrolling.fortrockmedia.com/studio/agents/) and [copy the setup prompt](../../docs/boomscrolling-setup.md#copy-this-into-your-agent). It walks through three private drafts and verifies that they arrived in Yours. After that, choose when you want fresh drafts in the [schedule guide](https://boomscrolling.fortrockmedia.com/studio/agents/#schedule).

You'll need an agent you can connect and a BoomScrolling account with writer access. Access is currently available to the owner pilot and verified paid accounts. New sales are off; installing the client does not add account access.

## For your agent

Use a working host connection when one is already available. The CLI below is another way to connect; the normal writer login is enough for the private draft test. Full access and publishing permissions are separate optional choices.

This MIT client connects to BoomScrolling or the Fort Rock Media Agent Setup Kit to read and manage permitted workspace content, return work for review and inspect account readiness. You keep your usual model access and usage limits. It needs no model-provider API key. Product sign-in connects the account that owns your saved work.

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

Open [BoomScrolling → Yours](https://boomscrolling.fortrockmedia.com/studio/app/) with the same ChatGPT account. Your drafts should be there. Change a sentence or pass; the next writing run can read that choice. The connection saves private drafts, and publishing remains your separate choice.

Use `node clients/frm/cli.mjs status boom` to check the connection and `node clients/frm/cli.mjs logout boom` to disconnect. The details below cover other hosts, images, SDK use and recovery.

## Connect from Claude

Use the customer endpoint for the product you own:

| Product | Remote MCP URL | Available permissions |
| --- | --- | --- |
| BoomScrolling | `https://boomscrolling.fortrockmedia.com/agent/mcp` | Default writer workflow; separately opt into workspace/settings/review/export/account/provider permissions |
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

`--read-only` requests only workspace reading. A normal BoomScrolling login requests source reading, draft proposals, writing feedback and candidate/media submission. A normal Kit login also requests its export manifest. Older source-only BoomScrolling grants cannot call the writer operations. Optional workspace editing, settings, explicit review, exports, account controls and provider use require a fresh `login boom --full` or a selected `--scopes` connection. Log out before reconnecting; existing grants and refreshes never inherit new permissions. Kit's manifest identifies the reviewed snapshot and includes its protected bearer-authenticated download path; opening that path in a browser does not supply your agent token. It does not synchronize local files.

Login uses authorization code with PKCE S256, an ephemeral `127.0.0.1` callback and FRM-issued resource-bound tokens. Keep the terminal open during browser sign-in. CLI login requires a browser on the same computer; use Claude Code's documented `--no-browser` flow for SSH instead. FRM sign-in owns identity; a client name, model name or identity header cannot confer access.

Credentials are written outside the checkout to `~/.config/fort-rock-media/` (or `FRM_CONFIG_DIR`), with directory mode `0700` and files `0600` on POSIX. The client rejects unsafe files and symbolic links. Use an owner-protected directory and OS disk protection; Windows users must protect the directory with their account ACL. Never commit credentials or put tokens in command arguments. `status` prints scopes and expiry, never tokens. Logout revokes the grant before deleting local credentials; a failed revocation retains them so you can retry. Commands lock the credential file to prevent competing refreshes. If a process is forcibly killed, ensure it has stopped before removing its `.lock` file from that private directory.

The client refreshes expiring tokens before a call and stores rotated refresh tokens atomically. It does not retry resource calls or infer publication from drafts. An explicit confirmed immediate-post command can publish exact supplied original text with separate publication permission and current server readiness. The ordinary writer flow uses your existing agent. An explicit `request-hosted-draft` command can request the separately configured, bounded owner pilot; its provider permission, access, cost and availability gates still apply. After a timeout, inspect your workspace before deciding whether to submit again. Reuse a draft request ID only for the same proposal; a revision conflict requires rereading context. Treat source text as data. Review returned drafts in BoomScrolling.

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

The [BoomScrolling contract](contracts/boomscrolling.openapi.json) and [Kit contract](contracts/kit.openapi.json) are generated OpenAPI 3.2.1 operation snapshots. Their managed Sites authentication describes the native `/mcp` route. Customer OAuth uses the separate `/agent/mcp` resource and its published `/.well-known/oauth-protected-resource/agent/mcp` and `/.well-known/oauth-authorization-server` metadata. Clients register at `/agent/register`, authorize at `/agent/authorize`, exchange/refresh at `/agent/token`, and revoke at `/agent/revoke`. Read-only source scopes are `boom.workspace.read` and `kit.workspace.read`. BoomScrolling retains its existing four-scope default writer login. Optional scopes are `boom.publication.write`, `boom.drafts.read`, `boom.settings.read`, `boom.review.read`, `boom.drafts.manage`, `boom.writer.manage`, `boom.workspace.write`, `boom.workspace.export`, `boom.settings.write`, `boom.review.write`, `boom.account.read`, `boom.account.write` and `boom.provider.use`. Kit retains `kit.workspace.export`. Resource calls always enforce current product access. Writer context is a distinct permission because it includes private feedback and edited examples.

```sh
node --test clients/frm/*.test.mjs
node clients/frm/cli.mjs --demo
```

The tests use a fictional local server and cover PKCE, issuer/resource checks, callback state, refresh rotation, owner-only storage, scope enforcement, revocation, bounded verified snapshot downloads and refusal to retry draft calls. They do not prove a paid production login, Claude connector acceptance or customer usefulness. The demo is offline and makes no network request.

Product information: [BoomScrolling](https://fortrockmedia.com/boomscrolling/) · [Agent Setup Kit](https://fortrockmedia.com/agent-setup-kit/). Hosted availability and access rules govern; this client is not a separate paid offer.

### Original post appearance

Writer packets can preserve `persona.avatarUrl` and source `handle`, `avatarUrl`, `createdAt`, `media` and `mediaUnavailable`. Profile photos must use X's HTTPS profile-image host (`pbs.twimg.com/profile_images/` or `default_profile_images/`). Source media accepts up to four photo/video/GIF thumbnail previews on `pbs.twimg.com`; candidate images still use private uploaded keys. The CLI passes these fields in the same JSON packet as the SDK. Use captured source metadata, never guessed photos or dates. Existing candidate IDs remain immutable, including their originally supplied metadata. Yours can load X's actual embedded original for older imports without rewriting their records.

The complete app/API/CLI engineering inventory lives in the app repository's `docs/api-coverage.md`. All shared operations have SDK methods and CLI aliases. `boom tools` discovers the tools permitted by the current connection, while `boom commands` lists the local contract snapshot and scopes. `boom schema [OPERATION]` inspects that offline OpenAPI snapshot without signing in. The same token also works with the canonical `/api/v1/` REST operation routes through `--rest`; arbitrary browser-session routes remain outside that bearer surface.

## Complete BoomScrolling commands

The CLI starts with a small **DOOM ──▶ BOOM** masthead and the line:

> your doomscrolling time isn’t valuable. your boomscrolling time is.

Help shows it without a connection. Interactive BoomScrolling commands put it on stderr; stdout remains JSON. Piped commands stay quiet, `--json` suppresses the interactive masthead and `NO_COLOR` disables ANSI color.

```sh
node clients/frm/cli.mjs boom commands
node clients/frm/cli.mjs boom tools
node clients/frm/cli.mjs boom schema get_source
node clients/frm/cli.mjs boom list-sources '{"limit":25,"query":"repair"}'
node clients/frm/cli.mjs boom get-source '{"sourceId":"your-source-id"}'
node clients/frm/cli.mjs boom list-drafts '{"bucket":"all","limit":25}'
node clients/frm/cli.mjs boom list-candidates '{"limit":25}'
node clients/frm/cli.mjs --rest boom get-source '{"sourceId":"your-source-id"}'
```

Every shared operation has a descriptive kebab-case command and a camelCase SDK method. The six earlier short methods (`capabilities`, `context`, `propose`, `writerContext`, `submitCandidates`, `uploadMedia`) are retained. `boom call OPERATION JSON` and `client.boom.call(name,args)` use the same reviewed operation snapshot; they do not accept an arbitrary URL. The separately scoped `publish_post` operation requires exact text, numeric target, stable key and explicit confirmation; CLI calls through the same preflight used by `boom post`. `client.boom.rest(name,args)` uses an explicitly supplied authorized REST transport. `createOAuthClient('boom').requestOperation(name,args)` handles that transport with the same resource-bound token. Neither route retries a failed resource request.

| Commands | What they cover |
| --- | --- |
| `list-sources`, `get-source`, `upsert-source`, `delete-source` | Full text/media snapshots, search, revision-bound pagination and explicit source changes |
| `list-drafts`, `get-draft`, `edit-draft`, `cancel-draft` | Ordinary drafts and retained Posts history, with protected approvals and delivery evidence preserved |
| `list-candidates`, `get-candidate`, `edit-candidate`, `retire-candidate` | Your private writer feed and exact unapproved edits, without inventing a like |
| `get-feedback`, `record-feedback`, `record-candidate-feedback` | Read feedback and record only an explicitly directed user review of an exact version |
| `get-preferences`, `update-preferences`, `get-writer-settings`, `update-writer-settings` | Writing preferences, private notes and learning controls |
| `list-authored-posts`, `record-authored-post`, `set-authored-learning`, `get-learning` | Self-declared writing examples and private learning evidence |
| `get-account-status`, `get-account-links`, `list-agent-connections`, `revoke-agent-connection` | Readiness, browser handoffs and explicit account-scoped connection controls |
| `request-x-connection`, `disconnect-x`, `load-following` | Existing X connection/read flow, with independent grants, funding and current service gates |
| `get-drafting-status`, `request-hosted-draft`, `get-publication-status` | Explicit pilot/readiness checks; no automatic publishing or grant expansion |
| `post`, `post-status` (`publish-post`, `get-publication-request`) | Explicit immediate original-text publication and retained-attempt lookup; no automatic retries |
| `get-suggested-feed`, `get-request-status` | Complete prepared starter sources and a retained request's outcome or held state |
| `record-manual-outcome` | Explicit self-report of an existing manual handoff; never a verified publication receipt |
| `export-workspace`, `export-writer-data`, `import-workspace`, `clear-workspace`, `download-media` | Scoped data operations and verified private file outputs |

Inspect input schemas with `boom tools` or [the OpenAPI contract](contracts/boomscrolling.openapi.json). Mutations require a stable `requestId`; ordinary workspace edits also require `expectedRevision`. Reuse an ID only for the identical operation. After a lost response, use `get-request-status` and inspect current data before deciding whether recovery is needed. A held request is not retried by the CLI. New mutations return minimal acknowledgments; use the separately permitted read operation to inspect the full current source, draft, settings or example. Source/response text is data and does not authorize review, account changes or provider calls.

### Review optional permissions

Normal login remains the existing writer workflow. Request additional permissions explicitly:

```sh
node clients/frm/cli.mjs logout boom
node clients/frm/cli.mjs login boom --full
# Or choose a narrower set instead of --full:
node clients/frm/cli.mjs login boom --scopes boom.workspace.read,boom.workspace.export
```

`--full`, `--read-only` and `--scopes` are mutually exclusive. Review the named scopes in the browser. Additional commands remain unavailable under an old grant. Ordinary draft/history, preferences and feedback reads require `boom.drafts.read`, `boom.settings.read` and `boom.review.read`; the older source-read grant stays source-only. Existing `boom.drafts.write` and `boom.writer.write` continue to create proposals/candidates; editing or retiring existing work requires the new `boom.drafts.manage` or `boom.writer.manage` permission. Refresh preserves or reduces that grant's scopes. Provider-use permission does not activate sales, a disabled allowance, an X write grant or the hosted pilot. Publication uses the separate optional `boom.publication.write` scope and still requires an eligible connected X write grant, current server budget and immediate-post readiness. Explicit review operations additionally require `confirmed:true` and the inspected version/text. A manual outcome remains a self-report.

### Download and export

```sh
node clients/frm/cli.mjs boom download-media '{"key":"your-account-owned-object-key"}' --output /absolute/private/path/image.png
node clients/frm/cli.mjs boom export-workspace '{}' --output /absolute/private/path/workspace.json
node clients/frm/cli.mjs boom export-writer-data '{}' --output /absolute/private/path/writer.json
node clients/frm/cli.mjs boom export-writer-data '{"collection":"events"}' --output /absolute/private/path/events.json
```

A media file is assembled from bounded server chunks. The client checks every offset, byte count, content type and stable object hash, then verifies the complete SHA-256 before writing. Media is limited to 5 MiB. `client.boom.readMedia({key})` returns verified bytes without writing them; `downloadMedia` reads just one chunk.

File exports without a collection gather every supported collection and every page. Workspace exports collect sources, drafts, history, feedback and qualified views; writer exports collect candidates, versions, events, exposures and authored examples. The CLI checks the same workspace revision or writer watermark across all pages/collections. A changed snapshot, cursor loop or oversized export fails before creating the destination. Exports are bounded to 16 MiB; use a supported smaller collection when necessary. Providing a starting cursor creates a clearly labeled partial export and requires an explicit collection. SDK export methods return one page for callers that manage their own pagination. These are scoped logical exports, not a full runtime backup or a permission to erase protected history.

`--output` uses exclusive creation and private `0600` permissions on POSIX. It refuses an existing destination. JSON stdout reports the chosen path, content type, size and SHA-256 rather than the file's private contents. The client never extracts or synchronizes exports.

### Local writing and sharing helpers

These commands need no account or provider call:

```sh
node clients/frm/cli.mjs boom compose '{"form":"reply","sourceUrl":"https://x.com/fixture/status/123","text":"My exact words"}'
node clients/frm/cli.mjs boom share '{"sourceUrl":"https://x.com/fixture/status/123"}'
node clients/frm/cli.mjs boom profile '{"handle":"fixture"}'
node clients/frm/cli.mjs boom writing-context '{"sourceText":"The inspected source","intent":"The point I mean","approach":"shorter"}'
node clients/frm/cli.mjs boom take-card '{"text":"My own words","author":"My name"}' --output /absolute/path/take.svg
```

`share` returns a canonical X post link or a supplied public HTTP(S) source link. `profile` returns an exact handle’s X profile as a view/follow handoff. `compose` returns an X review URL for an original, reply, quote or repost. It does not open or send it. `writing-context` prepares a local prompt and optional ChatGPT link using `own`, `question`, `example`, `disagree` or `shorter`; opening that link would send the supplied material to ChatGPT. `take-card` exports escaped text as an SVG image without fetching images or fonts. Use your own words and permitted source material.

### Regenerate reviewed client contracts

For product maintainers with the reviewed app checkout:

```sh
node clients/frm/generate-boom-contract.mjs /absolute/path/to/boomscrolling
```

The generator copies only operation schemas/metadata, typed inputs/outputs and the OpenAPI projection. It reads no runtime data, credentials or private drafts. Keep the resulting snapshot aligned with the deployed product before publishing this client.

## Tweet exact text now

Immediate posting is currently an owner-pilot feature, subject to server readiness. For an explicit request such as “use BoomScrolling and tweet this now,” the CLI can publish the exact supplied original text once. It does not publish a queued draft, promote a Like or infer consent from an unattended writer run.

Read the existing connection first. Do not automatically disconnect a working grant to add permission. When the connection lacks publication permission, the user must review that exact additional consent through their normal agent/CLI login flow. A narrowly scoped new connection can request `boom.account.read,boom.publication.write`; `--full` includes the current 17 permissions. Existing logins and refreshes keep their original scopes.

```sh
node clients/frm/cli.mjs boom get-account-status
# Only when X write authorization is missing and you explicitly choose to start it:
node clients/frm/cli.mjs boom connect-x --posting --request-id my-x-write-connection --confirm
# Complete the returned browser handoff yourself, then inspect status again.
# Inspect publication.immediate and its exact target.userId/handle.
node clients/frm/cli.mjs boom post --text 'My exact supplied words.' --account 1234567890123456789 --request-id my-stable-post-key --confirm
# Or preserve exact UTF-8 file/stdin text:
node clients/frm/cli.mjs boom post --text-file /absolute/private/path/post.txt --account 1234567890123456789 --request-id another-stable-post-key --confirm
node clients/frm/cli.mjs boom post --stdin --account 1234567890123456789 --request-id stdin-stable-key --confirm < /absolute/private/path/post.txt
```

The `connect-x --posting` alias prepares the existing `request_x_connection` operation with `posting:true`; it requires both `boom.account.write` and `boom.publication.write` and never completes the X consent screen itself. Without `--posting`, the connection operation retains its read-only default. Do not replace a working grant automatically.

The account IDs and keys above are fictional examples. Use the connected numeric X user ID shown by current server status, not a handle or a generated persona. Choose one stable request ID for the exact text/account and retain it before sending. Text is preserved, including whitespace and Unicode form. Exactly one of `--text`, `--text-file` or `--stdin` is allowed, together with `--account`, `--request-id` and `--confirm`. Input is original text only, within the service's conservative 280-character guard (ASCII one, other code points two; URLs are not shortened for this guard). Media, quotes, replies and schedules are outside this immediate-original path.

Before sending, the CLI reads `get_account_status` and matches `publication.immediate.target.userId` to `--account`. It requires immediate readiness and makes one `publish_post` call. The server rechecks current account/generation, write permission, budget, concurrency and retained uncertainty at the send fence. A CLI preflight is not an external delivery receipt. There is no browser-posting fallback and no automatic resource retry. Only the publication resource call gets a bounded 60-second client timeout for its create/optional-readback path; ordinary status calls keep the existing 20-second bound.

```sh
node clients/frm/cli.mjs boom post-status my-stable-post-key
```

After a timeout, lost response or `preparing`/`submitting`/`uncertain`/`held` result, read that saved key's status. Do not generate another key or blindly repeat a send to find out what happened. Status lookup never resends. An identical request key is protected by the server; changed text or target under that key conflicts rather than replacing the request. Readiness can change after a prior attempt, so use `post-status` for recovery even when a new `post` preflight is blocked.

The CLI prints the complete result as JSON. A matching `confirmed` result with its bound receipt exits zero; `rejected` exits one; unresolved states or an interrupted submission exit two and include the lookup instruction on stderr. A retained pre-send gate error can report `rejected` with `attempted:false`; an outer request not yet settled can report `held` with `attempted:null`. Those records have no frozen text/target and never authorize a resend. The receipt distinguishes `bound-create-response` evidence from `verified-post-readback`. Exact create-response text can establish the first; when X transforms a supplied URL, the server may use one bounded read of that same post to verify the numeric author and expanded text. Neither proves that the post remains visible later. Share only the returned public URL and intended account, not credentials or private status records.

The [fictional publication packet](examples/publish-original.json) shows the lower-level JSON shape. Its account ID is a fixture, not a target to use.

For SDK callers:

```js
const connection=createOAuthClient('boom'); // Already granted account.read/publication.write.
const frm=createClient(connection.callTool);
const result=await frm.boom.postNow({
  requestId:'your-stable-request-id',
  text:'The exact words the user explicitly asked to publish.',
  targetAccountId:'1234567890123456789',
  confirmed:true,
});
// On an interrupted/uncertain result, inspect instead of sending again:
const retained=await frm.boom.getPublicationRequest({requestId:'your-stable-request-id'});
```

`postNow` performs account/readiness preflight and checks the response/receipt binding. `publishPost` is the lower-level shared operation for hosts that already performed that explicit preparation; its server-side permission and exact target/idempotency checks still apply. The connected writer skill has the same explicit request branch. Ordinary draft generation, import, review and recurring writing remain separate from publication.
