#!/bin/bash
# Runs the fixed chats in checks/phone-ai-cases.json through the app's chat code and the phone's AI
# as it runs on this Mac. Needs macOS 26 or later with Apple Intelligence on. Not part of check.sh.
# Usage: checks/phone-ai-eval.sh <label> [content.json] [runs]
# Writes research/phone-ai-eval/runs/<date>-<label>.md. See design/slices/PHONE-AI-plan.md, P0.
set -u
cd "$(dirname "$0")/.." || exit 1
LABEL="${1:?give a label, for example baseline}"
CONTENT="${2:-}"
RUNS="${3:-1}"
OUT="research/phone-ai-eval/runs/$(date +%Y-%m-%d)-$LABEL.md"
ARGS=("$(pwd)/checks/phone-ai-cases.json" "$(pwd)/$OUT" --runs "$RUNS")
if [ -n "$CONTENT" ]; then ARGS+=(--content "$(cd "$(dirname "$CONTENT")" && pwd)/$(basename "$CONTENT")"); fi
(cd FocusKit && swift run -c release PhoneAIEval "${ARGS[@]}") || exit 1
echo "wrote $OUT"
