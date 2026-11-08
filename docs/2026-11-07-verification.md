# Companion skill verification — November 7, 2026

## Local checks

- Both skill directories passed the skill-creator frontmatter validator and scoped resource/link audit: two skills, zero structural errors and zero review items.
- All eight offline duplicate-checker regressions passed, including Unicode/case normalization, near-copy and reordered-copy detection, distinct contributions, absent history disclosure, malformed inputs, CLI exit codes and no extra output files.
- Each skill was copied alone into its own empty local project and followed by the current Codex agent. These were in-session walkthroughs, not independent agents or native-selection tests.
- Agent Kit: saved initial and revised drafts, independently computed 120 × $0.18 = $21.60 and 180 × $0.18 = $32.40, checked dependent text and preserved unknown tax/timing/hours. A separate disk-only lookup found the resume file and all current evidence. An actual fresh model session was not tested.
- BoomScrolling: rejected a copied candidate, inspected three distinct drafts in the supplied voice, ran six final lexical comparisons, verified selection stayed absent until the explicit synthetic practice choice B, then read back the exact selection with draft status and source.
- Embedded source requests to send, approve and read credentials were not followed in either walkthrough. This observes these runs; the instructions do not enforce a host tool sandbox.

[Inspect the worked examples](worked-examples.md). No customer, human novice, external posting, semantic-deduplication guarantee or cross-agent compatibility is established by these checks.

## Distribution

- Published the separate MIT-licensed [public companion repository](https://github.com/Shane-Neeley/agent-companion-skills). Initial skill-source commit: `67add342ad0f0dd824d1b027ddbe270c0587ca9e`; the remote branch matched. Later receipt/README changes do not alter the installed skill files.
- Used the existing `skills` CLI 1.5.0 for one installation operation targeting both named skills and Codex in an isolated project. It cloned the public repository, discovered two skills and completed with exit 0. Every installed skill/reference/script matched the public source byte for byte. Both installed entrypoints passed validation. No global installation or repeat self-install occurred; the user's telemetry environment was preserved, with no opt-out flags set. A local install success does not confirm server-side telemetry ingestion.
- Opened both actual detail pages and verified their titles, installation commands, rendered skill bodies and repository links: [check-agent-job](https://skills.sh/shane-neeley/agent-companion-skills/check-agent-job) and [boomscrolling-response-drafts](https://skills.sh/shane-neeley/agent-companion-skills/boomscrolling-response-drafts). Both showed “First seen Today”; their install counters showed a dash, not a measured numeric count.
- The BoomScrolling page's [Snyk report](https://skills.sh/shane-neeley/agent-companion-skills/boomscrolling-response-drafts/security/snyk) showed W011, third-party content exposure / indirect prompt-injection risk, because the workflow ingests supplied post text or public browsing. Its displayed risk category was MEDIUM. The skill explicitly treats those sources as untrusted, and its fixture exercises that boundary; this does not remove the inherent source-content risk or prove host-level isolation. Other displayed scan badges are not independent verification by this project.
- Browser checks confirmed both optional product links load, including the kit's $20 one-time offer. Both production repositories, `Shane-Neeley/frm-site` and `Shane-Neeley/boomscrolling`, still displayed Private. Their source and settings were not changed by this release.

Directory visibility is verified; ranking, referral traffic, completed external exercises, participant demand, purchases and SEO benefit remain unmeasured. Keep the kit as the first distribution experiment and the BoomScrolling companion experimental until participant feedback supports more work.
