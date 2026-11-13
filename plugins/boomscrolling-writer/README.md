# BoomScrolling Writer

Your existing agent writes. Your private BoomScrolling feed holds the results and your feedback. Review on your phone at [BoomScrolling](https://boomscrolling.fortrockmedia.com/studio/app/), using the same ChatGPT account you connected from your agent.

You'll need an agent you can connect and a BoomScrolling account with writer access. Access is currently available to the owner pilot and verified paid accounts. New sales are off; installing the plugin does not add account access.

## Start here

[Connect the agent you already use](https://boomscrolling.fortrockmedia.com/studio/agents/), then [copy the setup prompt](../../docs/boomscrolling-setup.md#copy-this-into-your-agent). Your agent checks access, writes three private unapproved drafts and reads the exact saved drafts back. You can review them in [Home](https://boomscrolling.fortrockmedia.com/studio/app/) with the same ChatGPT sign-in.

Keep a line, edit it, or pass. That feedback helps the next run. Once the first test works, choose a cadence and time zone in the [schedule guide](https://boomscrolling.fortrockmedia.com/studio/agents/#schedule). Recurring work prepares drafts for you to review.

## For your agent

Use the [shared setup prompt](../../docs/boomscrolling-setup.md#copy-this-into-your-agent). Check the installed host's capabilities and reuse a working connection. Request only the writer permissions needed for the test. Keep the current model and authorized tools.

This plugin supplies one writing workflow and an authenticated remote MCP connection. The agent keeps its existing model access, local tools, permissions and costs. Website sign-in owns your stored account; it does not transfer a model subscription or expose your computer to the website. Uploads contain only the drafts and permitted media you select. Submission does not approve or publish a post.

Choose [Claude Code](#claude-code), [Codex or ChatGPT](#codex-and-chatgpt), or [OpenCode and other hosts](#opencode-and-other-hosts) below. Prefer a terminal or your own scripts? The [CLI quick start](../../clients/frm/README.md#try-it-without-an-account) includes a fictional offline demo.

## Claude Code

```sh
claude plugin marketplace add Shane-Neeley/agent-companion-skills
claude plugin install boomscrolling-writer@fort-rock-media
```

Open `/mcp`, select the plugin's BoomScrolling connection and complete browser sign-in. Approve the named writing permissions for the account you use on the website.

New BoomScrolling connections that omit a scope selection show the full source/draft/writer workflow in the consent screen. Existing grants and token refreshes keep their original scopes; disconnect and reconnect an older source-only grant to review the added permissions.

Then run the [three-draft test](../../docs/boomscrolling-setup.md#copy-this-into-your-agent).

You can also connect the server directly without a plugin:

```sh
claude mcp add --transport http boomscrolling https://boomscrolling.fortrockmedia.com/agent/mcp
claude mcp login boomscrolling
```

Use one connection route. The plugin and a direct connection expose the same tools.

## Codex and ChatGPT

For an existing native BoomScrolling plugin, keep that connection and refresh its tools. Native Sites connections use their supplied `/mcp` URL. The customer OAuth route below is available for an account with agent access:

```sh
codex mcp add boomscrolling --url https://boomscrolling.fortrockmedia.com/agent/mcp
codex mcp login boomscrolling --oauth-client-registration dcr --scopes boom.workspace.read,boom.drafts.write,boom.writer.read,boom.writer.write
```

For local plugin distribution, add this repository with `codex plugin marketplace add Shane-Neeley/agent-companion-skills` and select BoomScrolling Writer in the supported desktop plugin interface. This is the publisher's repository catalog. It is separate from an approved public-directory listing.

In ChatGPT web, go to Plugins, choose Add custom MCP server and supply the customer URL above. Select OAuth with automatic registration when offered, sign in and review permissions. Your workspace's plan and plugin policy control availability. ChatGPT web can use its own enabled tools and uploaded files; a remote connector does not make Mac files or local executables available to a cloud conversation. Use the writer in your local agent when the work needs those tools.

## OpenCode and other hosts

OpenCode V2 configuration is provided in [the client examples](https://github.com/Shane-Neeley/agent-companion-skills/blob/main/clients/frm/examples/opencode.json). Merge the server into the chosen project's configuration, then run `opencode mcp auth boomscrolling`. Earlier OpenCode versions have a different configuration shape; use their installed help rather than copying a V2 config into V1.

Any host supporting remote MCP, OAuth code flow with PKCE and dynamic registration can connect to `https://boomscrolling.fortrockmedia.com/agent/mcp`. The [SDK and CLI](https://github.com/Shane-Neeley/agent-companion-skills/tree/main/clients/frm) are available for your own tool runner. Credentials stay with the host or in the CLI's protected local store.

## Tweet exact supplied text now

Immediate posting is currently an owner-pilot feature. It still requires its separate publication permission and verified server readiness.

After connecting with publication permission, ask:

> Use BoomScrolling and tweet this now on my selected account: [exact words].

The agent resolves the connected numeric X account, checks immediate readiness, saves a stable request ID and sends the supplied original text once. It does not turn a draft drop, Like or recurring writer run into posting consent. Missing permissions, funding or X write access remain precise blockers; there is no browser-posting fallback. A previous exact authorization is not followed by a routine second approval question.

For the standalone CLI, see [explicit immediate posting](../../clients/frm/README.md#tweet-exact-text-now). Publication uses the optional `boom.publication.write` scope; CLI account preflight also needs `boom.account.read`. Existing default writer grants and refreshes never gain that permission. Do not disconnect a working grant automatically to add it.

A confirmed result includes a URL and a receipt that distinguishes bound create-response evidence from a verified post readback. An unknown or uncertain attempt is inspected by its saved request ID, never resent automatically. No media, reply, quote or scheduled posting is part of this immediate-original path. Current server gates still determine availability.

## Verify and disconnect

The workflow reads `get_writer_context`, saves stable-ID candidates with `submit_candidates`, and reads the same IDs back. Images first use `upload_media`. Your likes, passes, notes and exact edits guide the next run.

Set up recurring drafts only after the manual test works and the user chooses the cadence, day, time and time zone. Inspect the host's existing schedules and reuse or update a matching writer. Test the saved task with Run Now when available and verify its result in Home. A cloud schedule can use tools and files available to that cloud host; a run that needs the Mac CLI or local files needs the computer on and its agent running. See [where the writer runs](https://boomscrolling.fortrockmedia.com/studio/agents/#where-it-runs).

Disconnect a customer grant in [Your agents](https://boomscrolling.fortrockmedia.com/agent/connections) or log out from its host. Reconnect to add writer permissions to an older source-only grant. On a timeout, read back the saved IDs before attempting recovery.

[Support](https://fortrockmedia.com/contact/) · [Privacy](https://boomscrolling.fortrockmedia.com/privacy) · [Terms](https://boomscrolling.fortrockmedia.com/terms) · MIT license

Setup references: [Codex remote MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [ChatGPT custom MCP](https://developers.openai.com/api/docs/guides/custom-mcp-server), [Claude MCP](https://code.claude.com/docs/en/mcp), [OpenCode V2 MCP](https://opencode.ai/docs/mcp-servers/).
