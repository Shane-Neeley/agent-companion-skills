# BoomScrolling writer distribution

The repository catalogs distribute the `plugins/boomscrolling-writer` package to supported Codex and Claude Code clients. Public directory approval is separate. Keep the same package version in its portable manifest, Claude compatibility manifest and both marketplace entries.

## Package and local checks

```sh
python3 scripts/package-writer-plugin.py work/boomscrolling-writer.zip
claude plugin validate plugins/boomscrolling-writer --strict --profile directory
claude plugin validate . --strict
node --test clients/frm/*.test.mjs
node clients/frm/cli.mjs --demo
```

The ZIP contains only the plugin, its original icon, the shared writer skill and its two remote MCP configurations. It includes no local server, hooks, credentials, private prompts, owner records or provider-subscription bridge. `plugin.json` carries five positive and three negative review cases. They are review instructions; recorded test results belong in the dated verification record.

## ChatGPT and Codex public directory

Use [OpenAI's plugin submission portal workflow](https://developers.openai.com/plugins/deploy/submission), choosing **With MCP** and the stable HTTPS customer endpoint. The portable `mcp.json` declares OAuth DCR and the explicit writer scopes. The website uses ChatGPT sign-in; a reviewer signs in as the dedicated test customer and authorizes the client. The existing native Sites integration and a public directory submission are different registrations.

Before submission, verify the submitting organization/developer identity and domain, provide a dedicated entitled review account with fictional content, complete actual host/end-to-end checks and attach a reviewer-accessible walkthrough URL. The package intentionally has no invented demo URL or reviewer credentials. Credentials belong in the portal's private review fields. Resolve its tool/metadata scans and complete the required policy attestations under the publisher's authority. Submit once, track the returned draft/review ID and publish only after approval and publication authority. Do not claim that repository availability is an approved directory listing.

Current references: [Package format and marketplace](https://developers.openai.com/plugins/build/plugins), [Submission and review](https://developers.openai.com/plugins/deploy/submission), [Guidelines](https://developers.openai.com/plugins/plugin-guidelines), [Custom remote MCP](https://developers.openai.com/api/docs/guides/custom-mcp-server). Requirements are controlled by the portal and may change.

## Claude directory

The repo's `.claude-plugin/marketplace.json` provides a publisher-owned marketplace. A user adds the repository and installs `boomscrolling-writer@fort-rock-media`. The plugin also includes the current Claude directory fields: icon, documentation, support, privacy and terms URLs.

For a public Claude directory listing, follow [Publish a plugin](https://code.claude.com/docs/en/plugins/publish) and [Claude's developer portal](https://claude.ai/directory/manage). The current workflow requires a qualifying paid account/organization role, a public GitHub plugin source, validation, review and the required publisher attestations. Anthropic's official `claude-plugins-official` marketplace is a separate partner route; its listing is not established by the publisher's own catalog. Never enter the owner's personal feed as reviewer data.

## OpenCode

The supported integration is standard remote MCP with OAuth, using [OpenCode V2's official server configuration](https://opencode.ai/docs/mcp-servers/). V2 nests entries under `mcp.servers`; its OAuth client falls back to DCR where CIMD is not advertised. No provider plugin, model switch or npm extension is required for this remote tool integration. No OpenCode marketplace listing is claimed.

## Release truth

Track local package validation, committed repository/catalog availability, production tool readiness, actual client logins, dogfood delivery/readback, public review submission, directory approval and public publication independently. A valid archive cannot establish any later stage. Keep unfinished distribution steps in BoomScrolling's owning project queue.
