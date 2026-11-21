#if canImport(FoundationModels)
  import FoundationModels
  import Foundation

  /// The model that runs on the phone (`SystemLanguageModel.default`). It never uses Apple's cloud
  /// model: it is not referenced anywhere, and a test checks that.
  /// Declarations verified in the SDK's FoundationModels.swiftinterface; see design/slices/T11-phone-ai.md.
  public final class AppleLanguageModel: LanguageModel, @unchecked Sendable {
    public init() {}

    public var availability: ModelAvailability {
      switch SystemLanguageModel.default.availability {
      case .available:
        return .available
      case .unavailable(let reason):
        switch reason {
        case .deviceNotEligible: return .deviceNotEligible
        case .appleIntelligenceNotEnabled: return .notEnabled
        case .modelNotReady: return .notReady
        @unknown default: return .other
        }
      }
    }

    /// iOS 26.0 and later. Before iOS 26.4 the framework reports 4096.
    public var contextSize: Int { SystemLanguageModel.default.contextSize }

    /// Token counting exists from iOS 26.4. Earlier, nil, and the engine estimates from characters.
    public func tokenCount(of text: String) async -> Int? {
      if #available(iOS 26.4, macOS 26.4, *) {
        return try? await SystemLanguageModel.default.tokenCount(for: text)
      }
      return nil
    }

    public func stream(instructions: String, messages: [ChatMessage]) -> AsyncThrowingStream<
      String, any Error
    > {
      let prompt = messages.asPrompt
      return AsyncThrowingStream { continuation in
        let task = Task {
          do {
            let session = LanguageModelSession(
              model: SystemLanguageModel.default, instructions: instructions)
            for try await snapshot in session.streamResponse(to: prompt) {
              continuation.yield(snapshot.content)
            }
            continuation.finish()
          } catch {
            continuation.finish(throwing: Self.failure(from: error))
          }
        }
        continuation.onTermination = { _ in task.cancel() }
      }
    }

    /// Both forms of each error: the iOS 26 one and the iOS 27 one.
    static func failure(from error: any Error) -> any Error {
      if error is CancellationError { return error }
      if #available(iOS 27.0, macOS 27.0, *), let modern = error as? LanguageModelError {
        switch modern {
        case .contextSizeExceeded: return ModelFailure.contextFull
        case .guardrailViolation: return ModelFailure.guardrail
        case .refusal: return ModelFailure.refusal
        default: return ModelFailure.other
        }
      }
      if let old = error as? LanguageModelSession.GenerationError {
        switch old {
        case .exceededContextWindowSize: return ModelFailure.contextFull
        case .guardrailViolation: return ModelFailure.guardrail
        case .refusal: return ModelFailure.refusal
        case .assetsUnavailable: return ModelFailure.unavailable
        default: return ModelFailure.other
        }
      }
      return ModelFailure.other
    }
  }
#endif
