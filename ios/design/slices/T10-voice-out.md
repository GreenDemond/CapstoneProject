# T10 Voice out
Status: built 2026-11-20 (compile-checked; logic tested with fakes; the real voice, headphones and silent switch were not run)

## What the student sees and does
1. With voice on (I talk or We talk), the work screen shows **Read this step**. Tapping it speaks the step; the button becomes **Stop reading**. Tapping it again, or pressing any of the five buttons, or the microphone, stops the voice.
2. In Quiet there is no button and nothing can speak.
3. "Only speak through headphones" is on by default. With no headphones connected, Read this step says nothing aloud and shows: "Your voice setting only speaks through headphones. Plug some in to hear this." The text stays on screen.
4. AI replies and the app's prompts are spoken by themselves only in We talk (wired in T12), a whole sentence at a time.
5. The trusted-adult line is shown always, and spoken only in We talk with headphones connected.
6. Taking the headphones out, a phone call, or another app taking the audio stops the voice.

## Research link
`design/02` 2.2; `DECISIONS.md` D7 (built on the recommendation, pending confirmation), P10.

## What it stores
The settings that already exist (voice mode, headphones only, voice, speed). Nothing new.

## What leaves the phone
Nothing. Built-in voices only.

## Distracted, stuck, back after a week
Pressing any check-in button stops the voice. Nothing is carried over.

## Differs from the web app
Yes: the web app does not speak.

## Verified declarations (SDK headers, read 2026-11-20)
`AVFAudio.framework/Headers/AVSpeechSynthesis.h`: `-[AVSpeechSynthesizer speakUtterance:]`, `-[AVSpeechSynthesizer stopSpeakingAtBoundary:]` with `AVSpeechBoundaryImmediate`, delegate `didFinishSpeechUtterance:` and `didCancelSpeechUtterance:`, `+[AVSpeechSynthesisVoice voiceWithIdentifier:]`, `+[AVSpeechSynthesisVoice speechVoices]`, `AVSpeechUtterance.rate`. `AVAudioSessionTypes.h`: `AVAudioSessionPortHeadphones`, `...BluetoothA2DP`, `...BluetoothHFP`, `...USBAudio`, `AVAudioSessionRouteChangeReasonOldDeviceUnavailable`, `AVAudioSessionCategoryAmbient`. `AVAudioSessionInterruptionTypeKey` is deprecated in iOS 27 and present from 6.0.

## Tests
`SpeakerTests` (20): in Quiet nothing can call the speaker (every kind, headphones in or out); headphones-only with none connected speaks nothing and says why; headphones-only off speaks through the phone; I talk speaks only what was asked for; the trusted-adult line needs headphones; voice and speed from settings; stop, finish, headphones removed mid-sentence, interruption; plugging in starts nothing; blank text; the microphone stops the voice first; the sentence splitter on text arriving in pieces (numbers like 3.14, closing quotes, new lines, ellipsis, no punctuation).
Device-only: the voice itself, the silent switch, another app playing audio, a Bluetooth route. `checks/device-checks.md` steps 27 to 33.

## Silent switch and other apps
The category is `.ambient`, which follows the silent switch and mixes with other audio. This is a judgment (a student must be able to silence it); to be checked on a phone.

## Unverified
That `.ambient` gives a clear voice with headphones; that `waiting` counting matches the delegate calls on a phone; that a Bluetooth speaker is not mistaken for headphones (A2DP speakers count as headphones here).

## Gates
No Advisor available. Gate 2 owed (Voice/, words a student hears).
