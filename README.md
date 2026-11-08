# Agent companion skills

Two free skills for turning supplied material into work you can inspect and keep.

| Skill | You supply | You keep |
| --- | --- | --- |
| [Check your first agent job](skills/check-agent-job/SKILL.md) | One small job and approved notes, or the fictional practice case | A draft, fact checks, missing details and a verified correction |
| [BoomScrolling response drafts](skills/boomscrolling-response-drafts/SKILL.md) | A source post, its URL, your intended voice and optional earlier replies | Three distinct drafts, a duplicate review and your chosen draft when you select one |

Both work without a purchase, API key or account connection. They use your existing agent and its normal usage limits. They save local drafts; sending and publishing are separate actions.

## Install one skill

Use an agent that supports `SKILL.md` and can read and write files in your chosen project. The optional duplicate checker needs Python 3.9 or later. The installer needs Node.js; check the [current CLI prerequisites](https://github.com/vercel-labs/skills#install-a-skill).

From the project where you want to use the skill:

```sh
npx skills add Shane-Neeley/agent-companion-skills --skill check-agent-job -a codex
```

Or choose the BoomScrolling companion:

```sh
npx skills add Shane-Neeley/agent-companion-skills --skill boomscrolling-response-drafts -a codex
```

These commands install to the current project. Review the files before installing. The [installer documents its telemetry and opt-out](https://github.com/vercel-labs/skills#telemetry); installation counts do not measure successful work.

## Try it

In your agent, ask:

> Use check-agent-job to run the fictional postcard practice. Save the first draft, check the facts and missing details, change the quantity from 120 to 180, and verify the corrected draft. Show me where to resume.

Or:

> Use boomscrolling-response-drafts with this source post and URL: [paste both]. My intended voice is [describe it]. Compare with these earlier replies: [paste approved examples, or say none supplied]. Give me three distinct drafts to review. Save them locally; do not post.

No installer? Download this repository, open your chosen skill's `SKILL.md` in your agent and ask it to follow that file with your supplied inputs. Keep the skill folder's references and scripts together. Without file access, the agent can return named document sections for you to save; it must say that no files were written.

## What these companions cover

The first-job skill demonstrates a narrow check-and-correct workflow. The optional [Fort Rock Media Agent Setup Kit](https://fortrockmedia.com/agent-setup-kit/?utm_source=github&utm_medium=skill&utm_campaign=agent_companions&utm_content=check_agent_job) is a $20 one-time guided kit for broader setup and repeat work. Buying it is unnecessary for this exercise.

The experimental BoomScrolling skill works from material you supply. It does not fetch your feed, access a private API, retain taste between projects or publish. [BoomScrolling](https://fortrockmedia.com/boomscrolling/?utm_source=github&utm_medium=skill&utm_campaign=agent_companions&utm_content=response_drafts) offers the visual reading and response-review experience. This local companion's usefulness outside the app still needs participant feedback.

## Feedback and verification

If you try a skill, an issue saying what you supplied, what needed correction and whether you could resume is useful. Use fictional or redacted material; do not put customer notes or private drafts in public issues. No automatic feedback collection is built in.

See [acceptance checks](docs/acceptance.md) and [verification evidence](docs/verification.md). Run the offline duplicate-check regressions with:

```sh
python3 -B -m unittest discover -s tests -v
```

[MIT license](LICENSE). These are companion instructions, not the private production apps or the full paid kit.
