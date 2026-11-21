# ADHD focus and learning app — research and plan

A school project for Ben: a tool that helps students with ADHD stay on task while studying, checks what they are learning, and points them to resources.

## Files

| File | Contents |
|---|---|
| `AGENTS.md` | Instructions for AI agents working here: which knowledge to read, rules that always apply, and the design, code, and test review loop |
| `CLAUDE.md` | One-line file that imports `AGENTS.md`, because Claude Code reads `CLAUDE.md` |
| `DECISIONS.md` | Technical and product choices made in advance, with reasons, so agents do not re-ask; also lists what is still Ben's or a parent's to decide |
| `PROGRESS.md` | What is built, what is waiting on whom, and the ordered list of what to build next |
| `ios/` | The iPhone app: a self-contained folder with its own `README.md`, rules, decisions, research copy and task list. Designed, not built |
| `ROADMAP.md` | Plan for the next stage: chat, search, web app or Apple app, on-device AI, and the interface clean-up, with the decisions each needs |
| `00-knowledge-summary.md` | **Start here.** What the research supports, design principles, things to avoid, honest claims, privacy rules, and how to test, independent of what gets built |
| `01-evidence.md` | What the research says about each part of the idea, with confidence ratings and sources |
| `02-platform-and-privacy.md` | What a Chrome extension and an iOS app can and cannot do; privacy rules; existing products |
| `03-recommendations-and-plan.md` | Recommended approach, feature list, phases, a way to test it, and decisions for Ben |
| `04-design-and-gamification-ideas.md` | Design and game ideas for the current web-app plan; what that plan changes; evidence for assignment breakdown |
| `05-adhd-ideation.md` | Wider brainstorm from the `adhd` ideation skill: 42 ideas and 9 hybrids, scored, with a shortlist and three deepened picks |

## Headline findings

- **Best-supported features:** self-monitoring check-ins and recall quizzes.
- **Blocking works best as friction:** a pause screen with a way back, not a hard wall.
- **The flow questionnaire needs redesign:** no questionnaire reliably predicts what produces flow. Use it as a starting guess and let the app test it.
- **AI must give hints, not answers:** unrestricted AI help lowered later test scores in a high school trial. Version 1 makes no AI calls at all.
- **Do not build brain-training games or claim to treat ADHD.**
- **Build a web app first.** A browser extension was the original recommendation and is now a stretch goal; a web app cannot block other sites.

## Status

Research pass complete. Nothing is built. The build plan is a web app with assignment breakdown as the core feature, and the choices for it are in `DECISIONS.md`. File 03 was written before that plan and still recommends an extension first; `DECISIONS.md` wins where they differ. Most evidence was read at abstract level; items marked *(not read)* or **(confirm)** in the files still need checking.

## Next step

Open this folder in Claude and say: "Read PROGRESS.md and start on the first item under Next." `AGENTS.md` tells it how to work.
