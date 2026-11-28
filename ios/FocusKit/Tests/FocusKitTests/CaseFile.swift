import Foundation
import Testing

@testable import FocusKit

typealias JSONObject = [String: Any]

/// Loads one of the shared case files and runs every case in it.
/// Each failure names the file and the case number.
enum CaseFile {
  static func cases(_ name: String) throws -> [JSONObject] {
    let url = try #require(
      Bundle.module.url(
        forResource: name, withExtension: "json", subdirectory: "Shared/cases"),
      "cases/\(name).json is missing")
    let data = try Data(contentsOf: url)
    let root = try #require(try JSONSerialization.jsonObject(with: data) as? JSONObject)
    return try #require(root["cases"] as? [JSONObject])
  }

  static func run(_ name: String, _ body: (Int, JSONObject) throws -> Void) throws {
    let all = try cases(name)
    #expect(!all.isEmpty, "cases/\(name).json has no cases")
    for (index, one) in all.enumerated() {
      try body(index, one)
    }
  }
}

func expectCase<T: Equatable>(
  _ actual: T, _ expected: T, file name: String, index: Int
) {
  #expect(actual == expected, "cases/\(name).json, case \(index)")
}

func loadContent() throws -> Content {
  try Content.bundled()
}
