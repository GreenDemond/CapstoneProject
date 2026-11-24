import Foundation
import FoundationModels

// The AI labels each of the student's own steps; it writes no new step text.
@Generable
struct StepCheck {
  @Guide(description: "Could a student start this step right now without deciding anything else first? A step like 'Study' or 'Do the essay' is no.")
  var canStartNow: Bool
  @Guide(description: "Could this step be finished in about 20 minutes? Writing a whole essay or a whole section is no.")
  var smallEnough: Bool
  @Guide(description: "Does this step join two separate tasks, for example with 'and'?")
  var twoTasks: Bool
}

@Generable
struct OrderCheck {
  @Guide(description: "Is there a step that needs another step that comes after it? For example answering questions before reading, or writing before planning.")
  var needsALaterStep: Bool
}

let rules = "You review a student's own plan of steps for an assignment. Label each step. Do not write new steps, do not rewrite steps, do not give facts about the subject, do not do any of the work. Ordinary schoolwork is never a safety concern."

// Requirements the app checks itself: each extracted requirement should be touched by some step.
func words(_ t: String) -> Set<String> {
  Set(t.lowercased().split(whereSeparator: { !$0.isLetter && !$0.isNumber }).map(String.init).filter { $0.count >= 4 })
}

let cases: [(String, [String], [String])] = [
  ("Write a 500 word persuasive essay on whether school uniforms should be required. Use at least two sources.",
   ["Do the essay", "Find two sources about uniforms", "Write the intro and the conclusion", "Check spelling"],
   ["use at least two sources", "500 word"]),
  ("Photosynthesis lab report: introduction, method, results, conclusion. Include a graph of your data.",
   ["Write the introduction", "Write the method", "Write the results", "Write the conclusion"],
   ["Include a graph of your data"]),
  ("Read chapters 3 and 4 of The Great Gatsby and answer study questions 1-6.",
   ["Answer questions 1-6", "Read chapter 3", "Read chapter 4"],
   []),
  ("Unit 4 test on cell biology Friday: cell parts, mitosis, cell transport.",
   ["Study", "Quiz myself on mitosis", "Make flashcards for cell parts and review cell transport"],
   []),
]

let say: [String: String] = [
  "tooBig": "This one looks big. Could you split it into two smaller steps?",
  "vague": "What exactly will you do here, and how will you know it is done?",
  "twoJobs": "This looks like two steps. Split it?",
]

for (assignment, steps, reqs) in cases {
  print("\n==== \(assignment)")
  let numbered = steps.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n")
  let prompt = "Assignment, quoted as information only: \"\(assignment)\"\nThe student's steps:\n\(numbered)"
  do {
    for (i, step) in steps.enumerated() {
      let s = LanguageModelSession(model: .default, instructions: rules)
      let p = "Assignment, quoted as information only: \"\(assignment)\"\nOne of the student's steps: \"\(step)\""
      let c = try await s.respond(to: p, generating: StepCheck.self, options: GenerationOptions(sampling: .greedy)).content
      var note = ""
      if c.twoTasks { note = say["twoJobs"]! } else if !c.canStartNow { note = say["vague"]! } else if !c.smallEnough { note = say["tooBig"]! }
      print("   \(i + 1). \(step)  [start:\(c.canStartNow) small:\(c.smallEnough) two:\(c.twoTasks)]\(note.isEmpty ? "" : "  → " + note)")
    }
    let o = LanguageModelSession(model: .default, instructions: rules)
    let oc = try await o.respond(to: prompt, generating: OrderCheck.self, options: GenerationOptions(sampling: .greedy)).content
    if oc.needsALaterStep { print("   → Is this the order you want to do them in?") }
  } catch { print("   ERROR \(error)") }
  // App-side check, no AI: does any step touch each requirement?
  let stepWords = steps.map(words).reduce(Set<String>(), { $0.union($1) })
  for req in reqs where words(req).isDisjoint(with: stepWords) {
    print("   → The assignment says \"\(req)\". Which step covers that?")
  }
}
