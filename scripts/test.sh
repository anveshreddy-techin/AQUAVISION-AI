#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🧪 Running AquaVision AI Test Suite..."

echo "1. Running Backend Pytest..."
python3 -m pytest tests/ -v

echo "2. Testing Frontend Build..."
cd "$PROJECT_ROOT/apps/web"
npm run build

echo "✅ All tests and builds passed successfully!"
