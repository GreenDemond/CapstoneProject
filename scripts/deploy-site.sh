#!/bin/bash
# Copies the built site/ folder to the web server with rsync.
# Usage: scripts/deploy-site.sh user@host:/path/        (dry run, changes nothing)
#        scripts/deploy-site.sh user@host:/path/ --yes  (really copies and deletes)
# Example path: /var/www/localhost/htdocs/ben/CapstoneProject/
set -euo pipefail

if [ $# -lt 1 ] || [ $# -gt 2 ] || { [ $# -eq 2 ] && [ "$2" != "--yes" ]; }; then
  echo "Usage: $0 user@host:/path/ [--yes]" >&2
  exit 2
fi
DEST="$1"
case "$DEST" in *:*) ;; *) echo "The destination must look like user@host:/path/" >&2; exit 2;; esac
case "$DEST" in */) ;; *) DEST="$DEST/";; esac

cd "$(dirname "$0")/.."
command -v rsync >/dev/null || { echo "rsync is not installed." >&2; exit 1; }
node scripts/build-site.mjs

echo
echo "From: $(pwd)/site/"
echo "To:   $DEST"
echo "Files on the server that are not in site/ will be DELETED."
echo

if [ "${2:-}" = "--yes" ]; then
  rsync -av --delete site/ "$DEST"
  echo
  echo "Done. Now check that .git/config on the site answers 404."
else
  rsync -avn --delete site/ "$DEST"
  echo
  echo "That was a dry run. Nothing changed. Add --yes to do it for real."
fi
