# Customer OAuth client verification

The optional `clients/frm` package now supports FRM customer OAuth as well as an already-authorized host caller. The standalone local skills are unchanged. No third-party packages were added.

Verified locally:

- `node --test clients/frm/*.test.mjs`: 23 passing tests, including download failure subtests. Fictional HTTP fixtures exercise browser callback state/issuer, PKCE S256, public DCR, pinned metadata/resource endpoints, token rotation, POSIX credential permissions, symlink refusal, refresh locking, scope checks, revocation, timeouts, refusal to follow token redirects and no draft-call retries. Kit downloads verify the exact bearer-only snapshot path, scope, refresh, content type, bounded byte count and SHA-256; changed snapshots, checksum failures and redirects fail without retry. Explicit legacy MCP `2025-11-25` initialization and latest `2026-07-28` calls both pass.
- `python3 -B -m unittest discover -s tests -v`: 8 passing duplicate-helper regressions.
- `node clients/frm/cli.mjs --demo`: offline fictional proposal displayed; no network call, purchase or publication.
- TypeScript 5.9.3 strict NodeNext check: actual `.mjs` imports, typed manifest and `Uint8Array` download passed using the existing application toolchain. Declarations use `.d.mts` so NodeNext discovers them automatically; no dependency was installed in this repository.
- `git diff --check`: passed.

Claude Code's official MCP reference and Claude's remote custom-connector help were checked for the customer setup instructions. A DCR-only server requires the hosted connector's **Register automatically** option. No global Claude configuration was changed or software installed.

These checks do not establish successful live paid-account consent, production entitlement ownership, Claude connector acceptance or customer usefulness. The server deployment and actual customer login require separate verification. No access or refresh tokens were created against production, stored in this repository or printed in these checks.
