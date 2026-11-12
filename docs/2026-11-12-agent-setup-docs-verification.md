# Customer agent setup documentation

The three repository entrypoints link to the customer agent guide and one shared setup prompt. The prompt checks access, requests the writer permissions needed for a three-draft test, reads back the exact saved IDs/text, and keeps recurring work private and unapproved. Scheduling follows a successful manual test and the user's chosen cadence/time zone, with existing-task reuse and a verified first run.

Checks passed: 41 relative documentation/skill links and anchors, the three skills' frontmatter, JSON client examples, CLI help, the fictional offline demo, `boom schema submit-candidates` and `git diff --check`. Reviewed the connected writer skill's stable-ID/readback, buffer/cadence and explicit-publication boundaries against the setup prompt. Documentation only; the full client test suite was not rerun.

Scheduling statements were checked against the official [ChatGPT scheduled-task guide](https://learn.chatgpt.com/docs/automations?surface=app) and [Claude Cowork scheduled-task guide](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork). Cloud runs need accessible connected tools/files; local CLI/file work needs the computer and agent running. The primary `/studio/agents/` route and anchors are being implemented separately and require a deployment check before release.

No sign-in, new grant, provider call, live draft submission, schedule or public post was performed. No private voice guidance was included in the public files. These checks do not establish a customer outcome or successful unattended execution.
