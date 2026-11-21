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
        .testTarget(
            name: "FocusKitTests",
            dependencies: ["FocusKit"]
        ),
    ],
    swiftLanguageModes: [.v6]
)
