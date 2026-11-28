import Foundation

/// Speech output that remembers what it was asked to say. For tests.
@MainActor
public final class FakeSpeechOutput: SpeechOutput {
  public var onStopped: (() -> Void)?
  public private(set) var spoken: [String] = []
  public private(set) var stopCount = 0
  public var available: [VoiceChoice] = [VoiceChoice(id: "voice-1", name: "Calm")]
  public private(set) var lastVoiceId: String?
  public private(set) var lastRate: Double?

  public init() {}

  public func speak(_ text: String, voiceId: String?, rate: Double) {
    spoken.append(text)
    lastVoiceId = voiceId
    lastRate = rate
  }

  public func stop() { stopCount += 1 }
  public func voices() -> [VoiceChoice] { available }

  /// The fake finishes (or is interrupted by a call).
  public func finish() { onStopped?() }
}

@MainActor
public final class FakeHeadphones: HeadphoneStatus {
  public var onChange: (() -> Void)?
  public var isConnected: Bool

  public init(connected: Bool) {
    isConnected = connected
  }

  public func set(connected: Bool) {
    isConnected = connected
    onChange?()
  }
}
