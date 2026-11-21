#if os(iOS)
  import AVFAudio
  import Foundation

  /// Speaks with the phone's built-in voices (`AVSpeechSynthesizer`). The audio session category is
  /// `.ambient`, so the phone's silent switch silences it. Interruptions and headphones being
  /// taken out stop it. Declarations read in AVFAudio's AVSpeechSynthesis.h and AVAudioSession headers.
  @MainActor
  public final class AppleSpeechOutput: NSObject, SpeechOutput, AVSpeechSynthesizerDelegate {
    public var onStopped: (() -> Void)?

    private let synthesizer = AVSpeechSynthesizer()
    private var waiting = 0
    private var tokens: [NSObjectProtocol] = []

    public override init() {
      super.init()
      synthesizer.delegate = self
      let center = NotificationCenter.default
      tokens.append(
        center.addObserver(
          forName: AVAudioSession.interruptionNotification, object: nil, queue: .main
        ) { [weak self] _ in
          MainActor.assumeIsolated { self?.stop() }
        })
      tokens.append(
        center.addObserver(
          forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main
        ) { [weak self] note in
          let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt
          if raw == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue {
            MainActor.assumeIsolated { self?.stop() }
          }
        })
    }

    public func speak(_ text: String, voiceId: String?, rate: Double) {
      try? AVAudioSession.sharedInstance().setCategory(.ambient)
      let utterance = AVSpeechUtterance(string: text)
      if let voiceId, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
        utterance.voice = voice
      } else {
        utterance.voice = AVSpeechSynthesisVoice(
          language: AVSpeechSynthesisVoice.currentLanguageCode())
      }
      let lowest = Double(AVSpeechUtteranceMinimumSpeechRate)
      let highest = Double(AVSpeechUtteranceMaximumSpeechRate)
      utterance.rate = Float(lowest + (highest - lowest) * min(1, max(0, rate)))
      waiting += 1
      synthesizer.speak(utterance)
    }

    public func stop() {
      waiting = 0
      synthesizer.stopSpeaking(at: .immediate)
      onStopped?()
    }

    public func voices() -> [VoiceChoice] {
      let language = AVSpeechSynthesisVoice.currentLanguageCode().prefix(2)
      return AVSpeechSynthesisVoice.speechVoices()
        .filter { $0.language.hasPrefix(language) }
        .map { VoiceChoice(id: $0.identifier, name: $0.name) }
    }

    nonisolated public func speechSynthesizer(
      _ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance
    ) {
      Task { @MainActor in self.oneEnded() }
    }

    nonisolated public func speechSynthesizer(
      _ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance
    ) {
      Task { @MainActor in self.oneEnded() }
    }

    private func oneEnded() {
      waiting = max(0, waiting - 1)
      if waiting == 0 { onStopped?() }
    }
  }

  /// Wired, Bluetooth and USB headphones count. The phone's own speaker and AirPlay do not.
  @MainActor
  public final class AppleHeadphones: HeadphoneStatus {
    public var onChange: (() -> Void)?
    private var token: NSObjectProtocol?

    public init() {
      token = NotificationCenter.default.addObserver(
        forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main
      ) { [weak self] _ in
        MainActor.assumeIsolated { self?.onChange?() }
      }
    }

    public var isConnected: Bool {
      let kinds: Set<AVAudioSession.Port> = [
        .headphones, .bluetoothA2DP, .bluetoothLE, .bluetoothHFP, .usbAudio,
      ]
      return AVAudioSession.sharedInstance().currentRoute.outputs.contains {
        kinds.contains($0.portType)
      }
    }
  }
#endif
