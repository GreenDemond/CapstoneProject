import FocusKit
import Foundation

let content: Content
if CommandLine.arguments.count > 1 {
  content = try Content.load(from: URL(fileURLWithPath: CommandLine.arguments[1]))
} else {
  content = try Content.bundled()
}
let model = AppleLanguageModel()
print("availability:", model.availability, "context:", model.contextSize)
let coach = StepCoach(model: model, content: content)
let jobs: [(String, String)] = [
  ("Write a 500 word essay on whether school uniforms should be required", "Essay"),
  ("Read chapters 3 and 4 of The Great Gatsby and answer the study questions", "Reading"),
  ("Photosynthesis lab report: introduction, method, results, conclusion", "Project"),
]
for (text, kind) in jobs {
  print("\n== \(kind): \(text)")
  let outcome = await coach.suggest(assignment: text, kindLabel: kind, count: 5)
  switch outcome {
  case .steps(let steps): steps.forEach { print(" -", $0) }
  case .trustedAdult: print(" TRUSTED_ADULT")
  case .fallback(let why): print(" FALLBACK to the starter steps:", why)
  }
}
