import Foundation
import Observation

/// "My AI services" under Me, and the choice between them on Talk. The behaviour is here, not in
/// the views. A key is only ever passed to the `KeyStore`, under the account made from the service's
/// id; it is never kept in this model, saved in settings, or put in any text.
@MainActor
@Observable
public final class OwnAIModel {
  public enum CheckState: Equatable, Sendable {
    case idle
    case checking
    case done(ConnectionCheck)
  }

  public enum LookupState: Equatable, Sendable {
    case idle
    case looking
    case done(ModelLookup)
  }

  /// What happened when the student tapped Save on a service.
  public enum SaveResult: Equatable, Sendable {
    case saved(id: String)
    case disclosureFirst
    case labelNeeded
    case labelTaken
    case addressBad
    case httpNotUnderstood
    case limitReached
    case keyCouldNotSave
  }

  /// The disclosure line has been put on the screen. Adding and saving need this.
  public private(set) var disclosureShown = false
  /// The student ticked "I understand my key and messages are not encrypted". Saving an http://
  /// address needs it. Cleared when the typed address is not http, and when the editor closes.
  public private(set) var httpUnderstood = false
  /// Services that have a saved key (ids only, never keys).
  public private(set) var keyIds: Set<String> = []
  public private(set) var checks: [String: CheckState] = [:]
  /// A calm line about the last list action (a key that could not be saved or removed).
  public private(set) var note: String?
  /// The service the student has asked to remove and not yet confirmed.
  public private(set) var pendingRemove: String?
  /// The chosen service was removed or stopped being ready: Talk says so once.
  public private(set) var fellBack = false
  public private(set) var lookup: LookupState = .idle

  /// Set by the app.
  public var settings: () -> Settings = { Settings() }
  public var change: ((inout Settings) -> Void) -> Void = { _ in }
  /// Called when the choice of AI may have changed, so the app can switch models.
  public var onChoiceChanged: () -> Void = {}

  private let keys: any KeyStore
  private let transport: any HTTPTransport
  private var checkRun: [String: Int] = [:]
  private var lookupRun = 0

  public init(keys: any KeyStore, transport: any HTTPTransport) {
    self.keys = keys
    self.transport = transport
  }

  // MARK: The list

  public var services: [OwnAIService] { settings().ownAIServices }

  public func service(id: String) -> OwnAIService? { services.first { $0.id == id } }

  public var canAdd: Bool { disclosureShown && services.count < OwnAIService.maxServices }

  public var isFull: Bool { services.count >= OwnAIService.maxServices }

  public var disclosure: String { Words.ownAIDisclosure }

  public func noteDisclosureShown() { disclosureShown = true }

  public func hasKey(_ id: String) -> Bool { keyIds.contains(id) }

  /// Looks at the Keychain again for every listed service.
  public func refreshKeys() {
    keyIds = Set(services.filter { keys.hasKey(account: $0.keyAccount) }.map(\.id))
  }

  public func isReady(_ service: OwnAIService) -> Bool {
    service.config.url != nil && service.config.hasModelName && keyIds.contains(service.id)
  }

  /// A short line for the list: what the service still needs, or that it is ready.
  public func status(_ service: OwnAIService) -> String {
    if service.config.url == nil { return Words.ownAIStatusNeedsAddress }
    if !service.config.hasModelName { return Words.ownAIStatusNeedsModel }
    if !keyIds.contains(service.id) { return Words.ownAIStatusNeedsKey }
    return Words.ownAIStatusReady
  }

  // MARK: Add, edit, remove

  /// Adds a service (`id` nil) or changes one. The key is optional: left empty it changes nothing
  /// for a service that has one. If the address moves to another scheme, host or port the old key
  /// is removed, because it was given for the old address. An old address that does not parse
  /// counts as another address, so its key is removed too.
  @discardableResult
  public func save(
    id: String?, label: String, endpoint: String, modelId: String, key: String,
    thinking: ThinkingLevel
  ) -> SaveResult {
    guard disclosureShown else { return .disclosureFirst }
    let cleanLabel = Text.cut(Text.trimmed(label), to: OwnAIService.labelLimit)
    guard !cleanLabel.isEmpty else { return .labelNeeded }
    guard !services.contains(where: { $0.id != id && sameLabel($0.label, cleanLabel) }) else {
      return .labelTaken
    }
    guard let parsed = OwnAIConfig.parse(endpoint) else { return .addressBad }
    if parsed.scheme == "http", !httpUnderstood { return .httpNotUnderstood }
    let typedKey = Text.trimmed(key)
    let old = id.flatMap { service(id: $0) }
    if id == nil, isFull { return .limitReached }
    if id != nil, old == nil { return .limitReached }

    let target = old ?? OwnAIService(label: cleanLabel, endpoint: endpoint, modelId: modelId)
    let account = target.keyAccount
    if !typedKey.isEmpty {
      guard keys.save(typedKey, account: account) else {
        note = Words.ownAIKeyCouldNotSave
        return .keyCouldNotSave
      }
    } else if let old, keys.hasKey(account: account), !Self.sameOrigin(old.endpoint, endpoint) {
      guard keys.delete(account: account) else {
        note = Words.ownAIKeyCouldNotSave
        return .keyCouldNotSave
      }
      note = Words.ownAIKeyClearedForNewAddress
    }

    var updated = target
    updated.label = cleanLabel
    updated.endpoint = endpoint
    updated.modelId = modelId
    updated.thinking = thinking
    change {
      if let at = $0.ownAIServices.firstIndex(where: { $0.id == updated.id }) {
        $0.ownAIServices[at] = updated
      } else {
        $0.ownAIServices.append(updated)
      }
    }
    if !typedKey.isEmpty { note = nil }
    checks[updated.id] = .idle
    refreshKeys()
    settleChoice()
    onChoiceChanged()
    return .saved(id: updated.id)
  }

  /// A calm line when the typed address cannot be used. Nothing for an empty box.
  public func addressProblem(_ typed: String) -> String? {
    let text = Text.trimmed(typed)
    return text.isEmpty || OwnAIConfig.parse(text) != nil ? nil : Words.ownAIAddressBad
  }

  /// A calm line when the typed address is good but starts with http://.
  public func addressNote(_ typed: String) -> String? {
    guard let url = OwnAIConfig.parse(typed), url.scheme == "http" else { return nil }
    return Words.ownAIAddressHttp
  }

  /// Whether the typed address is http. The tick box is shown only then.
  public func needsHttpTick(_ typed: String) -> Bool {
    OwnAIConfig.parse(typed)?.scheme == "http"
  }

  public func setHttpUnderstood(_ on: Bool) { httpUnderstood = on }

  /// Called when the student changes the address. Any address that is not http clears the tick, so
  /// going back to http later needs the tick again.
  public func addressTyped(_ typed: String) {
    if !needsHttpTick(typed) { httpUnderstood = false }
  }

  /// Clears the look-up and the http tick when the editor opens or closes.
  public func resetEditor() {
    clearLookup()
    httpUnderstood = false
  }

  /// The line to show after a Save that did not save. Nothing for a save that worked.
  public func line(for result: SaveResult) -> String? {
    switch result {
    case .saved: return nil
    case .disclosureFirst: return Words.ownAIDisclosure
    case .labelNeeded: return Words.ownAILabelNeeded
    case .labelTaken: return Words.ownAILabelTaken
    case .addressBad: return Words.ownAIAddressBad
    case .httpNotUnderstood: return Words.ownAIHttpNeedsTick
    case .limitReached: return Words.ownAIFull
    case .keyCouldNotSave: return Words.ownAIKeyCouldNotSave
    }
  }

  /// Whether two addresses go to the same scheme, host and port.
  static func sameOrigin(_ first: String, _ second: String) -> Bool {
    guard let a = OwnAIConfig.parse(first), let b = OwnAIConfig.parse(second) else {
      return false
    }
    return a.scheme?.lowercased() == b.scheme?.lowercased()
      && a.host?.lowercased() == b.host?.lowercased() && a.port == b.port
  }

  private func sameLabel(_ first: String, _ second: String) -> Bool {
    first.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      == second.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  }

  /// Remove asks once: `askRemove`, then `confirmRemove`.
  public func askRemove(_ id: String) {
    guard service(id: id) != nil else { return }
    pendingRemove = id
  }

  public func cancelRemove() { pendingRemove = nil }

  /// Removes the service and its key. The key goes first: if it cannot be removed, nothing is.
  @discardableResult
  public func confirmRemove(_ id: String) -> Bool {
    guard pendingRemove == id, let gone = service(id: id) else { return false }
    pendingRemove = nil
    guard keys.delete(account: gone.keyAccount) else {
      note = Words.ownAIKeyCouldNotSave
      return false
    }
    note = nil
    let wasChosen = settings().chosenServiceId == id
    change {
      $0.ownAIServices.removeAll { $0.id == id }
      if $0.chosenServiceId == id { $0.chosenServiceId = nil }
    }
    checks[id] = nil
    if wasChosen { fellBack = true }
    refreshKeys()
    onChoiceChanged()
    return true
  }

  /// Removes one service's key and nothing else. A chosen service falls back to this iPhone.
  public func removeKey(_ id: String) {
    guard let target = service(id: id) else { return }
    guard keys.delete(account: target.keyAccount) else {
      note = Words.ownAIKeyCouldNotSave
      return
    }
    note = nil
    checks[id] = .idle
    refreshKeys()
    settleChoice()
    onChoiceChanged()
  }

  // MARK: Which one is in use

  /// The services that can be picked on Talk, in the order the student added them.
  public var readyServices: [OwnAIService] { services.filter { isReady($0) } }

  /// The id of the service in use, or nil for the AI on this iPhone.
  public var chosenId: String? {
    guard let id = settings().chosenServiceId, let found = service(id: id), isReady(found) else {
      return nil
    }
    return id
  }

  public var chosen: OwnAIService? { chosenId.flatMap { service(id: $0) } }

  public var isInUse: Bool { chosen != nil }

  /// The picker on Talk shows when at least one service is ready.
  public var showsPicker: Bool { !readyServices.isEmpty }

  /// A segmented control suits "On this iPhone" plus up to two services; more use a menu.
  public var usesSegments: Bool { readyServices.count <= 2 }

  /// A calm line, once, when the chosen service went away.
  public var fellBackLine: String? { fellBack ? Words.ownAIFellBack : nil }

  /// The visible choice on Talk: a ready service's id, or nil for the AI on this iPhone.
  public func use(_ id: String?) {
    if let id {
      guard let found = service(id: id), isReady(found) else { return }
    }
    fellBack = false
    change { $0.chosenServiceId = id }
    onChoiceChanged()
  }

  /// If the chosen service is no longer ready (removed key, changed address, key missing after a
  /// restore), go back to the phone's AI and remember to say so.
  func settleChoice() {
    guard let id = settings().chosenServiceId else { return }
    if let found = service(id: id), isReady(found) { return }
    fellBack = true
    change { $0.chosenServiceId = nil }
  }

  /// The model for the service in use, bound to that service's own key account. Nil if none.
  func makeModel() -> OpenAICompatibleModel? {
    guard let service = chosen else { return nil }
    return OpenAICompatibleModel(
      config: service.config, account: service.keyAccount, keys: keys, transport: transport)
  }

  // MARK: Check connection

  public func checkState(_ id: String) -> CheckState { checks[id] ?? .idle }

  public func canCheck(_ id: String) -> Bool {
    guard let found = service(id: id) else { return false }
    return isReady(found) && checkState(id) != .checking
  }

  public func checkConnection(_ id: String) async {
    guard canCheck(id), let found = service(id: id) else { return }
    let model = OpenAICompatibleModel(
      config: found.config, account: found.keyAccount, keys: keys, transport: transport)
    let mine = (checkRun[id] ?? 0) + 1
    checkRun[id] = mine
    checks[id] = .checking
    let result = await model.check()
    guard checkRun[id] == mine else { return }
    checks[id] = .done(result)
  }

  public func checkLine(_ id: String) -> String? {
    guard case .done(let result) = checkState(id) else { return nil }
    switch result {
    case .works: return Words.ownAICheckWorks
    case .keyNotAccepted: return Words.ownAIKeyNotAccepted
    case .busy: return Words.ownAIBusy
    case .problem: return Words.ownAICheckProblem
    }
  }

  // MARK: Look up models (optional)

  public var canLookUp: Bool { lookup != .looking }

  /// Look up models needs a good address in the box.
  /// Where to learn how to get a key, when the address belongs to a provider that has such a page.
  public func keyHelpURL(endpoint: String) -> URL? {
    OwnAIConfig(address: endpoint, modelName: "").keyHelpURL
  }

  public func canLookUp(endpoint: String) -> Bool {
    canLookUp && OwnAIConfig.parse(endpoint) != nil
  }

  /// Asks the typed address for its model names. `serviceId` is the service being edited, so its
  /// saved key can be used when no new key was typed. Typing a name always works instead.
  public func lookUpModels(endpoint: String, key: String, serviceId: String?) async {
    guard canLookUp else { return }
    guard let url = OwnAIConfig.parse(endpoint), url.scheme != nil else {
      lookup = .done(.noListAddress)
      return
    }
    lookupRun += 1
    let mine = lookupRun
    lookup = .looking
    // The saved key may only go to the host it was given for. A new host in the box gets only a
    // key typed now, or none.
    let account = serviceId.flatMap { service(id: $0) }
      .flatMap { Self.sameOrigin($0.endpoint, endpoint) ? $0.keyAccount : nil }
    let result = await ModelLister.lookUp(
      config: OwnAIConfig(address: endpoint, modelName: ""), typedKey: key, account: account,
      keys: keys, transport: transport)
    guard lookupRun == mine else { return }
    lookup = .done(result)
  }

  public func clearLookup() {
    lookupRun += 1
    lookup = .idle
  }

  public var modelNames: [String] {
    if case .done(.found(let names)) = lookup { return names }
    return []
  }

  public var lookupLine: String? {
    guard case .done(let result) = lookup else { return nil }
    switch result {
    case .found(let names): return Words.ownAIModelsFound(names.count)
    case .noListAddress: return Words.ownAIModelsNoAddress
    case .keyNotAccepted: return Words.ownAIKeyNotAccepted
    case .busy: return Words.ownAIBusy
    case .problem: return Words.ownAIModelsProblem
    }
  }

  // MARK: Build 5 and Delete everything

  /// Moves build 5's single key (the old account) into the "My service" entry made from build 5's
  /// settings, so nothing is lost. If there is a key and no service at all, a blank "My service"
  /// holds it. Runs only after the list has been saved, and again on later launches until it
  /// works. If no keyless "My service" is left, the old key stays where it is (Delete everything
  /// removes it) rather than going to a service at another address.
  func migrateLegacyKey() {
    defer { refreshKeys() }
    guard keys.hasKey(account: KeyAccount.legacy) else { return }
    var holder = services.first {
      $0.label == OwnAIService.migratedLabel && !keys.hasKey(account: $0.keyAccount)
    }
    if holder == nil && services.isEmpty {
      let blank = OwnAIService(label: OwnAIService.migratedLabel, endpoint: "", modelId: "")
      change { $0.ownAIServices = [blank] }
      holder = service(id: blank.id)
    }
    guard let holder, let key = keys.read(account: KeyAccount.legacy), !key.isEmpty,
      keys.save(key, account: holder.keyAccount)
    else { return }
    _ = keys.delete(account: KeyAccount.legacy)
  }

  /// Removes every key. False means one may still be there and nothing should be reported deleted.
  func eraseKeys() -> Bool { keys.deleteAll() }

  func reset() {
    keyIds = []
    checks = [:]
    note = nil
    pendingRemove = nil
    fellBack = false
    lookup = .idle
    disclosureShown = false
    httpUnderstood = false
    checkRun = [:]
    lookupRun += 1
  }
}
