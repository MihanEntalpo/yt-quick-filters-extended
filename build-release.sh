#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH." >&2
  exit 1
fi

MANIFEST_PATH="manifest.json"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "Error: $MANIFEST_PATH not found." >&2
  exit 1
fi

VERSION="$(sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$MANIFEST_PATH" | head -n 1)"

if [[ -z "$VERSION" ]]; then
  echo "Error: failed to read version from $MANIFEST_PATH." >&2
  exit 1
fi

echo "Building extension version $VERSION..."
npm run build

for path in manifest.json dist public icons; do
  if [[ ! -e "$path" ]]; then
    echo "Error: required path '$path' is missing." >&2
    exit 1
  fi
done

mkdir -p release

ZIP_PATH="release/yt-quick-filters-extended-$VERSION.zip"
rm -f "$ZIP_PATH"

echo "Packing $ZIP_PATH..."

if command -v zip >/dev/null 2>&1; then
  zip -r "$ZIP_PATH" manifest.json dist public icons >/dev/null
elif command -v python3 >/dev/null 2>&1; then
  python3 -m zipfile -c "$ZIP_PATH" manifest.json dist public icons
else
  echo "Error: neither 'zip' nor 'python3' is available for creating the archive." >&2
  exit 1
fi

echo "Release archive created:"
echo "  $ZIP_PATH"

echo "Archive contents:"
if command -v unzip >/dev/null 2>&1; then
  unzip -l "$ZIP_PATH"
elif command -v python3 >/dev/null 2>&1; then
  python3 -m zipfile -l "$ZIP_PATH"
else
  echo "Skipping archive listing: neither 'unzip' nor 'python3' is available."
fi
