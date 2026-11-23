# Phone AI evaluation (2026-11-23)

Runs fixed student conversations through Apple's on-device model on this Mac (macOS 26+ with Apple Intelligence on). Findings: `research/08-phone-ai.md`. Plan: `design/slices/PHONE-AI-plan.md`.

- `plain-reply.swift`: text replies. `swiftc -o /tmp/plain plain-reply.swift`, then `/tmp/plain prompts/<file>.txt rebuild|session [temperature]`. `rebuild` copies the app today (a new session every message, the history pasted into one prompt); `session` keeps one session per chat.
- `structured-reply.swift`: guided generation with a `CoachReply` type. `/tmp/structured prompts/E-structured.txt`.
- `runs/`: the transcripts the note quotes. Each was run once, on the macOS 27.2 model, which is newer than the model on iOS 26.2.

Not part of `checks/check.sh`: the model is not on every machine.
