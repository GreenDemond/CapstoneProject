import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct StepTipsTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func app() -> AppModel {
    AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
  }

  @Test func theTipsShowAtFirst() {
    #expect(!Settings().stepTipsHidden)
    let fresh = app()
    #expect(!fresh.me.stepTipsHidden)
  }

  @Test func gotItHidesThemAndTheSwitchBringsThemBack() {
    let app = app()
    app.me.setStepTipsHidden(true)
    #expect(app.me.stepTipsHidden)
    app.me.setStepTipsHidden(false)
    #expect(!app.me.stepTipsHidden)
  }

  @Test func theChoiceSurvivesASaveAndLoad() {
    let first = app()
    first.me.setStepTipsHidden(true)
    #expect(store.load(Settings.self).value?.stepTipsHidden == true)
    let again = app()
    #expect(again.me.stepTipsHidden)
  }

  @Test func anOlderOrDamagedFileLoadsWithTheTipsShowing() {
    store.plant("settings.json", Data(#"{"version":1,"value":{"readAloud":false}}"#.utf8))
    #expect(store.load(Settings.self).value?.stepTipsHidden == false)
    store.plant(
      "settings.json", Data(#"{"version":1,"value":{"stepTipsHidden":"yes"}}"#.utf8))
    #expect(store.load(Settings.self).value?.stepTipsHidden == false)
    store.plant("settings.json", Data(#"{"version":1,"value":{"stepTipsHidden":7}}"#.utf8))
    #expect(store.load(Settings.self).value?.stepTipsHidden == false)
  }

  @Test func theCardWordsAreShortPlainAndNeverAnAnswer() {
    let lines = [
      Words.stepTipsTitle, Words.stepTipsDo, Words.stepTipsSmall, Words.stepTipsExample,
      Words.stepTipsGotIt, Words.meStepTips,
    ]
    for line in lines {
      #expect(line.count <= 70, Comment(rawValue: line))
      #expect(!line.contains("attention") && !line.contains("focus"))
    }
  }
}
