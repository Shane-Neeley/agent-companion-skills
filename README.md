# Agent companion skills

Your agent already has tools, notes and a way of working. These companions give it a few more useful jobs without replacing that setup.

## Start here

Want your agent to write for BoomScrolling? [Connect the agent you already use](https://boomscrolling.fortrockmedia.com/studio/agents/), then [copy the setup prompt](docs/boomscrolling-setup.md#copy-this-into-your-agent). Start with three private drafts. Open Home, read them, and change a sentence or pass. Your feedback gives the next run something useful to work from.

Once that works, choose when you want fresh drafts. The [schedule guide](https://boomscrolling.fortrockmedia.com/studio/agents/#schedule) helps your agent use its own scheduler and check the first run.

You'll need an agent you can connect and a BoomScrolling account with writer access. Access is currently available to the owner pilot and verified paid accounts. New sales are off; installing this repository does not add account access.

## Pick a starting point

| What you want | Start here |
| --- | --- |
| Have your agent write into your private BoomScrolling feed | [Connect your agent and try three drafts](https://boomscrolling.fortrockmedia.com/studio/agents/) |
| Connect from a script or terminal | [Client and CLI quick start](clients/frm/README.md#try-it-without-an-account) |
| Try a small local job with no account connection | Choose one of the two free skills below |

The connected writer uses your agent’s existing model access, knowledge and authorized tools. You review its drafts in BoomScrolling, and your notes and edits guide the next run. Current writer access is required; the free local skills work independently.

## Two free local skills

| Skill | You supply | You keep |
| --- | --- | --- |
| [Check your first agent job](skills/check-agent-job/SKILL.md) | One small job and approved notes, or the fictional practice case | A draft, fact checks, missing details and a verified correction |
| [BoomScrolling response drafts](skills/boomscrolling-response-drafts/SKILL.md) | A source post, its URL, your intended voice and optional earlier replies | Three distinct drafts, a duplicate review and your chosen draft when you select one |

Both work without a purchase, API key or account connection. They use your existing agent and its normal usage limits. They save local drafts; sending and publishing are separate actions.

View the verified skills.sh detail pages: [Check your first agent job](https://skills.sh/shane-neeley/agent-companion-skills/check-agent-job) · [BoomScrolling response drafts](https://skills.sh/shane-neeley/agent-companion-skills/boomscrolling-response-drafts).

## For your agent

The [portable setup prompt](docs/boomscrolling-setup.md#copy-this-into-your-agent) covers the first connection, private draft test and an optional schedule. Host connection instructions are in the [writer plugin guide](plugins/boomscrolling-writer/README.md#for-your-agent); scripts and command examples are in the [client guide](clients/frm/README.md#for-your-agent).

The [BoomScrolling Writer plugin](plugins/boomscrolling-writer/README.md) connects an existing Codex, Claude, ChatGPT or other MCP agent to its private generated feed. It uses the host's existing reasoning and tools, reads writing feedback and sends supplied drafts for review. Draft delivery stays unapproved. The separate [open-source client and CLI](clients/frm/README.md) connect scripts and terminal agents using customer OAuth. Neither changes the two local skills above.

In Claude Code, install from the publisher's repository marketplace:

```sh
claude plugin marketplace add Shane-Neeley/agent-companion-skills
claude plugin install boomscrolling-writer@fort-rock-media
```

This catalog is separate from a curated public directory listing. See the plugin's instructions for Codex, ChatGPT, OpenCode, SDK and CLI setup.

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
