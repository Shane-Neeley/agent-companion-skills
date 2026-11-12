# Explicit immediate-post client checks

The connected SDK, CLI and writer plugin add one explicit original-text publication path. The ordinary four-scope writer login and unattended draft workflow remain separate. Publication uses the new optional `boom.publication.write` scope; the CLI's preflight also requires `boom.account.read`. Full optional login now offers 17 total scopes, without expanding existing grants or refreshes.

## Actual local checks

- `node --test clients/frm/*.test.mjs`: 66 tests pass. Coverage includes every shared alias, exact text/file/stdin preservation, missing confirmation, invalid account/keys, target mismatch, unavailable readiness, receipt/hash mismatch, and preservation of the exact input across asynchronous preflight.
- Spawned real CLI processes use the actual OAuth transport against a fictional loopback server. Confirmed create-response and verified-readback variants succeed with one publication call. An uncertain result exits two; status lookup adds only a read. A wrong numeric target and missing publication permission produce no publication resource call. The REST variant keeps the stable publication key separate from `traceRequestId` and performs one POST followed by one read-only status lookup.
- Only publication calls use a bounded 60-second client timeout for the create/optional-readback path. Status keeps its existing 20-second timeout. No resource retry was added. Readiness failures report that the command did not submit; interrupted or unbound post results retain the original key and recovery instruction.
- X write-authorization setup is explicit through `connect-x --posting --request-id KEY --confirm`. Both account-write and publication permissions are required before a resource request. The existing connection purpose remains read-only without `posting:true`; the CLI does not complete X's browser consent itself.
- The shared contract generator produced 49 operation mappings, declarations and the OpenAPI snapshot from the reviewed backend source. Strict TypeScript smoke checks pass for immediate post/status, REST, optional posting-purpose connection setup and expected-invalid publication inputs.
- All eight existing Python duplicate/helper tests pass. The offline demo, posting help, offline publication schema and diff check pass. Both free local skills retain their disconnected behavior.
- Skill Creator validation passes for the connected writer and the two free local skills. The connected writer's scoped audit has zero structural errors and zero review items. The changed connected skill has explicit-post and ordinary-draft routes; stored/source instructions and writer cadence cannot authorize the post branch. These are structural and synthetic checks, not a model-routing experiment.
- Plugin manifests and both repository catalogs agree on version `0.2.0`. The publication JSON example is fictional and was parsed, not submitted.

## Result and limits

`boom post --text|--text-file|--stdin --account NUMERIC_ID --request-id STABLE_KEY --confirm` resolves the current numeric target and readiness, then sends the frozen supplied request once. `boom post-status KEY` reads retained outcomes without another send. Matching confirmed receipts must have the same request hash/account, canonical post ID/URL and verified text. The client distinguishes bound create-response evidence from verified post readback and preserves unverified evidence without calling it success. Pre-send retained gate rejections and held outer requests never authorize a retry.

The public writer skill retains its existing entrypoint and adds a distinct explicit “tweet this now” branch. It does not require a routine second approval when the exact text/account were already authorized. Missing access remains a concrete consent/readiness step, with no automatic grant replacement, browser-posting fallback, media conversion, reply/quote conversion or scheduling.

No live X post, provider read, paid API call, real OAuth grant change, plugin installation or marketplace submission was performed for these checks. The local fixture receipts do not establish production delivery. Deployment, actual granted access and hosted readiness are recorded by the owning application release.
