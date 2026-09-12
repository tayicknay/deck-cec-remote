#!/usr/bin/env bash
# Install or upgrade the CEC Remote Decky plugin on a Steam Deck.
#
# Usage:
#   ./scripts/install.sh                 # use files in this repo + restart
#   ./scripts/install.sh --download      # fetch latest ZIP from GitHub Actions/Release first
#   ./scripts/install.sh --no-restart
#   DECKY_HOME=/home/deck/homebrew ./scripts/install.sh
#
# Run as the normal Deck user (usually "deck"), NOT with sudo.
# Needs Decky Loader. Local install uses committed dist/index.js unless --download.
#
# Plugin folder:
#   <DECKY_HOME>/plugins/cec-remote/{plugin.json,package.json,main.py,cec_backend.py,cec_watch.py,dist/index.js}
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR_NAME="cec-remote"
REPO="${CEC_REMOTE_REPO:-tayicknay/deck-cec-remote}"
RESTART=1
DOWNLOAD=0

for arg in "$@"; do
  case "$arg" in
    --no-restart) RESTART=0 ;;
    --download|-d) DOWNLOAD=1 ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "unknown arg: $arg" >&2
      exit 1
      ;;
  esac
done

die() { echo "error: $*" >&2; exit 1; }

download_zip() {
  command -v gh >/dev/null 2>&1 || die "'gh' required for --download (and must be logged into GitHub)"
  local cache="${XDG_CACHE_HOME:-$HOME/.cache}/deck-cec-remote"
  mkdir -p "$cache"
  local zip="$cache/cec-remote.zip"
  local tmp
  tmp="$(mktemp -d)"

  echo "Fetching cec-remote.zip from $REPO…"
  if gh release download --repo "$REPO" -p "cec-remote.zip" -D "$tmp" 2>/dev/null; then
    echo "Downloaded from latest GitHub Release"
  else
    local run_id
    run_id="$(
      gh run list --repo "$REPO" --workflow "plugin.yml" --branch main \
        --json databaseId,conclusion,status \
        --jq '[.[] | select(.conclusion=="success" and .status=="completed")][0].databaseId' \
        2>/dev/null || true
    )"
    [[ -n "$run_id" && "$run_id" != "null" ]] || die "no successful Plugin ZIP CI run / release for $REPO"
    gh run download "$run_id" --repo "$REPO" -n "cec-remote-zip" -D "$tmp"
    echo "Downloaded from Actions run $run_id"
  fi

  local found
  found="$(find "$tmp" -name 'cec-remote.zip' -type f | head -n1 || true)"
  [[ -n "$found" ]] || die "no cec-remote.zip in download"
  cp -f "$found" "$zip"

  rm -rf "$cache/unpack"
  mkdir -p "$cache/unpack"
  if command -v unzip >/dev/null 2>&1; then
    unzip -qo "$zip" -d "$cache/unpack"
  else
    python3 -c "import zipfile; zipfile.ZipFile('$zip').extractall('$cache/unpack')"
  fi
  rm -rf "$tmp"

  ROOT="$cache/unpack/$PLUGIN_DIR_NAME"
  [[ -f "$ROOT/main.py" && -f "$ROOT/dist/index.js" ]] || die "ZIP layout unexpected (want $PLUGIN_DIR_NAME/...)"
}

resolve_decky_home() {
  if [[ -n "${DECKY_HOME:-}" && -d "${DECKY_HOME}" ]]; then
    printf '%s\n' "$DECKY_HOME"
    return 0
  fi
  if [[ -n "${DEST:-}" ]]; then
    local d
    d="$(dirname "$(dirname "$DEST")")"
    if [[ -d "$d/plugins" || -d "$d" ]]; then
      printf '%s\n' "$d"
      return 0
    fi
  fi

  local candidates=()
  if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
    local sh
    sh="$(getent passwd "$SUDO_USER" | cut -d: -f6 || true)"
    [[ -n "$sh" ]] && candidates+=("$sh/homebrew")
  fi
  if [[ "$(id -u)" -ne 0 ]]; then
    candidates+=("${HOME}/homebrew")
  fi
  candidates+=(
    "/home/deck/homebrew"
    "/home/${USER:-deck}/homebrew"
  )

  if command -v systemctl >/dev/null 2>&1; then
    local envline
    envline="$(systemctl show-environment 2>/dev/null | grep -E '^DECKY_HOME=' || true)"
    if [[ -n "$envline" ]]; then
      candidates+=("${envline#DECKY_HOME=}")
    fi
    envline="$(systemctl show plugin_loader -p Environment 2>/dev/null || true)"
    if [[ "$envline" =~ DECKY_HOME=([^ ]+) ]]; then
      candidates+=("${BASH_REMATCH[1]}")
    fi
  fi

  local c
  for c in "${candidates[@]}"; do
    [[ -z "$c" ]] && continue
    if [[ -d "$c" ]]; then
      printf '%s\n' "$c"
      return 0
    fi
  done
  for c in "${candidates[@]}"; do
    [[ -z "$c" ]] && continue
    if [[ -d "$c/plugins" ]]; then
      printf '%s\n' "$c"
      return 0
    fi
  done
  return 1
}

if [[ "$DOWNLOAD" -eq 1 ]]; then
  download_zip
fi

[[ -f "$ROOT/plugin.json" ]] || die "missing $ROOT/plugin.json"
[[ -f "$ROOT/main.py" ]] || die "missing $ROOT/main.py"
[[ -f "$ROOT/cec_backend.py" ]] || die "missing $ROOT/cec_backend.py"
[[ -f "$ROOT/cec_watch.py" ]] || die "missing $ROOT/cec_watch.py"
[[ -f "$ROOT/dist/index.js" ]] || die "missing dist/index.js — run: pnpm i && pnpm build   (or: $0 --download)"

DECKY_ROOT=""
if ! DECKY_ROOT="$(resolve_decky_home)"; then
  echo "error: could not find Decky's homebrew directory." >&2
  echo >&2
  echo "Checked (none existed):" >&2
  echo "  DECKY_HOME=${DECKY_HOME:-<unset>}" >&2
  echo "  HOME=$HOME/homebrew" >&2
  echo "  /home/deck/homebrew" >&2
  if [[ -n "${SUDO_USER:-}" ]]; then
    echo "  (you appear to be under sudo as $SUDO_USER — try WITHOUT sudo)" >&2
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    echo "  You are root. Run as the deck user:" >&2
    echo "    sudo -u deck $0" >&2
    echo "  or:  ./scripts/install.sh   (no sudo)" >&2
  fi
  echo >&2
  echo "Override: DECKY_HOME=/path/to/homebrew $0" >&2
  exit 1
fi

DEST="${DEST:-$DECKY_ROOT/plugins/$PLUGIN_DIR_NAME}"
PLUGINS_DIR="$(dirname "$DEST")"

echo "Decky home: $DECKY_ROOT"
echo "Install to: $DEST"

for old in CecRemote cec_remote "CEC Remote"; do
  if [[ -d "$PLUGINS_DIR/$old" && "$PLUGINS_DIR/$old" != "$DEST" ]]; then
    echo "Removing old plugin folder: $PLUGINS_DIR/$old"
    rm -rf "$PLUGINS_DIR/$old"
  fi
done

mkdir -p "$DEST/dist"
cp -f "$ROOT/plugin.json" "$ROOT/package.json" "$ROOT/main.py" "$ROOT/cec_backend.py" "$ROOT/cec_watch.py" "$DEST/"
cp -f "$ROOT/dist/index.js" "$DEST/dist/"
echo "Installed CEC Remote → $DEST"

if [[ "$RESTART" -eq 1 ]]; then
  if command -v systemctl >/dev/null 2>&1; then
    echo "Restarting plugin_loader (sudo)…"
    if [[ "$(id -u)" -eq 0 ]]; then
      systemctl restart plugin_loader
    else
      sudo systemctl restart plugin_loader
    fi
    echo "Done. Gaming Mode → QAM → Decky → CEC Remote"
  else
    echo "systemctl not found — restart Decky / reboot manually"
  fi
else
  echo "Skipped restart. Run: sudo systemctl restart plugin_loader"
fi
