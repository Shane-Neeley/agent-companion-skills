# Queue status and local input validation

Healthy queued and canceled status reads previously exited with the same code as unresolved publication attempts. Status lookups now exit zero for complete, matching, explicitly unsent queued/canceled records. Immediate publishing still requires the existing verified receipt. Blocked, uncertain, malformed and contradictory retained states remain nonzero; status reads never send.

`boom validate OPERATION JSON|@FILE|-` checks the shipped input contract offline, including required fields, nested shapes and exact post constraints. Writer-setting updates also preflight automatically, catching oversized notes before transport. Text is not shortened or normalized. Length checks follow the product's UTF-16 string semantics. Validation establishes neither current account access nor slot availability.

Verification:

- All 79 client tests passed, including strict publication receipt regressions, 20 status-alias/transport child calls, private-value-safe validation errors, and zero-network writer-note failure cases.
- Eight repository Python tests and the fictional offline CLI demo passed.
- Read-only live lookups of one queued and one canceled record returned exit zero with their original status and `attempted:false`; no public post or account mutation occurred.
- An existing exact queue packet passed offline validation without a provider call.
- Scoped diff/whitespace review passed. Tests use fictional data; private request IDs, account records and creative material are not included here.

Not implemented: atomic server-side rescheduling, batch queue application, native audience metric records, provider analytics collection or changes to credential locking. These require separate contracts and verification; cancel-then-queue is not atomic, and a retained blocked item is not permission to submit it again.
