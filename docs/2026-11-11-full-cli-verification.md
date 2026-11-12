# Full BoomScrolling client verification

The owner requested closing the app/API/CLI gaps and a CLI welcome using the exact line: “your doomscrolling time isn’t valuable. your boomscrolling time is.”

The reviewed shared product contract now generates 47 SDK method mappings, CLI aliases, scope/HTTP metadata, input/output declarations and the OpenAPI snapshot. This client retains the six earlier methods. It adds live tool discovery, offline schema inspection, generic named calls, the canonical REST adapter, complete private media downloads and logical exports across all supported collections. Local compose/share/profile links, writing approaches and SVG take cards need no account or provider call. No automatic approval or posting method was added.

## Checks

- `node --test clients/frm/*.test.mjs`: 46 passing tests. Tests cover every CLI alias and SDK method, exact arguments, scope selection and unchanged refresh/default scopes, same-token canonical REST, discovery, legacy protocol, refusal to retry a failed resource call, partial submission conflicts, media hash/size/range checks, export snapshot changes, exclusive private file writes and the local helpers.
- `python3 -B -m unittest discover -s tests -v`: all 8 existing skill/helper tests pass. No skill instructions or disconnected practice behavior changed.
- A TypeScript smoke compile passed for source CRUD, exact manual outcomes, request status, generic REST, media reads and the original writer methods. Expected-invalid unknown operations and missing candidate versions were rejected by declarations.
- The fictional offline CLI demo passed; its noninteractive stdout parsed as JSON and stderr stayed empty. Local command/schema inspection succeeded without credentials. `git diff --check` passed.
- An actual PTY run of the demo showed dim red DOOM, an arrow and bold cyan BOOM, followed by the requested sentence. `NO_COLOR` disables ANSI; `--json` suppresses the interactive stderr masthead. Human help retains the wording. Machine-readable stdout remains clean.

## Consent and file handling

The normal BoomScrolling login still requests only the existing four scopes. The other 12 permissions require `--full` or an explicit `--scopes` selection and a fresh reviewed connection; existing grants and refreshes never inherit them. Read/manage/review/provider permissions remain separate. This work did not sign in, alter a real grant, request a provider read/generation, change a model, create a schedule or publish a post.

Image downloads verify every bounded chunk and the final SHA-256 before writing. File exports collect all pages and collections unless a specific collection is selected; revisions/watermarks must remain identical across the full export. A starting cursor is labeled partial. Output uses exclusive creation and mode `0600` on POSIX. These are scoped logical exports, not full runtime backups. New mutation responses are minimal acknowledgments; richer reads keep their separate permission checks.

The endpoint/auth tests used a fictional loopback OAuth server and trusted synthetic adapters. They do not establish a production optional-scope login, live provider activation, a physical-device result or customer value. The application release owner records deployment and hosted verification separately.
