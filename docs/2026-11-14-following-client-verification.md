# Following source client verification

The reviewed product contract generates 57 operations. The new `get_following_sources` operation has the `getFollowingSources()` SDK method and `boom get-following-sources` CLI command; the owner-only `verify_x_funding` operation has `verifyXFunding()` and `boom verify-x-funding`. Generic calls and offline schema lookup accept their operation names. The generated snapshot contains operation contracts only, with no runtime source posts or credentials.

Writer guidance now starts from already-loaded Following snapshots, retains exact source words and canonical parents, checks retrieval time, and passes when a worthwhile reply would require invented context. New provider loads remain explicit bounded actions. Funding evidence is an operator check, not an ordinary writer step. Neither change alters grants, models, recurring tasks or publication authority.

Verification:

- All 71 Node client tests passed, including every named operation/CLI mapping, new operation/schema aliases, scoped transport and refusal to retry failed resource calls.
- All eight existing Python helper tests passed. The two disconnected skills retain their standalone behavior.
- The fictional CLI demo completed its context → private candidate → exact readback loop. No provider or production-account operation ran.
- Strict TypeScript declaration checks passed. Skill Creator validation and scoped audits passed for the writer skill and both disconnected skills, with zero structural errors or review items. Diff whitespace checks passed.

These checks establish local client compatibility and structural guidance, not production availability or a fresh model-routing experiment. The application release owns deployment and live provider verification. No sign-in, grant replacement, install, publication or schedule change occurred in this client task.
