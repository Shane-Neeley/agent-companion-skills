# Writer client and plugin checks — November 11, 2026

The customer writer client adds supplied originals/quotes/replies, bounded private media and exact candidate-ID readback to the existing OAuth transport. It requests separate writer read/write scopes; old source-only grants fail before a writer resource call. The two disconnected local skills retain their workflows.

## Actual local evidence

- `node --test clients/frm/*.test.mjs`: 29 pass, including saved-file/stdin/image CLI payloads, scope denial before network, exactly one call per writer operation, interrupted-call failure, existing OAuth/PKCE/rotation/storage/revocation and Kit download regressions.
- `python3 -B -m unittest discover -s tests -v`: eight existing duplicate-check regressions pass.
- TypeScript strict declaration check of `client.d.mts` and `oauth.d.mts` passes with the existing project toolchain.
- Skill Creator `quick_validate.py` and scoped `audit_skills.py` report a valid writer skill, zero structural errors and no review items. This is structural inspection, not a model-routing experiment.
- Claude Code 2.1.319 `plugin validate plugins/boomscrolling-writer --strict --profile directory --json` and `plugin validate . --strict --json`: success, no warnings/errors/findings. No Claude model call or plugin install was made by these validators.
- `git diff --check` passes. The OpenAPI snapshot is generated from the product operation schema, with six account API routes and no owner data.
- The deterministic plugin ZIP contains eight public resources: the two host manifests and two remote MCP configurations, the writer skill, original SVG icon, README and MIT license. Its SHA-256 is `ea0a4f26660ae9ac5542a6f53b30906bf5f698730ffd22e0bbba12d91128e4d3`. Package paths and bytes were inspected; the packager rejects symlinked source components and includes only named public files.
- Product, support, privacy and terms listing URLs returned HTTP 200 through direct HTTPS checks. Browser-search retrieval did not expose all three app routes; this does not establish their content or a signed-in client journey.
- The offline demo exercises writer context → one fictional stable-ID submission → exact ID readback without connecting, calling a model or posting.

## Distribution limits

Official OpenAI, Claude and OpenCode documentation was opened to verify the current remote MCP, package and submission routes. The package includes OpenAI's five positive/three negative review cases and the four listing URLs, OAuth DCR and explicit scopes. There is no invented reviewer account or walkthrough URL.

This record establishes local checks only. It does not establish a new production login, Codex/OpenCode installation, native skill selection, production candidate delivery, marketplace submission, directory approval or public listing. The owning BoomScrolling release record tracks hosted dogfooding. Publisher identity/domain checks, a dedicated fictional review account, an actual reviewer-accessible video and portal review/attestations remain submission work; see [distribution](distribution/boomscrolling-writer.md).

## Review follow-through

The root agent obtained the requested Claude Code review. Its client conflict finding was corrected: a mixed candidate result remains complete JSON on stdout and sets a nonzero CLI exit when any entry conflicts. The SDK preserves the same inspectable per-candidate results; callers must check every entry. Both behaviors have focused regressions. New omitted-scope BoomScrolling authorizations present full workflow consent, while existing grants/refreshes retain their original scopes. Strict lost-refresh/store-write recovery and the 5,000-record per-grant rotation ceiling are documented; no threshold or automatic retry was added. Public push remains held until root review of these fixes.
