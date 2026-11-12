# BoomScrolling Writer

Your existing agent writes. Your private BoomScrolling feed holds the results and your feedback. Review on your phone at [BoomScrolling](https://boomscrolling.fortrockmedia.com/studio/app/), using the same ChatGPT account you connected from your agent.

This plugin supplies one writing workflow and an authenticated remote MCP connection. The agent keeps its existing model access, local tools, permissions and costs. Website sign-in owns your stored account; it does not transfer a model subscription or expose your computer to the website. Uploads contain only the drafts and permitted media you select. Submission does not approve or publish a post.

Requires a BoomScrolling account with current agent-writer access. The existing owner account is the first dogfood pilot. Paid sales and broader hosted availability are separate release decisions; installation alone grants no entitlement.

## Start with the agent you use

Choose [Claude Code](#claude-code), [Codex or ChatGPT](#codex-and-chatgpt), or [OpenCode and other hosts](#opencode-and-other-hosts) below. Prefer a terminal or your own scripts? The [CLI quick start](https://github.com/Shane-Neeley/agent-companion-skills/tree/main/clients/frm#try-it-without-an-account) includes a fictional offline demo.

Connect one route, review its writing permissions, then ask:

> Use my latest feedback to write two drafts for my BoomScrolling feed. Use my usual tools and verify that the drafts arrived.

Open [Yours](https://boomscrolling.fortrockmedia.com/studio/app/) with the same ChatGPT account. Your drafts and future edits belong to that account. Keep using the tools your agent is already allowed to use; connecting the feed doesn't grant it new access to your computer.

## Claude Code

```sh
claude plugin marketplace add Shane-Neeley/agent-companion-skills
claude plugin install boomscrolling-writer@fort-rock-media
```

Open `/mcp`, select the plugin's BoomScrolling connection and complete browser sign-in. Approve the named writing permissions for the account you use on the website.

New BoomScrolling connections that omit a scope selection show the full source/draft/writer workflow in the consent screen. Existing grants and token refreshes keep their original scopes; disconnect and reconnect an older source-only grant to review the added permissions.

Then ask:

> Write two drafts for my BoomScrolling feed using my latest feedback, and verify the exact drafts arrived. Keep my current model and tools.

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

## Verify and disconnect

The workflow reads `get_writer_context`, saves stable-ID candidates with `submit_candidates`, and reads the same IDs back. Images first use `upload_media`. Your likes, passes, notes and exact edits guide the next run. The agent creates no new schedule; use your existing authorized writer cadence. If the computer is offline, existing cloud drafts remain readable while fresh writing waits for the writer.

Disconnect a customer grant in [Your agents](https://boomscrolling.fortrockmedia.com/agent/connections) or log out from its host. Reconnect to add writer permissions to an older source-only grant. On a timeout, read back the saved IDs before attempting recovery.

[Support](https://fortrockmedia.com/contact/) · [Privacy](https://boomscrolling.fortrockmedia.com/privacy) · [Terms](https://boomscrolling.fortrockmedia.com/terms) · MIT license

Setup references: [Codex remote MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [ChatGPT custom MCP](https://developers.openai.com/api/docs/guides/custom-mcp-server), [Claude MCP](https://code.claude.com/docs/en/mcp), [OpenCode V2 MCP](https://opencode.ai/docs/mcp-servers/).
