#!/bin/bash
# The one check command (design/04 section 4.5).
# Exit 0: everything ran and passed. Exit 1: something failed.
# Exit 3: everything that could run passed, but the app part was SKIPPED (no iOS simulator).
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"

echo "== 1. swift-format lint =="
SOURCES=$(find FocusKit/Sources FocusKit/Tests App -name '*.swift' 2>/dev/null)
if [ -n "$SOURCES" ]; then
  # shellcheck disable=SC2086
  xcrun swift-format lint --strict --configuration .swift-format $SOURCES || { echo "FAILED: swift-format lint"; exit 1; }
fi
echo "ran: swift-format lint"

echo "== 2. FocusKit build and test =="
cd "$ROOT/FocusKit" || exit 1
swift build --disable-sandbox 2>&1 | grep -v '^warning: .*swiftpm' || true
[ "${PIPESTATUS[0]}" -eq 0 ] || { echo "FAILED: swift build"; exit 1; }
swift test --disable-sandbox 2>&1 | grep -v '^warning: .*swiftpm' | tail -n 15
[ "${PIPESTATUS[0]}" -eq 0 ] || { echo "FAILED: swift test"; exit 1; }
echo "ran: swift build, swift test"

echo "== 3. App build and UI tests =="
cd "$ROOT" || exit 1
if xcrun simctl list devices available 2>/dev/null | grep -q "iPhone"; then
  if [ ! -d App/FocusApp.xcodeproj ]; then
    echo "SKIPPED: App/FocusApp.xcodeproj does not exist yet"
    exit 3
  fi
  DEST=$(xcrun simctl list devices available | grep -m1 "iPhone" | sed -E 's/^ *(.*) \(([0-9A-F-]{36})\).*/\2/')
  xcodebuild build test -project App/FocusApp.xcodeproj -scheme FocusApp \
    -destination "id=$DEST" CODE_SIGNING_ALLOWED=NO > /tmp/focusapp-xcodebuild.log 2>&1 \
    || { tail -n 30 /tmp/focusapp-xcodebuild.log; echo "FAILED: xcodebuild"; exit 1; }
  echo "ran: xcodebuild build and test"
  echo "ALL CHECKS PASSED"
  exit 0
fi
echo "SKIPPED: no iOS simulator"
echo "Ran: swift-format lint, swift build, swift test. Not run: app build and UI tests."
exit 3
