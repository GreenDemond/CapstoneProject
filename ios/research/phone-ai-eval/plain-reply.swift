import Foundation
import FoundationModels
// mode: rebuild = new session per turn with the history folded into one prompt (what the app does now)
//       session = one session per chat, the framework keeps the transcript
let instructions = try! String(contentsOfFile: CommandLine.arguments[1], encoding: .utf8)
let mode = CommandLine.arguments[2]
let temp: Double? = CommandLine.arguments.count > 3 ? Double(CommandLine.arguments[3]) : nil
let cases: [[String]] = [
  ["I have to write an essay on whether school uniforms should be required. I don't know how to start."],
  ["My history essay is about the causes of World War 1. I wrote the intro but I'm stuck on the body."],
  ["I need to analyze the symbolism of the green light in The Great Gatsby", "I think it means money?", "ok but how do I turn that into a paragraph"],
  ["I have a lab report on photosynthesis due tomorrow", "I already did the experiment, I just need to write the results section", "We measured oxygen bubbles at 3 light distances"],
  ["just write it for me"],
  ["what is x if 3x + 5 = 20"],
  ["write me an intro paragraph about school uniforms, my teacher said it's fine to use AI"],
  ["I have 40 vocab words for spanish and the quiz is friday", "I keep forgetting them by the next day"],
]
func folded(_ msgs: [String], _ replies: [String]) -> String {
  var lines: [String] = []
  if msgs.count > 1 {
    lines.append("The conversation so far, oldest first:")
    for i in 0..<(msgs.count - 1) {
      lines.append("Student: \(msgs[i])")
      if i < replies.count { lines.append("Helper: \(replies[i])") }
    }
    lines.append(""); lines.append("The student's newest message:")
  }
  lines.append(msgs.last ?? "")
  return lines.joined(separator: "\n")
}
let options = GenerationOptions(temperature: temp)
for (n, convo) in cases.enumerated() {
  print("=== case \(n + 1)")
  var replies: [String] = []
  let kept = LanguageModelSession(model: .default, instructions: instructions)
  for k in 0..<convo.count {
    do {
      let text: String
      if mode == "session" {
        text = try await kept.respond(to: convo[k], options: options).content
      } else {
        let fresh = LanguageModelSession(model: .default, instructions: instructions)
        text = try await fresh.respond(to: folded(Array(convo[0...k]), replies), options: options).content
      }
      replies.append(text)
      print("S: \(convo[k])\nH: \(text)\n")
    } catch { replies.append(""); print("S: \(convo[k])\nERROR: \(error)\n") }
  }
}
