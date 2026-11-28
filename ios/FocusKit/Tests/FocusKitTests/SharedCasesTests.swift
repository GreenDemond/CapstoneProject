import Foundation
import Testing

@testable import FocusKit

@Suite struct SharedCasesTests {
  let content: Content

  init() throws {
    content = try loadContent()
  }

  @Test("cases/work.json") func work() throws {
    try CaseFile.run("work") { index, one in
      var work = try workFrom(try #require(one["start"] as? JSONObject))
      for move in try #require(one["moves"] as? [[Any]]) {
        let name = try #require(move.first as? String)
        let split = (move.count > 1 ? move[1] as? String : nil) ?? ""
        if let choice = Choice(rawValue: name) {
          work = work.applying(choice, splitText: split)
        }
      }
      let expected = try workFrom(try #require(one["result"] as? JSONObject))
      expectCase(work, expected, file: "work", index: index)
      expectCase(
        work.currentIndex ?? -1, try #require(one["currentIndex"] as? Int), file: "work",
        index: index)
      expectCase(work.doneCount, try #require(one["doneCount"] as? Int), file: "work", index: index)
      expectCase(work.allDone, try #require(one["allDone"] as? Bool), file: "work", index: index)
    }
  }

  @Test("cases/hints.json") func hints() throws {
    try CaseFile.run("hints") { index, one in
      let at = try #require(one["index"] as? Int)
      let expected = one["result"] as? String
      expectCase(Hints.hint(at: at, in: content), expected, file: "hints", index: index)
    }
  }

  @Test("cases/starter-steps.json") func starterSteps() throws {
    try CaseFile.run("starter-steps") { index, one in
      let kind = try #require(one["kind"] as? String)
      let pasted = try #require(one["pastedText"] as? String)
      let steps = StarterSteps.steps(for: kind, pastedText: pasted, in: content)
      expectCase(
        steps, try #require(one["result"] as? [String]), file: "starter-steps", index: index)
      expectCase(
        StarterSteps.withTwoMinuteStart(steps, in: content),
        try #require(one["withTwoMinuteStart"] as? [String]), file: "starter-steps", index: index)
    }
  }

  @Test("cases/clean-text.json") func cleanText() throws {
    try CaseFile.run("clean-text") { index, one in
      let input = one["input"] as? String
      expectCase(
        PastedText.clean(input), try #require(one["cleaned"] as? String), file: "clean-text",
        index: index)
      if let input {
        let limited = try #require(one["limited"] as? JSONObject)
        let result = PastedText.limit(input, to: content.limits.pasteLength)
        expectCase(
          result.text, try #require(limited["text"] as? String), file: "clean-text", index: index)
        expectCase(
          result.truncated, try #require(limited["truncated"] as? Bool), file: "clean-text",
          index: index)
      } else {
        // Not text: the web app returned nothing for the cut; here there is no cut to make.
        #expect(one["limited"] is NSNull, "cases/clean-text.json, case \(index)")
      }
    }
  }

  @Test("cases/pickup.json") func pickup() throws {
    let calendar = Calendar.current
    let format = DateFormatter()
    format.locale = Locale(identifier: "en_US_POSIX")
    format.timeZone = calendar.timeZone
    format.dateFormat = "EEE MMM dd yyyy HH:mm:ss"
    let now = try #require(format.date(from: "Fri Nov 20 2026 15:00:00"))
    try CaseFile.run("pickup") { index, one in
      let saved: Date? =
        (one["savedOnValid"] as? Bool) == true
        ? format.date(from: try #require(one["savedOnLocal"] as? String)) : nil
      if (one["savedOnValid"] as? Bool) == true { #expect(saved != nil) }
      let line = Pickup.line(savedOn: saved, now: now, calendar: calendar, in: content)
      expectCase(line, try #require(one["result"] as? String), file: "pickup", index: index)
    }
  }

  /// The guide cases do not say which kind, length or search setting they used. Read from the
  /// expected text: kind is always Essay; lengths and search follow this table by case number.
  @Test("cases/guide.json") func guide() throws {
    let settings: [(length: String, search: Bool)] = [
      ("short", false), ("medium", true), ("long", false),
      ("short", true), ("short", false), ("short", true),
    ]
    try CaseFile.run("guide") { index, one in
      let raw = try #require(one["guide"] as? String)
      expectCase(
        Guide.clean(raw), try #require(one["cleaned"] as? String), file: "guide", index: index)
      let setting = settings[index]
      let system = Guide.instructions(
        guide: raw, kind: "Essay", length: setting.length, search: setting.search, in: content)
      expectCase(system, try #require(one["system"] as? String), file: "guide", index: index)
    }
  }

  @Test("cases/sources.json") func sources() throws {
    try CaseFile.run("sources") { index, one in
      var list: [SourceCandidate] = []
      if let entries = one["list"] as? [Any] {
        list = entries.map { entry in
          let object = entry as? JSONObject
          return SourceCandidate(url: object?["url"] as? String, title: object?["title"] as? String)
        }
      }
      let result = Sources.clean(list, in: content).map { [$0.url, $0.title] }
      let expected = try #require(one["result"] as? [JSONObject]).map {
        [($0["url"] as? String) ?? "", ($0["title"] as? String) ?? ""]
      }
      expectCase(result, expected, file: "sources", index: index)
    }
  }

  @Test("cases/trim-history.json") func trimHistory() throws {
    try CaseFile.run("trim-history") { index, one in
      let messages = try messagesFrom(try #require(one["messages"] as? [JSONObject]))
      let limit = try #require(one["limit"] as? Int)
      let expected = try messagesFrom(try #require(one["result"] as? [JSONObject]))
      expectCase(History.trim(messages, limit: limit), expected, file: "trim-history", index: index)
    }
  }

  private func workFrom(_ object: JSONObject) throws -> Work {
    let steps = try #require(object["steps"] as? [JSONObject]).map { step in
      Step(
        id: step["id"] as? Int ?? -99, text: step["text"] as? String ?? "",
        done: step["done"] as? Bool ?? false)
    }
    return Work(steps: steps, nextId: try #require(object["nextId"] as? Int))
  }

  private func messagesFrom(_ list: [JSONObject]) throws -> [ChatMessage] {
    try list.map {
      ChatMessage(
        role: try #require(ChatRole(rawValue: $0["role"] as? String ?? "")),
        text: try #require($0["text"] as? String))
    }
  }
}
