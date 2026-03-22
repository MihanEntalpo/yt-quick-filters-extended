#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: zip is not installed or not in PATH." >&2
  exit 1
fi

MANIFEST_PATH="manifest.json"
INSTALL_GUIDE_PATH="release/INSTALL_UNPACKED.md"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "Error: $MANIFEST_PATH not found." >&2
  exit 1
fi

if [[ ! -f "$INSTALL_GUIDE_PATH" ]]; then
  echo "Error: $INSTALL_GUIDE_PATH not found." >&2
  exit 1
fi

VERSION="$(sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$MANIFEST_PATH" | head -n 1)"

if [[ -z "$VERSION" ]]; then
  echo "Error: failed to read version from $MANIFEST_PATH." >&2
  exit 1
fi

echo "Building share package for extension version $VERSION..."
npm run build

mkdir -p release

PACKAGE_DIR="release/yt-quick-filters-extended-unpacked-$VERSION"
ZIP_PATH="release/yt-quick-filters-extended-unpacked-$VERSION.zip"

find release -maxdepth 1 \( -type d -o -type f \) \
  \( -name 'yt-quick-filters-extended-unpacked-*' -o -name 'yt-quick-filters-extended-unpacked-*.zip' \) \
  -exec rm -rf {} +

mkdir -p "$PACKAGE_DIR"

cp -R manifest.json dist public icons "$PACKAGE_DIR"/
cp "$INSTALL_GUIDE_PATH" "$PACKAGE_DIR"/INSTALL_UNPACKED.md

echo "Packing $ZIP_PATH..."
(
  cd release
  zip -r "$(basename "$ZIP_PATH")" "$(basename "$PACKAGE_DIR")" >/dev/null
)

echo "Share folder created:"
echo "  $PACKAGE_DIR"

echo "Share archive created:"
echo "  $ZIP_PATH"

echo "Archive contents:"
unzip -l "$ZIP_PATH"
