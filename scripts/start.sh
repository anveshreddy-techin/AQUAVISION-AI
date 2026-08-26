#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🌊 Starting AquaVision AI..."

# Check Python and Node
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required"; exit 1; }

# Trap for clean shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down AquaVision AI services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start Backend API
echo "🚀 [1/2] Starting FastAPI Backend on http://localhost:8000..."
python3 -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!

# Start Frontend
echo "🚀 [2/2] Starting Next.js Web Dashboard on http://localhost:3000..."
cd "$PROJECT_ROOT/apps/web"
npm run dev &
WEB_PID=$!

echo ""
echo "======================================================="
echo "   🌊 AquaVision AI is up and running!"
echo "   ----------------------------------------------------"
echo "   Web Dashboard : http://localhost:3000"
echo "   Backend API   : http://localhost:8000"
echo "   Swagger Docs  : http://localhost:8000/docs"
echo "======================================================="
echo "Press Ctrl+C to stop all services."
echo ""

wait
