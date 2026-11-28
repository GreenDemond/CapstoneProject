# Google Gemini address

## What the student sees
In "Another service", the student can type Google's base address, `https://generativelanguage.googleapis.com/v1beta/openai` (trailing slash optional). The app adds `/chat/completions`. The model list comes from `.../v1beta/openai/models`; the student picks one or types one. The default model is `models/gemini-flash-lite-latest`, chosen by the parent on 2026-11-28 (a recorded parent decision under DECISIONS T6, not an agent guess). It is used when no model is typed, and the pull-down starts on it even if Google's list lacks it. It is sent unchanged. Whether Google still serves this alias was not verified; if not, the student sees the service's real error and can pick or type another model. Ids such as `models/gemini-...` are used exactly as Google gives them.

## Student-visible wording (waiting for the parent's okay)
The hint under "Its web address" now reads: "It looks like http://my-computer:8080, https://example.com or https://generativelanguage.googleapis.com/v1beta/openai."

## Research support
None needed; this is an address rule. Design judgment, to be tested with a real key.

## Data
Nothing new stored. The key stays encrypted on the device and goes only to the typed host.

## Limits
Only the one extra path `/v1beta/openai`, only for `generativelanguage.googleapis.com`. Google's native `generateContent` addresses, `/models/...` addresses and Vertex AI are still refused with the existing plain message.

## Not verified
Confirmed 2026-11-28 by the parent: the browser is allowed to call Google, and the thinking-effort fields do not break it. Still unverified: Google's current terms and whether the `-latest` model name stays available.
