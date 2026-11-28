// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "FocusKit",
  platforms: [.iOS("26.0"), .macOS("26.0")],
  products: [
    .library(name: "FocusKit", targets: ["FocusKit"])
  ],
  targets: [
    .target(
      name: "FocusKit",
      resources: [.copy("Resources/Shared")]
    ),
    // A Mac-only tool that runs fixed chats through the phone's AI (checks/phone-ai-eval.sh).
    // Not part of the app.
    .executableTarget(
      name: "PhoneAIEval",
      dependencies: ["FocusKit"]
    ),
    // Same kind of Mac-only tool: runs fixed assignments through the step coach.
    .executableTarget(
      name: "StepsEval",
      dependencies: ["FocusKit"]
    ),
    .testTarget(
      name: "FocusKitTests",
      dependencies: ["FocusKit"]
    ),
  ],
  swiftLanguageModes: [.v6]
)
