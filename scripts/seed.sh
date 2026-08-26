#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🌱 Seeding AquaVision AI Demo Database..."
python3 database/seed/seed_demo.py
echo "✅ Database seeded successfully!"
