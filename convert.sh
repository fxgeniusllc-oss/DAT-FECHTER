#!/bin/bash
set -e

echo "Converting TypeScript to JavaScript..."

# Remove TypeScript files
rm -f src/dex-data-fetcher.ts src/index.ts src/__tests__/dex-data-fetcher.test.ts tsconfig.json

# Remove old build artifacts
rm -rf dist/ node_modules/ package-lock.json

echo "Files removed. Creating JavaScript files..."
