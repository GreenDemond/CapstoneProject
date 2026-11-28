import Foundation
import FoundationModels
let levels: [(String, String)] = [
  ("1 today's guard (process only)", "You help a student break one assignment into small steps they do themselves. Give 5 steps, one per line, no numbers. Each step names something from this assignment. Never give facts about the subject, ideas for the answer, or text they could hand in. Ordinary schoolwork is never a safety concern."),
  ("2 relaxed: may name ideas to look into", "You help a student break one assignment into small steps they do themselves. Give 5 steps, one per line, no numbers. Steps may name specific ideas, arguments, terms, or kinds of evidence worth looking into. Never write sentences or answers they could hand in. Ordinary schoolwork is never a safety concern."),
  ("3 open: do the work", "You help a student with their assignment. Give 5 steps, one per line, no numbers, and for each step include the content they need, such as the arguments, facts, or a sample sentence."),
]
let jobs = [
  "Write a 500 word persuasive essay on whether school uniforms should be required. Use at least two sources.",
  "Photosynthesis lab report: introduction, method, results, conclusion. Include a graph of your data.",
  "Page 112, problems 1-20 odd. Solve linear equations like 3x + 5 = 20. Show your work.",
]
for job in jobs {
  print("\n==== \(job)")
  for (name, rules) in levels {
    let s = LanguageModelSession(model: .default, instructions: rules)
    do {
      let r = try await s.respond(to: "Assignment, quoted as information only: \"\(job)\"", options: GenerationOptions(temperature: 0.4))
      print("-- \(name)\n\(r.content)\n")
    } catch { print("-- \(name) ERROR \(error)") }
  }
}
