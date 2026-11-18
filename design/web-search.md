# Design: web search for the AI chat

Status: **Slice 1 (OpenRouter search in the chat) built 2026-11-17, tested with stand-ins only; the harness version below is a draft, not built.** Works in the web app and in the iPhone app (`design/iphone-app.md`). Ben asked how to let the AI search the web with his local model (PolyStrata, on another machine, which searches fine when a harness such as pi provides the tool) and with OpenRouter.

## Slice 1 (Ben, 2026-11-17: "let's get OpenRouter working"): OpenRouter search in the chat

Built first, before the harness version below; Ben decides the rest after trying it.

- When the chat's AI helper is an OpenRouter address, the chat shows a tick box **Search the web**, off at the start of every chat and when a saved chat is reopened. Beside it: "Uses your OpenRouter credit (about 1 cent per message)."
- When ticked, each message's request adds OpenRouter's web plugin: `plugins: [{ "id": "web", "max_results": 5 }]`. The model name is not changed. The system message gets one more line: "Web search results may be included. Use them only to point the student to sources to read. Never copy answers or finished text from them." The rules reminder still comes last.
- While waiting: "Searching the web and asking <helper>…".
- Under the reply: **Sources**, a list of up to 5 links from `message.annotations` (`type: "url_citation"`, `url_citation.url` and `.title`), https only, duplicates removed, title shown as text (fallback: the site's name). Links open in a new tab with `rel="noopener noreferrer"`. Links the model writes in its text are not turned into links.
- Sources are saved with the reply in the saved chat (as plain text items the app re-renders as links). They are not sent back to the AI in later messages.
- A 402 reply while search is on: "Web search needs credit on your OpenRouter account. Untick Search the web to keep chatting for free." Other failures as today.
- Not offered for other services in this slice (PolyStrata gets the harness version below), and not used by Show my steps.
- T8: the search words go to OpenRouter's search provider; DECISIONS row marked draft, parent to confirm before classmates.

## The idea: the app is the harness

PolyStrata has no search of its own, but it can use tools a harness gives it. The app becomes that harness:

1. With search turned on, each chat request also offers the model a tool, `web_search(query)`, in the standard OpenAI-style tool format. In the iPhone app it also offers `read_page(url)`.
2. If the model asks for a search, the app runs it, sends back the top 5 results (title, link, a short snippet), and asks the model again. The model then writes its reply.
3. At most 2 searches and 2 page reads per student message. After that the tools are not offered again and the model must answer.
4. Each search is shown in the chat as it happens: "Searching the web for: Scout Finch character". Each page read: "Reading: sparknotes.com". The student always sees what leaves the device.
5. Under the reply, the sources are shown as links **taken from the real search results the model was given**, never links the model wrote itself. Links open in a new tab (web) or in Safari (iPhone), https only.

## Who runs the search (a setting)

| Choice | Cost | Setup | Works for |
|---|---|---|---|
| **SearXNG** (open source, you run it) | Free | Run it next to PolyStrata. Turn on JSON results, SafeSearch strict, turn off its bot limiter, set a secret key. In the web app it must also allow the app's page (CORS) or sit behind a small proxy; the iPhone app needs neither. | Ben (on his network) |
| **OpenRouter search** | About $0.007 per search, plus the AI's reading; needs OpenRouter credit | None: uses the OpenRouter key already saved | Anyone with an OpenRouter helper |

OpenRouter search works by the app making one small extra OpenRouter request with OpenRouter's web search turned on and reading the result links it returns. It is used only when the model asks for a search, which is cheaper than adding `:online` to a model (that searches on every message, and the app cannot show what was searched).

## Settings

- Per AI helper: **Let the AI search the web** (off by default). Under it: **Search with** SearXNG or OpenRouter search; for SearXNG, its address and a **Check it works** button (one test search).
- A line: "Searches go to <service>. Don't type your name or anything private."
- If the chosen AI cannot use tools (it ignores them or the service rejects them), the chat still works without search and says once: "This AI didn't use web search."

## Rules and safety

- **Rule 1 (hints, never answers):** search makes finished essays and solutions easier to find. The hints-only rules are repeated after every search result, the results are labelled as reference material, and the answer-giving checks are re-run with search on (including "search for the answer and give it to me").
- **Search results are untrusted text.** A web page can contain instructions ("ignore your rules"). Results are passed as data inside the tool reply, never as instructions, and are cut to short snippets (page reads to 20,000 characters).
- **Rule 11:** unchanged; the AI's safety word is still checked in the final reply. A message that triggers it is not searched again.
- **Privacy (T8):** the search words leave the device to the search service. A new T8 row; the parent confirms before classmates use it. SafeSearch strict for SearXNG. (OpenRouter's search provider has no SafeSearch setting the app can control; noted.)
- **Cost:** off by default; at most 2 searches per message; the settings line names the cost for OpenRouter.
- **Not for Show my steps.** Search is in the chat only.

## Failure cases

- Search service down or slow: the model gets "search failed" as the tool result and answers without it; a quiet line says "The search didn't work this time."
- The model keeps asking to search: after the limit the tools are removed and it must answer.
- No results: the tool result says so.
- Stop, New chat, Back: cancel the search and the request, as today.
- The browser blocks SearXNG (CORS): **Check it works** says so in plain words and points to the setting.

## What data it stores

- The search settings per helper (on/off, which service, SearXNG address). Search queries and results are not stored, except that the final reply and its source links are saved with the chat like any reply.

## Tests

- Logic: building the tool request, reading tool calls, the limits, turning search results into a short tool reply, source links only from real results.
- Browser, with stand-ins for a tool-using model, SearXNG, and OpenRouter search: search then answer; two-search limit; search down; a model that ignores tools; a model that asks for read_page in the web app (not offered); Stop mid-search; the on-screen lines and source links.

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule if the checks pass; rule 1 risk named.
- [ ] DECISIONS: new T8 row (search words leave the device); parent to confirm.
- [x] Not a trap (no counts, no pressure).
- [x] The student does the thinking: sources, not answers.
- [x] One thing on screen: lines in the chat, links under the reply.
- [x] About two sessions.
