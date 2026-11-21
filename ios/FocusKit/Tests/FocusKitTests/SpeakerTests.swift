import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct SpeakerTests {
  let output = FakeSpeechOutput()
  let headphones = FakeHeadphones(connected: true)
  let speaker: SpeakerModel

  init() {
    speaker = SpeakerModel(output: output, headphones: headphones)
    speaker.settings = { Settings(voiceMode: .weTalk, headphonesOnly: true) }
  }

  private func use(_ settings: Settings) {
    speaker.settings = { settings }
  }

  @Test func inQuietNothingCanCallTheSpeaker() {
    use(Settings(voiceMode: .quiet, headphonesOnly: false))
    for kind in [SpokenKind.step, .reply, .trustedAdult] {
      #expect(speaker.speak("Hello there.", kind: kind) == .silent)
    }
    #expect(output.spoken.isEmpty)
    #expect(!speaker.isSpeaking)
  }

  @Test func quietEvenWithHeadphonesIn() {
    use(Settings(voiceMode: .quiet, headphonesOnly: true))
    #expect(speaker.speak("Hello.", kind: .step) == .silent)
    #expect(output.spoken.isEmpty)
  }

  @Test func headphonesOnlyWithNoHeadphonesSpeaksNothingAndSaysWhy() {
    headphones.set(connected: false)
    #expect(speaker.speak("Read the question.", kind: .step) == .needsHeadphones)
    #expect(output.spoken.isEmpty)
    #expect(speaker.note == Words.readNoHeadphones)
    #expect(speaker.speak("A reply.", kind: .reply) == .needsHeadphones)
    #expect(output.spoken.isEmpty)
  }

  @Test func headphonesOnlyOffSpeaksThroughThePhone() {
    headphones.set(connected: false)
    use(Settings(voiceMode: .weTalk, headphonesOnly: false))
    #expect(speaker.speak("Hello.", kind: .reply) == .speak)
    #expect(output.spoken == ["Hello."])
  }

  @Test func iTalkSpeaksOnlyWhatTheStudentAskedToHear() {
    use(Settings(voiceMode: .iTalk, headphonesOnly: false))
    #expect(speaker.speak("Reply", kind: .reply) == .silent)
    #expect(speaker.speak("Read this step", kind: .step) == .speak)
    #expect(output.spoken == ["Read this step"])
  }

  @Test func theTrustedAdultLineIsSpokenOnlyWithHeadphonesIn() {
    use(Settings(voiceMode: .weTalk, headphonesOnly: false))
    headphones.set(connected: false)
    #expect(speaker.speak("Please talk to an adult.", kind: .trustedAdult) == .silent)
    #expect(output.spoken.isEmpty)
    headphones.set(connected: true)
    #expect(speaker.speak("Please talk to an adult.", kind: .trustedAdult) == .speak)
    #expect(output.spoken.count == 1)
  }

  @Test func theVoiceAndSpeedFromSettingsAreUsed() {
    use(Settings(voiceMode: .weTalk, headphonesOnly: false, voiceId: "voice-1", speechRate: 0.4))
    speaker.speak("Hi.", kind: .reply)
    #expect(output.lastVoiceId == "voice-1")
    #expect(output.lastRate == 0.4)
  }

  @Test func oneTapStopsAtOnceAndOnlyWhenSpeaking() {
    speaker.stop()
    #expect(output.stopCount == 0)
    speaker.speak("A long sentence.", kind: .reply)
    #expect(speaker.isSpeaking)
    speaker.stop()
    #expect(output.stopCount == 1)
    #expect(!speaker.isSpeaking)
  }

  @Test func finishingClearsSpeaking() {
    speaker.speak("Short.", kind: .reply)
    output.finish()
    #expect(!speaker.isSpeaking)
  }

  @Test func headphonesUnpluggedMidSentenceStopsTheVoice() {
    speaker.speak("Halfway through a sentence.", kind: .reply)
    headphones.set(connected: false)
    #expect(output.stopCount == 1)
    #expect(!speaker.isSpeaking)
  }

  @Test func pluggingHeadphonesInDoesNotStartAnything() {
    headphones.set(connected: false)
    headphones.set(connected: true)
    #expect(output.spoken.isEmpty)
  }

  @Test func anInterruptionStopsTheVoiceAndKeepsNothingWaiting() {
    speaker.speak("One.", kind: .reply)
    speaker.interrupted()
    #expect(!speaker.isSpeaking)
    #expect(output.stopCount == 1)
  }

  @Test func blankTextIsNotSpoken() {
    #expect(speaker.speak("   \n", kind: .step) == .silent)
    #expect(output.spoken.isEmpty)
  }

  @Test func theMicrophoneButtonStopsTheVoiceFirst() async throws {
    let content = try loadContent()
    let fake = FakeSpeechInput()
    let app = AppModel(
      content: content, store: MemoryStore(limits: content.limits),
      services: Services(speechInput: fake, speechOutput: output, headphones: headphones))
    app.updateSettings { $0.voiceMode = .weTalk }
    app.speaker.speak("Talking.", kind: .reply)
    await app.dictation.pressDown(existing: "")
    #expect(!app.speaker.isSpeaking)
    #expect(output.stopCount >= 1)
  }

  // MARK: The sentence splitter

  @Test func aSentenceIsReleasedOnlyWhenComplete() {
    var splitter = SentenceSplitter()
    #expect(splitter.add("Start with the first") == [])
    #expect(splitter.add(" question") == [])
    #expect(splitter.add(". Then") == ["Start with the first question."])
    #expect(splitter.add(" read it again") == [])
    #expect(splitter.add("? Good.") == ["Then read it again?"])
    #expect(splitter.finish() == "Good.")
    #expect(splitter.finish() == nil)
  }

  @Test func theSplitterWaitsForWhitespaceSoNumbersAreNotCut() {
    var splitter = SentenceSplitter()
    #expect(splitter.add("It is 3.14") == [])
    #expect(splitter.add(" roughly. Yes! ") == ["It is 3.14 roughly.", "Yes!"])
  }

  @Test func closingQuotesStayWithTheirSentence() {
    let result = SentenceSplitter.split("She said \"stop.\" Then left. And")
    #expect(result.sentences == ["She said \"stop.\"", "Then left."])
    #expect(result.remainder == " And")
  }

  @Test func aNewLineEndsASentence() {
    let result = SentenceSplitter.split("Read the page\nWrite one line\nCheck")
    #expect(result.sentences == ["Read the page", "Write one line"])
    #expect(result.remainder == "Check")
  }

  @Test func ellipsisAndRepeatedMarksEndOnce() {
    let result = SentenceSplitter.split("Hmm... okay?! Next ")
    #expect(result.sentences == ["Hmm...", "okay?!"])
  }

  @Test func noPunctuationMeansNothingYet() {
    #expect(SentenceSplitter.split("Just words with no end").sentences.isEmpty)
    #expect(SentenceSplitter.split("").sentences.isEmpty)
  }
}
