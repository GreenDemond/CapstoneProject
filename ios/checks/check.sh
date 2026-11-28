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

echo "== 3. App compile check (generic iOS device, no signing) =="
cd "$ROOT" || exit 1
if [ ! -d App/FocusApp.xcodeproj ]; then
  echo "SKIPPED: App/FocusApp.xcodeproj does not exist yet"
  exit 3
fi
DD=$(mktemp -d /tmp/focusapp-dd.XXXXXX)
EXTRA=()
# Inside an OS sandbox (some agent tools) Swift cannot start its own sandbox for macros and
# SwiftPM cannot write its caches. These flags are only added there; Xcode on a normal Mac needs none.
if ! sandbox-exec -p '(version 1)(allow default)' /usr/bin/true >/dev/null 2>&1; then
  mkdir -p /tmp/focus-home
  EXTRA=(-clonedSourcePackagesDirPath "$DD/sp" -packageCachePath "$DD/pc"
    -IDEPackageSupportDisableManifestSandbox=1 -skipMacroValidation
    'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox')
  export HOME=/tmp/focus-home CFFIXED_USER_HOME=/tmp/focus-home
fi
xcodebuild build-for-testing -project App/FocusApp.xcodeproj -scheme FocusApp -sdk iphoneos \
  -destination 'generic/platform=iOS' -derivedDataPath "$DD" CODE_SIGNING_ALLOWED=NO \
  ${EXTRA[@]+"${EXTRA[@]}"} > /tmp/focusapp-xcodebuild.log 2>&1 \
  || { grep -E "error:" /tmp/focusapp-xcodebuild.log | sort -u | head -30; echo "FAILED: app compile check"; exit 1; }
echo "ran: xcodebuild build-for-testing (generic iOS device: app and UI tests compile)"

echo "== 4. UI tests =="
# The automatic run uses an iOS 26 simulator. The app also supports iOS 18 (OLD1); that suite is
# run by hand on an iOS 18.2 simulator (see PROGRESS.md).
# Prefer the iPhone 15 Pro Max (the simulator the suite is known to pass on). Another iPhone has
# crashed whole groups of UI tests with "signal kill". Set FOCUS_SIM to a simulator id to override.
PREFERRED=$(xcrun simctl list devices available 2>/dev/null | awk '
  /^-- .* --$/ { v = 0; if ($2 == "iOS") { split($3, a, "."); v = a[1] + 0 } ; next }
  v >= 26 && /iPhone 15 Pro Max/ { if (match($0, /\([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\)/)) { print substr($0, RSTART + 1, 36); exit } }')
DEST="${FOCUS_SIM:-$PREFERRED}"
if [ -z "$DEST" ]; then
DEST=$(xcrun simctl list devices available 2>/dev/null | awk '
  /^-- .* --$/ { v = 0; if ($2 == "iOS") { split($3, a, "."); v = a[1] + 0 } ; next }
  v >= 26 && /iPhone/ { if (match($0, /\([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\)/)) { print substr($0, RSTART + 1, 36); exit } }')
fi
if [ -n "$DEST" ]; then
  xcodebuild test -project App/FocusApp.xcodeproj -scheme FocusApp \
    -destination "id=$DEST" CODE_SIGNING_ALLOWED=NO > /tmp/focusapp-uitests.log 2>&1 \
    || { tail -n 30 /tmp/focusapp-uitests.log; echo "FAILED: UI tests"; exit 1; }
  echo "ran: UI tests on the simulator"
  echo "ALL CHECKS PASSED"
  exit 0
fi
echo "SKIPPED: no iOS simulator"
echo "Ran: swift-format lint, swift build, swift test, app compile check. Not run: UI tests."
exit 3
