# Google Gemini address

## What the student sees
In "Another service", the student can type Google's base address, `https://generativelanguage.googleapis.com/v1beta/openai` (trailing slash optional). The app adds `/chat/completions`. The model list comes from `.../v1beta/openai/models`; the student picks one or types one. No default model is chosen (DECISIONS T6). Ids such as `models/gemini-...` are used exactly as Google gives them.

## Student-visible wording (waiting for the parent's okay)
The hint under "Its web address" now reads: "It looks like http://my-computer:8080, https://example.com or https://generativelanguage.googleapis.com/v1beta/openai."

## Research support
None needed; this is an address rule. Design judgment, to be tested with a real key.

## Data
Nothing new stored. The key stays encrypted on the device and goes only to the typed host.

## Limits
Only the one extra path `/v1beta/openai`, only for `generativelanguage.googleapis.com`. Google's native `generateContent` addresses, `/models/...` addresses and Vertex AI are still refused with the existing plain message.

## Not verified
Browser CORS from Google, and how Google handles the thinking-effort fields (the app retries without them if refused). Try once with a real key.
