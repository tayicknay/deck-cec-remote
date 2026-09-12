#!/usr/bin/env bash
# Deploy over SSH, or install locally (wrapper around install.sh).
#
# Local:  ./scripts/install.sh
# Remote: DECK_HOST=deck@192.168.x.x ./scripts/deploy.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="cec-remote"

if [[ ! -f "$ROOT/dist/index.js" ]]; then
  echo "Build first: pnpm build" >&2
  exit 1
fi

if [[ -n "${DECK_HOST:-}" ]]; then
  DEST="${DECK_DEST:-~/homebrew/plugins/$NAME}"
  ssh "$DECK_HOST" "mkdir -p $DEST/dist"
  scp "$ROOT/plugin.json" "$ROOT/package.json" "$ROOT/main.py" "$ROOT/cec_backend.py" "$ROOT/cec_watch.py" \
    "$DECK_HOST:$DEST/"
  scp "$ROOT/dist/index.js" "$DECK_HOST:$DEST/dist/"
  ssh "$DECK_HOST" "rm -rf ~/homebrew/plugins/CecRemote ~/homebrew/plugins/cec_remote || true"
  ssh "$DECK_HOST" "sudo systemctl restart plugin_loader"
  echo "Deployed to $DECK_HOST:$DEST"
else
  exec "$ROOT/scripts/install.sh" "$@"
fi
