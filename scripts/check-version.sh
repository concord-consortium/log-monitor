#!/bin/bash
# Verify that the version in src/index.ts matches package.json

PKG_VERSION=$(node -p "require('./package.json').version")
SRC_VERSION=$(grep -oP 'export const version = "\K[^"]+' src/index.ts)

if [ "$PKG_VERSION" != "$SRC_VERSION" ]; then
  echo "Version mismatch:"
  echo ""
  echo "  package.json:  $PKG_VERSION"
  echo "  src/index.ts:  $SRC_VERSION"
  echo ""
  echo "Please update both files to the same version before publishing."
  echo ""
  exit 1
fi

echo "Version check passed: $PKG_VERSION"
