#if os(iOS)
  import AVFAudio
  import Foundation
  import Speech

  /// Speech to text on the phone, with `SpeechAnalyzer` and `SpeechTranscriber`
  /// (declarations verified in the SDK's Speech.swiftinterface; see design/slices/T09-voice-in.md).
  /// The microphone is on only between `listen()` and the end of its stream. Audio goes from the
  /// microphone to the analyzer in memory. It is never written to a file and never sent anywhere.
  /// On-device dictation exists only from iOS 26. Below that the microphone is not offered.
  @available(iOS 26.0, macOS 26.0, *)
  public final class AppleSpeechInput: SpeechInput, @unchecked Sendable {
    private let locale: Locale
    private let lock = NSLock()
    private var stopper: AsyncStream<Void>.Continuation?

    public init(locale: Locale = .current) {
      self.locale = locale
    }

    public func availability() async -> SpeechAvailability {
      guard SpeechTranscriber.isAvailable else { return .unavailable }
      guard let supported = await SpeechTranscriber.supportedLocale(equivalentTo: locale) else {
        return .languageUnsupported
      }
      switch AVAudioApplication.shared.recordPermission {
      case .undetermined: return .needsPermission
      case .denied: return .permissionDenied
      case .granted: break
      @unknown default: return .unavailable
      }
      let transcriber = SpeechTranscriber(locale: supported, preset: .progressiveTranscription)
      switch await AssetInventory.status(forModules: [transcriber]) {
      case .installed: return .ready
      case .supported, .downloading: return .modelNeedsDownload
      case .unsupported: return .languageUnsupported
      @unknown default: return .unavailable
      }
    }

    public func requestPermission() async -> Bool {
      await AVAudioApplication.requestRecordPermission()
    }

    public func downloadLanguage() async -> Bool {
      guard let supported = await SpeechTranscriber.supportedLocale(equivalentTo: locale) else {
        return false
      }
      let transcriber = SpeechTranscriber(locale: supported, preset: .progressiveTranscription)
      do {
        if let request = try await AssetInventory.assetInstallationRequest(supporting: [
          transcriber
        ]) {
          try await request.downloadAndInstall()
        }
        return await AssetInventory.status(forModules: [transcriber]) == .installed
      } catch {
        return false
      }
    }

    public func listen() -> AsyncStream<SpeechInputEvent> {
      let (events, continuation) = AsyncStream.makeStream(of: SpeechInputEvent.self)
      let (stops, stopper) = AsyncStream.makeStream(of: Void.self)
      lock.withLock { self.stopper = stopper }
      let task = Task { [locale] in
        await Self.run(locale: locale, events: continuation, stops: stops)
        continuation.finish()
      }
      continuation.onTermination = { _ in task.cancel() }
      return events
    }

    public func stopListening() async {
      let target = lock.withLock { () -> AsyncStream<Void>.Continuation? in
        let value = stopper
        stopper = nil
        return value
      }
      target?.yield()
      target?.finish()
    }

    // MARK: The run

    private static func run(
      locale: Locale, events: AsyncStream<SpeechInputEvent>.Continuation,
      stops: AsyncStream<Void>
    ) async {
      guard let supported = await SpeechTranscriber.supportedLocale(equivalentTo: locale) else {
        events.yield(.failed)
        return
      }
      let transcriber = SpeechTranscriber(locale: supported, preset: .progressiveTranscription)
      let analyzer = SpeechAnalyzer(modules: [transcriber])
      let engine = AVAudioEngine()
      let session = AVAudioSession.sharedInstance()
      let interruption = Interruption(events: events)
      do {
        try session.setCategory(.record, mode: .measurement, options: [])
        try session.setActive(true)
        let micFormat = engine.inputNode.outputFormat(forBus: 0)
        guard
          let format = await SpeechAnalyzer.bestAvailableAudioFormat(
            compatibleWith: [transcriber], considering: micFormat)
        else {
          events.yield(.failed)
          return
        }
        let (input, builder) = AsyncStream.makeStream(of: AnalyzerInput.self)
        let pump = Pump(from: micFormat, to: format, into: builder)
        engine.inputNode.installTap(onBus: 0, bufferSize: 4096, format: micFormat) { buffer, _ in
          pump.send(buffer)
        }
        engine.prepare()
        try engine.start()
        try await analyzer.start(inputSequence: input)

        let reader = Task {
          var settled = ""
          var latest = ""
          do {
            for try await result in transcriber.results {
              let text = String(result.text.characters)
              if result.isFinal {
                settled += (settled.isEmpty ? "" : " ") + text
                latest = ""
              } else {
                latest = text
              }
              events.yield(.words(settled + (latest.isEmpty ? "" : " ") + latest))
            }
          } catch {
            events.yield(.failed)
          }
        }

        // Wait for the stop signal. Cancelling the task (the reader went away) ends this wait too.
        for await _ in stops { break }

        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        builder.finish()
        if Task.isCancelled {
          await analyzer.cancelAndFinishNow()
        } else {
          try await analyzer.finalizeAndFinishThroughEndOfInput()
        }
        await reader.value
      } catch {
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        await analyzer.cancelAndFinishNow()
        events.yield(.failed)
      }
      interruption.stop()
      try? session.setActive(false, options: .notifyOthersOnDeactivation)
    }
  }

  /// Turns microphone buffers into what the analyzer wants, in memory.
  @available(iOS 26.0, macOS 26.0, *)
  private final class Pump: @unchecked Sendable {
    private let converter: AVAudioConverter?
    private let target: AVAudioFormat
    private let builder: AsyncStream<AnalyzerInput>.Continuation

    init(
      from source: AVAudioFormat, to target: AVAudioFormat,
      into builder: AsyncStream<AnalyzerInput>.Continuation
    ) {
      self.target = target
      self.builder = builder
      converter = source == target ? nil : AVAudioConverter(from: source, to: target)
    }

    func send(_ buffer: AVAudioPCMBuffer) {
      guard let converter else {
        builder.yield(AnalyzerInput(buffer: buffer))
        return
      }
      let ratio = target.sampleRate / buffer.format.sampleRate
      let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 16
      guard let out = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: capacity) else { return }
      var supplied = false
      var failure: NSError?
      converter.convert(to: out, error: &failure) { _, status in
        if supplied {
          status.pointee = .noDataNow
          return nil
        }
        supplied = true
        status.pointee = .haveData
        return buffer
      }
      if failure == nil, out.frameLength > 0 {
        builder.yield(AnalyzerInput(buffer: out))
      }
    }
  }

  /// A phone call or another app taking the audio ends listening.
  private final class Interruption: @unchecked Sendable {
    private var token: NSObjectProtocol?

    init(events: AsyncStream<SpeechInputEvent>.Continuation) {
      token = NotificationCenter.default.addObserver(
        forName: AVAudioSession.interruptionNotification, object: nil, queue: nil
      ) { note in
        let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
        if raw == AVAudioSession.InterruptionType.began.rawValue {
          events.yield(.interrupted)
        }
      }
    }

    func stop() {
      if let token { NotificationCenter.default.removeObserver(token) }
      token = nil
    }
  }
#endif
