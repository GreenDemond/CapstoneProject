import Foundation

public struct VoiceChoice: Equatable, Sendable, Identifiable {
  public let id: String
  public let name: String

  public init(id: String, name: String) {
    self.id = id
    self.name = name
  }
}

/// Speaks text aloud with one of the phone's built-in voices. Only `SpeakerModel` calls it.
@MainActor
public protocol SpeechOutput: AnyObject {
  /// Adds text to what is being said. Several calls are said one after another.
  func speak(_ text: String, voiceId: String?, rate: Double)
  /// Stops at once and forgets what was waiting.
  func stop()
  func voices() -> [VoiceChoice]
  /// Called when speaking ends for any reason: finished, stopped, or interrupted.
  var onStopped: (() -> Void)? { get set }
}

/// Whether headphones (wired, Bluetooth, USB) are connected. Not the phone's own speaker.
@MainActor
public protocol HeadphoneStatus: AnyObject {
  var isConnected: Bool { get }
  /// Called when headphones are plugged in or taken out.
  var onChange: (() -> Void)? { get set }
}

/// A phone that cannot speak. Used when nothing better is given.
@MainActor
public final class SilentSpeechOutput: SpeechOutput {
  public var onStopped: (() -> Void)?
  public init() {}
  public func speak(_ text: String, voiceId: String?, rate: Double) {}
  public func stop() {}
  public func voices() -> [VoiceChoice] { [] }
}

@MainActor
public final class NoHeadphones: HeadphoneStatus {
  public var onChange: (() -> Void)?
  public init() {}
  public var isConnected: Bool { false }
}

/// What kind of thing is about to be spoken.
public enum SpokenKind: Equatable, Sendable {
  /// A step or a question the student asked to hear ("Read this step").
  case step
  /// An AI reply or one of the app's own prompts, spoken by itself in We talk.
  case reply
  /// The trusted-adult line.
  case trustedAdult
}

/// The rules for when the app may make a sound. One place, so Quiet can never be bypassed.
public enum VoicePolicy {
  public enum Verdict: Equatable, Sendable {
    case speak
    /// Voice is off for this kind of thing. The text is still shown.
    case silent
    /// Voice is on, but the student wants headphones only and none are connected.
    case needsHeadphones
  }

  public static func verdict(
    mode: VoiceMode, headphonesOnly: Bool, headphonesConnected: Bool, kind: SpokenKind
  ) -> Verdict {
    switch mode {
    case .quiet:
      return .silent
    case .iTalk:
      if kind != .step { return .silent }
    case .weTalk:
      break
    }
    if kind == .trustedAdult && !headphonesConnected { return .silent }
    if headphonesOnly && !headphonesConnected { return .needsHeadphones }
    return .speak
  }
}

/// Cuts text that arrives in pieces into whole sentences, so a sentence is spoken only once it is
/// complete. A sentence ends at . ! ? or an ellipsis (with any closing quote or bracket) followed
/// by a space or a new line, or at a new line.
public struct SentenceSplitter: Sendable {
  private var buffer = ""

  public init() {}

  /// Adds a piece. Returns the sentences that became complete, in order.
  public mutating func add(_ piece: String) -> [String] {
    buffer += piece
    let result = Self.split(buffer)
    buffer = result.remainder
    return result.sentences
  }

  /// The text still waiting for its ending, when the reply is over.
  public mutating func finish() -> String? {
    let rest = Text.trimmed(buffer)
    buffer = ""
    return rest.isEmpty ? nil : rest
  }

  /// The complete sentences in `text`, and what is left after them.
  public static func split(_ text: String) -> (sentences: [String], remainder: String) {
    var sentences: [String] = []
    var start = text.startIndex
    var index = text.startIndex
    let closers: Set<Character> = ["\"", "'", ")", "]", "”", "’", "»"]
    func take(_ end: String.Index) {
      let sentence = Text.trimmed(String(text[start..<end]))
      if !sentence.isEmpty { sentences.append(sentence) }
    }
    while index < text.endIndex {
      let character = text[index]
      if character == "\n" {
        take(index)
        index = text.index(after: index)
        start = index
        continue
      }
      if ".!?…".contains(character) {
        var end = text.index(after: index)
        while end < text.endIndex, ".!?…".contains(text[end]) || closers.contains(text[end]) {
          end = text.index(after: end)
        }
        if end < text.endIndex, text[end].isWhitespace {
          take(end)
          start = end
        }
        index = end
        continue
      }
      index = text.index(after: index)
    }
    return (sentences, String(text[start...]))
  }
}
