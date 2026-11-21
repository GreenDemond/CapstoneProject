# T09 Voice in
Status: built 2026-11-20 (compile-checked for generic iOS; logic tested with a fake; the real microphone and speech were not run)

## What the student sees and does
1. Voice is off until the student picks "I talk" or "We talk" under Me (T15). With Quiet, no microphone button is shown anywhere.
2. With voice on, a microphone button sits beside the assignment box and the "say my steps" box (Talk gets one in T12).
3. The first press shows one sentence ("The microphone listens only while you hold the button, and your voice is turned into words on this iPhone. It is never recorded.") with Okay and Not now. Okay is when iOS asks for the microphone. The microphone is not turned on by that press; the student presses again.
4. Hold the button: "Listening" shows, and words appear in the same box typing uses, after what was already there. Letting go stops. A quick tap instead starts and the next tap stops.
5. Refused permission: typing works; a quiet line says it can be turned on in Settings, with an Open Settings link. The app never asks again by itself.
6. Language not supported: the button is hidden (the keyboard's own dictation key still works).
7. Language files not on the phone: a line explains a one-time download from Apple (nothing of the student's is sent) and a Download button. It never downloads by itself.
8. A phone call or another app taking the audio, or the app leaving the front, stops listening; the words so far stay.

## Research link
`design/02` 2.2, 2.11; `DECISIONS.md` D7 (built on the recommendation, pending confirmation); `research/00-knowledge-summary.md` section 5 (no sound by default).

## What it stores
One flag, `micExplained`, in `voiceflags.json`. Never audio, never the words except as the text box already stores them.

## What leaves the phone
Nothing. Speech to text runs on the phone. The one Apple download (language files) brings files in; nothing is sent out. It is not a D8 row, and the parent should confirm that reading.

## Distracted, stuck, back after a week
Distracted: letting go or leaving the app stops the microphone. Stuck: typing and the keyboard's own dictation always work. Back after a week: nothing is carried over.

## Differs from the web app
Yes: the web app has no speech input.

## Verified Apple declarations (iPhoneOS 27.2 SDK, read 2026-11-20)
`Speech.framework/.../arm64e-apple-ios.swiftinterface`, all `@available(anyAppleOS 26, *)`:
- `final public actor SpeechAnalyzer`: `convenience init(modules: [any SpeechModule], options: SpeechAnalyzer.Options? = nil)`, `final func start<InputSequence>(inputSequence: InputSequence) async throws where InputSequence.Element == AnalyzerInput`, `final func finalizeAndFinishThroughEndOfInput() async throws`, `final func cancelAndFinishNow() async`, `static func bestAvailableAudioFormat(compatibleWith: [any SpeechModule], considering naturalFormat: AVAudioFormat?) async -> AVAudioFormat?`
- `final public class SpeechTranscriber`: `convenience init(locale: Locale, preset: SpeechTranscriber.Preset)`, `static let progressiveTranscription` (a `Preset`), `static var isAvailable: Bool`, `static func supportedLocale(equivalentTo: Locale) async -> Locale?`, `final var results: some AsyncSequence<SpeechTranscriber.Result, any Error>`, `Result.text: AttributedString`, `isFinal` (from `SpeechModuleResult`).
- `AssetInventory`: `static func status(forModules:) async -> Status` with `.unsupported .downloading .supported .installed`; `static func assetInstallationRequest(supporting:) async throws -> AssetInstallationRequest?`; `AssetInstallationRequest.downloadAndInstall() async throws`.
- `struct AnalyzerInput`: `init(buffer: AVAudioPCMBuffer)`.
`AVFAudio.framework/Headers/AVAudioApplication.h`: `@property (readonly) AVAudioApplicationRecordPermission recordPermission` (iOS 17.0), `+ requestRecordPermissionWithCompletionHandler:` (iOS 17.0); `AVAudioSessionInterruptionTypeKey` is deprecated in iOS 27 but present from 6.0, used because the minimum is iOS 26.0.
Speech recognition permission (`SFSpeechRecognizer`) is not used by `SpeechAnalyzer`. The usage string for it is added anyway because the briefing asked for it and it does no harm.

## Tests
`DictationTests` (18, fake input): the microphone starts only from a press (nothing else calls it); hold and release; words after existing text; last words on stop; release with nothing said; tap to start, tap to stop; toggle; first-time explanation without listening; refusal; permission taken away later; unsupported language hides the button; download offered and never automatic; download failing; interruption; failure; background; very long speech; `willListen`; the saved flag holds no audio.
Device-only: the real microphone, accuracy, headphones, a phone call, the download. `checks/device-checks.md` steps 19 to 24.

## Simulator
Not possible here: no simulator runtime is installed. The app compiles for a generic iOS device.

## Unverified
That `SpeechTranscriber` works with `.progressiveTranscription` and the converter in `AppleSpeechInput.Pump` on a real phone; that `AVAudioApplication.requestRecordPermission()` is imported with the async form (it compiled, so it is); the `SpeechAnalyzer` model for Ben's language being installed (the Download button covers it).

## Gates
No Advisor available. Gate 2 owed (Voice/, permission, microphone). Gate 5 would apply if any declaration above were wrong; each was read in the interface file.
