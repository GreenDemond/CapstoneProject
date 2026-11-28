import Foundation
import Testing

@testable import FocusKit

/// Lets the model's reading task run.
@MainActor
func settle() async {
  for _ in 0..<30 { await Task.yield() }
}

@MainActor
@Suite struct DictationTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()
  let input: FakeSpeechInput

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
    input = FakeSpeechInput()
  }

  private func model(_ input: FakeSpeechInput? = nil, limit: Int = 200) -> DictationModel {
    DictationModel(input: input ?? self.input, store: store, clock: clock, limit: limit)
  }

  /// Presses, holds for a second, and lets go.
  private func hold(_ model: DictationModel, existing: String = "") async {
    await model.pressDown(existing: existing)
    clock.advance(by: 1)
    model.pressUp()
    await settle()
  }

  @Test func nothingTurnsTheMicrophoneOnExceptThePress() async {
    let m = model()
    await m.refresh()
    m.appWentToBackground()
    await m.confirmExplanation()
    m.dismissExplanation()
    m.pressUp()
    await m.downloadLanguage()
    await settle()
    #expect(input.listenCount == 0)
    #expect(m.state == .idle)
  }

  @Test func holdingListensAndWordsAppearAfterWhatWasThere() async {
    let m = model()
    await m.pressDown(existing: "Essay on")
    #expect(m.state == .listening)
    #expect(input.listenCount == 1)
    input.emit(.words("courage"))
    await settle()
    #expect(m.liveText == "Essay on courage")
    input.emit(.words("courage in the book"))
    await settle()
    #expect(m.liveText == "Essay on courage in the book")
    clock.advance(by: 2)
    m.pressUp()
    await settle()
    #expect(m.state == .idle)
    #expect(input.stopCount == 1)
    #expect(!input.isListening)
  }

  @Test func lastWordsDeliveredOnStopAreKept() async {
    let m = model()
    input.setFinalWords("all done")
    await hold(m)
    #expect(m.liveText == "all done")
  }

  @Test func releasedWithNothingSaidChangesNothing() async {
    let m = model()
    await hold(m, existing: "Keep this")
    #expect(m.liveText == nil)
    #expect(m.state == .idle)
  }

  @Test func aQuickTapKeepsListeningUntilTheNextPress() async {
    let m = model()
    await m.pressDown(existing: "")
    clock.advance(by: 0.1)
    m.pressUp()
    await settle()
    #expect(m.state == .listening)
    input.emit(.words("hello"))
    await settle()
    clock.advance(by: 5)
    await m.pressDown(existing: "")
    m.pressUp()
    await settle()
    #expect(m.state == .idle)
    #expect(m.liveText == "hello")
    #expect(input.listenCount == 1)
  }

  @Test func toggleStartsAndStops() async {
    let m = model()
    await m.toggle(existing: "")
    #expect(m.state == .listening)
    await m.toggle(existing: "")
    await settle()
    #expect(m.state == .idle)
  }

  @Test func firstTimeExplainsBeforeAskingAndDoesNotListen() async {
    let fake = FakeSpeechInput(availability: .needsPermission)
    let m = model(fake)
    await m.pressDown(existing: "")
    #expect(m.state == .explaining)
    #expect(fake.listenCount == 0)
    await m.confirmExplanation()
    #expect(m.state == .idle)
    #expect(fake.listenCount == 0)
    #expect(m.note == Words.micAfterAllowed)
    // The next press listens, and the explanation is not shown again.
    await hold(m)
    #expect(fake.listenCount == 1)
    let again = DictationModel(input: fake, store: store, clock: clock, limit: 200)
    #expect(store.load(VoiceFlags.self).value?.micExplained == true)
    fake.set(.needsPermission)
    await again.pressDown(existing: "")
    #expect(again.state != .explaining)
  }

  @Test func permissionRefusedGivesDeniedAndTypingStillWorks() async {
    let fake = FakeSpeechInput(availability: .needsPermission, grantsPermission: false)
    let m = model(fake)
    await m.pressDown(existing: "")
    await m.confirmExplanation()
    #expect(m.state == .denied)
    #expect(fake.listenCount == 0)
    #expect(m.isOffered)
  }

  @Test func permissionLaterTakenAwayIsDeniedNotACrash() async {
    let m = model()
    await hold(m)
    #expect(input.listenCount == 1)
    input.set(.permissionDenied)
    await m.pressDown(existing: "")
    #expect(m.state == .denied)
    #expect(input.listenCount == 1)
  }

  @Test func unsupportedLanguageHidesTheButton() async {
    let fake = FakeSpeechInput(availability: .languageUnsupported)
    let m = model(fake)
    await m.refresh()
    #expect(m.state == .unsupported)
    #expect(!m.isOffered)
    #expect(fake.listenCount == 0)
  }

  @Test func filesNotDownloadedOffersDownloadAndNeverStartsByItself() async {
    let fake = FakeSpeechInput(availability: .modelNeedsDownload)
    let m = model(fake)
    await m.pressDown(existing: "")
    #expect(m.state == .needsDownload)
    await m.downloadLanguage()
    #expect(m.state == .idle)
    #expect(fake.listenCount == 0)
    await hold(m)
    #expect(fake.listenCount == 1)
  }

  @Test func downloadFailingGivesACalmLine() async {
    let fake = FakeSpeechInput(availability: .modelNeedsDownload, downloadWorks: false)
    let m = model(fake)
    await m.pressDown(existing: "")
    await m.downloadLanguage()
    #expect(m.state == .needsDownload)
    #expect(m.note == Words.micDownloadFailed)
  }

  @Test func aPhoneCallStopsListeningAndKeepsTheWords() async {
    let m = model()
    await m.pressDown(existing: "")
    input.emit(.words("half a sent"))
    await settle()
    input.emit(.interrupted)
    await settle()
    #expect(m.state == .idle)
    #expect(m.liveText == "half a sent")
    #expect(m.note == Words.micInterrupted)
    #expect(!input.isListening)
  }

  @Test func failureGivesACalmLine() async {
    let m = model()
    await m.pressDown(existing: "")
    input.emit(.failed)
    await settle()
    #expect(m.state == .idle)
    #expect(m.note == Words.micTrouble)
  }

  @Test func goingToTheBackgroundStopsListening() async {
    let m = model()
    await m.pressDown(existing: "")
    input.emit(.words("hi"))
    await settle()
    m.appWentToBackground()
    await settle()
    #expect(m.state == .idle)
    #expect(!input.isListening)
    #expect(m.liveText == "hi")
  }

  @Test func veryLongSpeechIsCutAndListeningStops() async {
    let m = model(limit: 30)
    await m.pressDown(existing: "")
    input.emit(.words(String(repeating: "word ", count: 50)))
    await settle()
    #expect((m.liveText ?? "").utf16.count <= 30)
    #expect(m.state == .idle)
    #expect(m.note == Words.micTooLong)
  }

  @Test func willListenRunsJustBeforeTheMicrophone() async {
    let m = model()
    var called = 0
    m.willListen = { called += 1 }
    await hold(m)
    #expect(called == 1)
  }

  @Test func noStateStoresAudio() throws {
    // The only thing this feature saves is whether the explanation was shown.
    let data = try JSONEncoder().encode(VoiceFlags(micExplained: true))
    let text = String(decoding: data, as: UTF8.self)
    #expect(text == "{\"micExplained\":true}")
  }

  @Test func theVoiceAndAICodeNeverWritesFilesOrOpensAConnection() throws {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent()
      .deletingLastPathComponent()
    var hits: [String] = []
    for folder in ["Sources/FocusKit/Voice", "Sources/FocusKit/AI"] {
      let walker = FileManager.default.enumerator(
        at: root.appendingPathComponent(folder), includingPropertiesForKeys: nil)
      while let file = walker?.nextObject() as? URL {
        guard file.pathExtension == "swift" else { continue }
        let text = try String(contentsOf: file, encoding: .utf8)
        for banned in [
          "AVAudioFile", "URLSession", "URLRequest", ".write(to", "FileManager", "createFile",
          "Data(contentsOf",
        ] where text.contains(banned) {
          hits.append("\(file.lastPathComponent): \(banned)")
        }
      }
    }
    #expect(hits.isEmpty, "\(hits)")
  }

  @Test func onlyTheDictationModelEverTurnsTheMicrophoneOn() throws {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    var callers: [String] = []
    for folder in ["FocusKit/Sources", "App"] {
      let walker = FileManager.default.enumerator(
        at: root.appendingPathComponent(folder), includingPropertiesForKeys: nil)
      while let file = walker?.nextObject() as? URL {
        guard file.pathExtension == "swift" else { continue }
        let text = try String(contentsOf: file, encoding: .utf8)
        if text.contains("input.listen()") || text.contains("speechInput.listen()") {
          callers.append(file.lastPathComponent)
        }
      }
    }
    #expect(callers == ["DictationModel.swift"])
  }
}
