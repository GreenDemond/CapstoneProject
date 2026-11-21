import Foundation
import Observation

/// "Use my own AI service" under Me, and the visible switch between the two AIs. The behaviour
/// is here, not in the views. The key is only ever passed to the `KeyStore`; it is never kept in
/// this model, saved in settings, or put in any text.
@MainActor
@Observable
public final class OwnAIModel {
  public enum CheckState: Equatable, Sendable {
    case idle
    case checking
    case done(ConnectionCheck)
  }

  public private(set) var hasKey: Bool
  public private(set) var checkState: CheckState = .idle
  public private(set) var keyNote: String?
  /// The disclosure line has been put on the screen. Switching on needs this.
  public private(set) var disclosureShown = false

  /// Set by the app.
  public var settings: () -> Settings = { Settings() }
  public var change: ((inout Settings) -> Void) -> Void = { _ in }
  /// Called when the choice of AI may have changed, so the app can switch models.
  public var onChoiceChanged: () -> Void = {}

  private let keys: any KeyStore
  private let transport: any HTTPTransport
  private var checkRun = 0

  public init(keys: any KeyStore, transport: any HTTPTransport) {
    self.keys = keys
    self.transport = transport
    self.hasKey = keys.hasKey
  }

  // MARK: What the student typed

  public var address: String { settings().ownAIEndpoint }
  public var modelName: String { settings().ownAIModelId }
  public var config: OwnAIConfig { OwnAIConfig(address: address, modelName: modelName) }

  public func setAddress(_ words: String) {
    change { $0.ownAIEndpoint = words }
    checkState = .idle
    settingsChanged()
  }

  public func setModelName(_ words: String) {
    change { $0.ownAIModelId = words }
    checkState = .idle
    settingsChanged()
  }

  /// A line when something was typed that cannot be used. Nothing for an empty box.
  public var addressProblem: String? {
    let typed = Text.trimmed(address)
    return typed.isEmpty || OwnAIConfig.parse(typed) != nil ? nil : Words.ownAIAddressBad
  }

  public var disclosure: String { Words.ownAIDisclosure(address: address) }

  public func noteDisclosureShown() { disclosureShown = true }

  // MARK: The key

  public var keyLine: String { hasKey ? Words.ownAIKeySaved : Words.ownAIKeyNone }

  /// Saves the key the student pasted. The caller clears its box either way.
  @discardableResult
  public func saveKey(_ pasted: String) -> Bool {
    let key = Text.trimmed(pasted)
    guard !key.isEmpty else { return false }
    guard keys.save(key) else {
      keyNote = Words.ownAIKeyCouldNotSave
      return false
    }
    keyNote = nil
    hasKey = keys.hasKey
    checkState = .idle
    settingsChanged()
    return true
  }

  public func removeKey() {
    guard keys.delete() else {
      keyNote = Words.ownAIKeyCouldNotSave
      return
    }
    keyNote = nil
    hasKey = false
    checkState = .idle
    // Without a key the service cannot be on.
    change {
      $0.ownAIOn = false
      $0.ownAIChosen = false
    }
    settingsChanged()
  }

  // MARK: On, off, and which one

  /// The service could be used: a good address, a model name, a key.
  public var isConfigured: Bool { config.url != nil && config.hasModelName && hasKey }

  public var canSwitchOn: Bool { disclosureShown && isConfigured }

  public var isOn: Bool { settings().ownAIOn }

  /// On, and ready: the Talk screen then shows the visible switch between the two AIs.
  public var isReady: Bool { isOn && isConfigured }

  /// The student's own service is the one in use right now.
  public var isInUse: Bool { isReady && settings().ownAIChosen }

  /// Turning on needs the disclosure to have been shown and everything filled in. Turning on also
  /// makes it the AI in use; the switch on Talk changes that.
  @discardableResult
  public func setOn(_ on: Bool) -> Bool {
    if on {
      guard canSwitchOn else { return false }
      change {
        $0.ownAIOn = true
        $0.ownAIChosen = true
      }
    } else {
      change {
        $0.ownAIOn = false
        $0.ownAIChosen = false
      }
    }
    settingsChanged()
    return true
  }

  /// The visible switch: true for the student's own service, false for the AI on this iPhone.
  public func use(own: Bool) {
    guard isReady else { return }
    change { $0.ownAIChosen = own }
    settingsChanged()
  }

  /// The model for the student's own service, or nil if it is not usable.
  func makeModel() -> OpenAICompatibleModel? {
    guard isConfigured else { return nil }
    return OpenAICompatibleModel(config: config, keys: keys, transport: transport)
  }

  // MARK: Check connection

  public var canCheck: Bool { isConfigured && checkState != .checking }

  public func checkConnection() async {
    guard canCheck, let model = makeModel() else { return }
    checkRun += 1
    let mine = checkRun
    checkState = .checking
    let result = await model.check()
    guard checkRun == mine else { return }
    checkState = .done(result)
  }

  public var checkLine: String? {
    guard case .done(let result) = checkState else { return nil }
    switch result {
    case .works: return Words.ownAICheckWorks
    case .keyNotAccepted: return Words.ownAIKeyNotAccepted
    case .busy: return Words.ownAIBusy
    case .problem: return Words.ownAICheckProblem
    }
  }

  // MARK: After Delete everything

  /// Removes the key. False means it is still there and nothing should be reported as deleted.
  func eraseKey() -> Bool { keys.delete() }

  func reset() {
    hasKey = keys.hasKey
    checkState = .idle
    keyNote = nil
    disclosureShown = false
    checkRun += 1
  }

  private func settingsChanged() { onChoiceChanged() }
}
