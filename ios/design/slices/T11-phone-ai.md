# T11 The phone's AI
Status: built 2026-11-20 (logic tested with a fake model; compile-checked for generic iOS; the real model was NOT run, so the AI is "built, not cleared")

## What the student sees and does
Nothing yet on its own: T12 (Talk) and T13 (Step coach) use this layer. What it guarantees:
1. A reply is shown only as whole sentences, and only after the safety word and the finished-answer check have passed the whole reply so far.
2. If the AI says the safety word (any letter case, with punctuation, split across pieces, or in the middle of a reply), the reply is replaced by the fixed trusted-adult line and the message is not kept.
3. If Apple's guardrail stops the student's message (an error before any text), the same line is shown. A guardrail stop after some text is only "The AI on this iPhone couldn't answer that one."
4. A reply that looks like finished work (a "here is your essay" opening, "the answer is", a very long reply) is replaced by "I can give hints, not the finished answer. What have you tried so far?". This is a heuristic net, not the answer-giving check; T14 on a real phone decides.
5. If the chat is too big for the model, the oldest messages are dropped and it tries once more; the second failure says "This chat got long. Start a new chat to keep going."
6. Unavailable (not eligible, switched off, not ready, other) gives one calm line and sends nothing.

## Research link
`design/03` 3.1 to 3.5; `AGENTS.md` rule 1 and rule 11; `research/00-knowledge-summary.md` section 2 (answer-giving AI).

## What it stores
Nothing here. (Chats are saved by T12 and never include a message that triggered the line.)

## What leaves the phone
Nothing. `SystemLanguageModel.default` only. `PrivateCloudComputeLanguageModel` is not referenced; a test scans the Swift sources and fails if the name appears, and checks `import FoundationModels` appears in one file under `AI/Apple/`.

## D6
Built on the recommendation (phone-only AI, no keys, no cloud model); D6 stays "waiting: parent" in `DECISIONS.md`.

## Distracted, stuck, back after a week
Stop mid-reply cancels the model (tested). Nothing carries over.

## Differs from the web app
Yes: the web app used a web AI. The rules text, guide cleaning and instructions are the same shared code and cases.

## Verified Apple declarations (iPhoneOS 27.2 SDK, FoundationModels.swiftinterface, read 2026-11-20)
- `@available(iOS 26.0, ...) final public class SystemLanguageModel`; `static var default: SystemLanguageModel`; `final var availability: SystemLanguageModel.Availability`; `@frozen enum Availability { case available; case unavailable(UnavailableReason) }`; `enum UnavailableReason { case deviceNotEligible, appleIntelligenceNotEnabled, modelNotReady }`.
- `@available(iOS 26.0, ...) @backDeployed(before: iOS 26.4, ...) final public var contextSize: Int` (returns 4096 before 26.4; iOS 26.0 is enough to call it).
- `@available(iOS 26.4, ...) nonisolated(nonsending) final public func tokenCount(for prompt: some PromptRepresentable) async throws -> Int`. Guarded with `#available(iOS 26.4, macOS 26.4, *)`; below that the engine estimates three characters to a token.
- `final public class LanguageModelSession`: `convenience init(model: SystemLanguageModel = .default, tools: [any Tool] = [], instructions: String? = nil)`; `final func streamResponse(to prompt: String, options: GenerationOptions = ...) -> sending LanguageModelSession.ResponseStream<String>`; `ResponseStream` is an `AsyncSequence` of `Snapshot` with `var content: Content.PartiallyGenerated` (a `String` here, cumulative).
- Errors: `LanguageModelSession.GenerationError` (iOS 26, deprecated in 27): `.exceededContextWindowSize`, `.guardrailViolation`, `.refusal(_, _)`, `.assetsUnavailable`. `@available(iOS 27.0, ...) @nonexhaustive enum LanguageModelError`: `.contextSizeExceeded`, `.guardrailViolation`, `.refusal`, `.timeout`, `.rateLimited`, and others. Both forms are mapped to `ModelFailure` (`AppleLanguageModel.failure(from:)`); the iOS 27 form sits behind `#available(iOS 27.0, macOS 27.0, *)`.
- Not used: `@Generable`, `Tool` (no macro or tool use; see T13), `PrivateCloudComputeLanguageModel` (iOS 27, sends text off the phone).
- Deprecation warnings for `GenerationError` appear in the iOS 27 SDK build. They are expected: the iOS 26 form must be handled because the minimum is iOS 26.0.

## Tests
`ChatEngineTests` (29, fake model): whole sentences then the whole reply; nothing shown before a sentence is complete; the word alone, split across pieces, mid-reply, in five other forms (the words in an ordinary sentence are not the signal); a sentence ending where the word could start is held back; every shown text is checked and ends a sentence; guardrail on the student's message; guardrail mid-reply; refusal; empty reply; unknown error; each unavailable reason sends nothing; context full once (retry with less) and twice (too long); newest message always kept; token counting used when offered; no token counting path (estimate, trims cautiously); Stop cancels the model; rules, kind, reminder in the instructions; a guide that tries to close its block; the step from Stuck quoted before the reminder; history in the prompt; four finished-answer replies and a very long one are replaced; an ordinary hint is not; framework import and cloud-model scan.
The fixed phrase list (`design/03` 3.5 item 3) is NOT built: it needs the parent and Ben's approval.

## Simulator
The real model could not be run: no simulator runtime is installed, and this was not tried on a device. Only the fake ran. The Apple file compiles for iOS and for macOS.

## Unverified
That the real model streams cumulative `String` snapshots as read; that `tokenCount(for: String)` accepts a `String` (it compiled); how often the real model says the word or trips the guardrail on school topics; that the answer guard's phrases and lengths suit the real model's replies (T14).

## Gates
No Advisor available. Gate 2 owed (AI/, words a student reads, instructions). Gate 5 (API doubt): each declaration above was read in the interface file.
