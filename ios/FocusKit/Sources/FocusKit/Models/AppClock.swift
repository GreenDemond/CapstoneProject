import Foundation

/// Where the app gets "now". Tests use a fake so a gap of a day or a week can be simulated.
public protocol AppClock: Sendable {
  var now: Date { get }
}

public struct SystemClock: AppClock {
  public init() {}
  public var now: Date { Date() }
}

/// A clock that only moves when told to.
public final class FakeClock: AppClock, @unchecked Sendable {
  private let lock = NSLock()
  private var current: Date

  public init(_ start: Date = Date(timeIntervalSince1970: 1_800_000_000)) {
    current = start
  }

  public var now: Date {
    lock.lock()
    defer { lock.unlock() }
    return current
  }

  public func advance(by seconds: TimeInterval) {
    lock.lock()
    defer { lock.unlock() }
    current = current.addingTimeInterval(seconds)
  }
}
