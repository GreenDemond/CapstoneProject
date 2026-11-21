import Foundation

/// The model the chat and the step coach talk to. It forwards to whichever model is chosen now:
/// the phone's own by default, or the student's own service when that is switched on. Every reply
/// from either goes through the same checks, because they sit in `ChatEngine` and `StepCoach`.
public final class SwitchableLanguageModel: LanguageModel, @unchecked Sendable {
  private let lock = NSLock()
  private var current: any LanguageModel

  public init(_ model: any LanguageModel) {
    current = model
  }

  public func use(_ model: any LanguageModel) { lock.withLock { current = model } }

  private var model: any LanguageModel { lock.withLock { current } }

  public var availability: ModelAvailability { model.availability }
  public var contextSize: Int { model.contextSize }
  public func tokenCount(of text: String) async -> Int? { await model.tokenCount(of: text) }

  public func stream(instructions: String, messages: [ChatMessage]) -> AsyncThrowingStream<
    String, any Error
  > {
    model.stream(instructions: instructions, messages: messages)
  }
}
