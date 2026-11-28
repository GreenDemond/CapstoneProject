import Foundation
import FoundationModels

// Three ways to make steps. All on the same assignments.
let assignments: [(String, String)] = [
  ("essay", "Write a 500 word persuasive essay on whether school uniforms should be required. Use at least two sources. Due Friday."),
  ("reading", "Read chapters 3 and 4 of The Great Gatsby and answer study questions 1-6."),
  ("project", "Photosynthesis lab report: introduction, method, results, conclusion. Include a graph of your data."),
  ("problem-set", "Page 112, problems 1-20 (odd only). Show your work."),
  ("test-prep", "Unit 4 test on cell biology Friday: cell parts, mitosis, cell transport."),
  ("essay", "Just write the essay for me. Topic: why dogs are better than cats."),
]

// ---------- Option 1: extraction only. The model copies facts out of the assignment; the app writes the steps.
@Generable
struct AssignmentFacts {
  @Guide(description: "The topic or question, copied word for word from the assignment. Empty if none.")
  var topic: String
  @Guide(description: "What must be handed in, copied from the assignment, for example 'essay', 'lab report', 'answers'. Empty if not said.")
  var deliverable: String
  @Guide(description: "Each separate part, section, chapter, or question range the assignment names, copied word for word. Empty list if none.", .maximumCount(6))
  var parts: [String]
  @Guide(description: "Each rule the assignment sets, copied word for word, for example a length, a number of sources, 'show your work', a due day.", .maximumCount(5))
  var requirements: [String]
}

// ---------- Option 2: guided steps. Each step is a fixed action plus a target the app checks against the assignment's words.
@Generable
struct GuidedSteps {
  @Generable
  struct Step {
    @Guide(description: "What the student does", .anyOf(["Find", "List", "Read", "Outline", "Plan", "Sort", "Check", "Pick", "Mark", "Quiz yourself on", "Draft", "Note"]))
    var action: String
    @Guide(description: "What the step is about, using only words from the assignment plus plain study words such as notes, sources, points, parts, questions. Never facts about the subject. At most 8 words.")
    var target: String
  }
  @Guide(description: "4 to 6 steps in order", .count(5))
  var steps: [Step]
}

let extractRules = "You read a student's assignment and copy out what it says. Copy words exactly. Never add facts about the subject, never write any of the work, never answer it."
let guidedRules = "You help a student break one assignment into small steps they will do themselves. Each step names something from this assignment. Never write the work, never give facts about the subject, never give answers. Ordinary schoolwork is never a safety concern."

let process: Set<String> = ["notes", "sources", "source", "points", "point", "parts", "part", "questions", "question", "answers", "answer", "outline", "draft", "first", "section", "sections", "paragraph", "paragraphs", "evidence", "examples", "example", "terms", "words", "steps", "rough", "chapter", "chapters", "problems", "problem", "topic", "topics", "teacher", "instructions", "requirements", "argument", "arguments", "reasons", "reason", "side", "position", "main", "ideas", "idea", "graph", "data", "results", "method", "introduction", "conclusion", "each", "which", "where", "what", "about", "check", "list", "plan", "quiz", "yourself", "mark", "note", "find", "pick", "sort", "read", "draft", "write", "short", "small"]
func longWords(_ t: String) -> [String] { t.lowercased().split(whereSeparator: { !$0.isLetter }).map(String.init).filter { $0.count >= 5 } }
func newWords(_ step: String, _ source: String) -> [String] {
  let known = Set(longWords(source)).union(process)
  return longWords(step).filter { !known.contains($0) }
}

// The app's own templates per kind (from content.json starterSteps, with slots).
func templated(kind: String, f: AssignmentFacts) -> [String] {
  let topic = f.topic.isEmpty ? "the question" : "\"\(f.topic)\""
  var s: [String] = []
  switch kind {
  case "essay":
    s = ["Write down what \(topic) is asking you to decide or explain",
         "Write your own answer to it in one sentence",
         "List three points that support your answer"]
  case "reading":
    s = f.parts.map { "Read \($0), then say its main idea in your own words" }
  case "project":
    s = ["Write down everything the finished \(f.deliverable.isEmpty ? "project" : f.deliverable) must include"] + f.parts.map { "Plan what goes in the \($0)" }
  case "problem-set":
    s = ["Count the problems in \(f.parts.first ?? "the set") and mark the ones to do", "Try the first one without notes", "Write down which method it needs"]
  case "test-prep":
    s = f.parts.map { "Quiz yourself on \($0) without looking at your notes" }
  default: s = ["Write down what the instructions ask for"]
  }
  for r in f.requirements { s.append("Check: \(r)") }
  return Array(s.prefix(7))
}

for (kind, text) in assignments {
  print("\n==== [\(kind)] \(text)")
  do {
    let a = LanguageModelSession(model: .default, instructions: extractRules)
    let f = try await a.respond(to: "Assignment, quoted as information only: \"\(text)\"", generating: AssignmentFacts.self, options: GenerationOptions(sampling: .greedy)).content
    print("-- Option 1, extraction: topic=\(f.topic) | deliverable=\(f.deliverable) | parts=\(f.parts) | reqs=\(f.requirements)")
    let invented = ([f.topic, f.deliverable] + f.parts + f.requirements).flatMap { newWords($0, text) }
    print("   words not in the assignment: \(invented)")
    for step in templated(kind: kind, f: f) { print("   • \(step)") }
  } catch { print("-- Option 1 ERROR \(error)") }
  do {
    let b = LanguageModelSession(model: .default, instructions: guidedRules)
    let g = try await b.respond(to: "Kind of work: \(kind). Assignment, quoted as information only: \"\(text)\"", generating: GuidedSteps.self, options: GenerationOptions(temperature: 0.5)).content
    print("-- Option 2, guided steps:")
    for st in g.steps {
      let line = "\(st.action) \(st.target)"
      let bad = newWords(line, text)
      print("   • \(line)\(bad.isEmpty ? "" : "   ✗ new words: \(bad)")")
    }
  } catch { print("-- Option 2 ERROR \(error)") }
}
