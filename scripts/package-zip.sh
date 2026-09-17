#!/usr/bin/env bash
# Stage the Decky folder and zip it:
#   cec-remote/{plugin.json,package.json,main.py,cec_backend.py,cec_watch.py,dist/index.js}
#
# CI uploads .pack/ (not this zip) so the Actions artifact download is already
# the Decky zip — GitHub wraps artifacts, so uploading a .zip becomes zip-in-zip.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="cec-remote"
OUT="${1:-$ROOT/$NAME.zip}"
PACK="${PACK_DIR:-$ROOT/.pack}"
STAGE="$PACK/$NAME"

[[ -f "$ROOT/dist/index.js" ]] || {
  echo "Build first: pnpm i && pnpm build" >&2
  exit 1
}

rm -rf "$STAGE"
mkdir -p "$STAGE/dist"
cp -f "$ROOT/plugin.json" "$ROOT/package.json" "$ROOT/main.py" "$ROOT/cec_backend.py" "$ROOT/cec_watch.py" "$STAGE/"
cp -f "$ROOT/dist/index.js" "$STAGE/dist/"

rm -f "$OUT"
if command -v zip >/dev/null 2>&1; then
  (cd "$PACK" && zip -r "$OUT" "$NAME")
elif command -v python3 >/dev/null 2>&1; then
  python3 - <<PY
import zipfile, os
root = "$PACK"
name = "$NAME"
out = "$OUT"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, files in os.walk(os.path.join(root, name)):
        for f in files:
            p = os.path.join(dirpath, f)
            z.write(p, os.path.relpath(p, root))
print("wrote", out)
PY
else
  echo "need zip or python3" >&2
  exit 1
fi

echo "Created $OUT"
echo "Decky → gear → Developer → Install from ZIP → select this file"
