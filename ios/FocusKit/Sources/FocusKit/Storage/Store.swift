import Foundation

/// A kind of saved data. Each kind lives in its own file, so a damaged or full chat file can
/// never stop steps from saving. Every file carries a version number.
public protocol Storable: Codable, Equatable, Sendable {
  /// The file name, for example `work.json`.
  static var fileName: String { get }
  /// The version this build writes and understands.
  static var version: Int { get }
  /// Cuts the data to the limits. Applied on every save and every load.
  func limited(by limits: Content.Limits) -> Self
}

extension Storable {
  public static var version: Int { 1 }
  public func limited(by limits: Content.Limits) -> Self { self }
}

public enum StoreError: Error, Equatable, Sendable {
  /// The data could not be written. Nothing saved before is lost.
  case writeFailed
  /// The data could not be turned into a file.
  case cannotEncode
}

/// Why saved data was set aside instead of read.
public enum SetAsideReason: String, Equatable, Sendable {
  /// The file was not valid data for this app.
  case damaged
  /// The file was written by a newer version of the app.
  case newerVersion = "newer-version"
}

public enum LoadOutcome<Value: Equatable & Sendable>: Equatable, Sendable {
  case found(Value)
  /// Nothing saved yet.
  case missing
  /// The file could not be used. It was moved to a backup once; the app starts fresh.
  case setAside(SetAsideReason)

  /// The saved value, or nil when the app should start fresh.
  public var value: Value? {
    if case .found(let value) = self { return value }
    return nil
  }
}

/// What gets written: the version, then the value.
struct Envelope<Value: Codable>: Codable {
  var version: Int
  var value: Value
}

private struct VersionOnly: Decodable {
  var version: Int
}

/// The one place the app saves and reads its data. Implementations only provide the four raw
/// operations; the rules (versions, damaged data, limits) are shared.
public protocol Store: Sendable {
  var limits: Content.Limits { get }
  func rawRead(_ name: String) -> Data?
  func rawWrite(_ name: String, _ data: Data) throws
  /// Moves a file to a backup name that is not taken yet. Returns whether it moved.
  func rawMoveAside(_ name: String, reason: SetAsideReason) -> Bool
  /// Removes everything the app has saved, backups included.
  func rawRemoveAll() throws
}

extension Store {
  public func load<Value: Storable>(_ type: Value.Type) -> LoadOutcome<Value> {
    guard let data = rawRead(Value.fileName) else { return .missing }
    guard let head = try? JSONDecoder.store.decode(VersionOnly.self, from: data) else {
      _ = rawMoveAside(Value.fileName, reason: .damaged)
      return .setAside(.damaged)
    }
    if head.version > Value.version {
      _ = rawMoveAside(Value.fileName, reason: .newerVersion)
      return .setAside(.newerVersion)
    }
    guard head.version >= 1,
      let envelope = try? JSONDecoder.store.decode(Envelope<Value>.self, from: data)
    else {
      _ = rawMoveAside(Value.fileName, reason: .damaged)
      return .setAside(.damaged)
    }
    return .found(envelope.value.limited(by: limits))
  }

  public func save<Value: Storable>(_ value: Value) throws {
    let envelope = Envelope(version: Value.version, value: value.limited(by: limits))
    let data: Data
    do {
      data = try JSONEncoder.store.encode(envelope)
    } catch {
      throw StoreError.cannotEncode
    }
    try rawWrite(Value.fileName, data)
  }

  /// "Delete everything on this iPhone".
  public func deleteAll() throws {
    try rawRemoveAll()
  }
}

extension JSONEncoder {
  static var store: JSONEncoder {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    encoder.outputFormatting = [.sortedKeys]
    return encoder
  }
}

extension JSONDecoder {
  static var store: JSONDecoder {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
  }
}

/// Picks a backup name that is not taken, such as `chats.damaged.json` or `chats.damaged.2.json`.
func backupName(for name: String, reason: SetAsideReason, isTaken: (String) -> Bool) -> String {
  let base = (name as NSString).deletingPathExtension
  var candidate = "\(base).\(reason.rawValue).json"
  var number = 2
  while isTaken(candidate) {
    candidate = "\(base).\(reason.rawValue).\(number).json"
    number += 1
  }
  return candidate
}
