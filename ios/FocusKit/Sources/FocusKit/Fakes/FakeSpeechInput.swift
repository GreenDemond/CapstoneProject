import Foundation

/// Speech input that does what the test tells it. It can be refused, interrupted, or fail.
public final class FakeSpeechInput: SpeechInput, @unchecked Sendable {
  private let lock = NSLock()
  private var current: SpeechAvailability
  private var grants: Bool
  private var downloads: Bool
  private var continuation: AsyncStream<SpeechInputEvent>.Continuation?
  private var listens = 0
  private var stops = 0
  private var finalWords: String?

  public init(
    availability: SpeechAvailability = .ready, grantsPermission: Bool = true,
    downloadWorks: Bool = true
  ) {
    current = availability
    grants = grantsPermission
    downloads = downloadWorks
  }

  public func set(_ availability: SpeechAvailability) { lock.withLock { current = availability } }
  public func setGrants(_ value: Bool) { lock.withLock { grants = value } }
  /// Words the fake delivers when listening is stopped.
  public func setFinalWords(_ words: String?) { lock.withLock { finalWords = words } }

  /// How many times the microphone was turned on.
  public var listenCount: Int { lock.withLock { listens } }
  public var stopCount: Int { lock.withLock { stops } }
  public var isListening: Bool { lock.withLock { continuation != nil } }

  public func emit(_ event: SpeechInputEvent) {
    let target = lock.withLock { continuation }
    target?.yield(event)
  }

  public func end() {
    let target = lock.withLock { () -> AsyncStream<SpeechInputEvent>.Continuation? in
      let value = continuation
      continuation = nil
      return value
    }
    target?.finish()
  }

  public func availability() async -> SpeechAvailability { lock.withLock { current } }

  public func requestPermission() async -> Bool {
    lock.withLock {
      if grants {
        current = current == .needsPermission ? .ready : current
      } else {
        current = .permissionDenied
      }
      return grants
    }
  }

  public func downloadLanguage() async -> Bool {
    lock.withLock {
      if downloads, current == .modelNeedsDownload { current = .ready }
      return downloads
    }
  }

  public func listen() -> AsyncStream<SpeechInputEvent> {
    let (stream, made) = AsyncStream.makeStream(of: SpeechInputEvent.self)
    lock.withLock {
      listens += 1
      continuation = made
    }
    return stream
  }

  public func stopListening() async {
    let (target, words) = lock.withLock {
      () -> (AsyncStream<SpeechInputEvent>.Continuation?, String?) in
      stops += 1
      let value = continuation
      continuation = nil
      return (value, finalWords)
    }
    if let words { target?.yield(.words(words)) }
    target?.finish()
  }
}
