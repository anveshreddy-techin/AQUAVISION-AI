# AquaVision AI — SIH26057

## AI-Powered Underwater Marine Debris & Anomaly Detection Platform

> **"Turn large Side-Scan Sonar surveys into a trustworthy, prioritized human-review workflow."**

[![Python](https://img.shields.io/badge/Python-3.14-blue)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What This Is

AquaVision AI automatically screens large Side-Scan Sonar (SSS) surveys, identifies potential debris regions and anomalies, ranks them by inspection priority, and presents a focused review queue to marine scientists — turning a massive manual inspection task into targeted expert verification.

**Core workflow:**
```
Large SSS Survey → Automated Screening → Candidate Detection →
Anomaly Analysis → Priority Ranking → Human Review Queue →
Evidence → Map → Survey Report
```

---

## Honest Capability Statement

> ⚠️ **Read HONESTY.md before making any claims about this system.**

| Component | Status |
|-----------|--------|
| SSS survey ingestion pipeline | ✅ IMPLEMENTED |
| Image tiling + preprocessing | ✅ IMPLEMENTED |
| Detection (DEMO heuristic) | ⚗️ DEMO — contour-based, not trained ML |
| Anomaly analysis (DEMO heuristic) | ⚗️ DEMO — variance-based, not trained autoencoder |
| Candidate generation + dedup | ✅ IMPLEMENTED |
| Priority ranking engine | ✅ IMPLEMENTED |
| Human review workflow | ✅ IMPLEMENTED |
| PDF report generation | ✅ IMPLEMENTED |
| Trained SSS debris model | 🔴 BLOCKED — requires labeled SSS training data |

---

## Quick Start

### Prerequisites
- Python 3.14+
- Node.js 18+
- npm 9+

### 1. Clone and configure
```bash
git clone <repo-url>
cd aquavision-ai
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 2. Install Python dependencies
```bash
pip install --break-system-packages -r services/api/requirements.txt
```

### 3. Initialize database and seed demo data
```bash
python3 -m database.seed.seed_demo
```

### 4. Start the API server
```bash
python3 -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs: http://localhost:8000/docs

### 5. Install and start the frontend
```bash
cd apps/web
npm install
npm run dev
```
Frontend: http://localhost:3000

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aquavision.ai | AquaVision2026! |
| Researcher | researcher@aquavision.ai | Research2026! |

---

## Demo Flow (SIH Presentation)

1. Login as **Researcher**
2. Open **Dashboard** → See 50 frames screened, 15 candidates
3. Open **Surveys** → Click "Demo Survey - Bay Area Alpha"
4. Click **Review Queue** → See candidates sorted by priority (2 CRITICAL, 3 HIGH)
5. Click a CRITICAL candidate → See evidence layers + AI explanation + action buttons
6. **Accept** one candidate, **Reject** one, **Mark Uncertain** one
7. Open **Map** → See candidate locations color-coded by priority
8. Open **Analytics** → See real-time review completion stats
9. Click **Generate Report** → Download PDF report
10. Login as **Admin** → See **Audit Log** of all actions

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | System health |
| `/api/v1/auth/login` | POST | Get JWT token |
| `/api/v1/surveys` | GET/POST | List/create surveys |
| `/api/v1/surveys/{id}/upload` | POST | Upload sonar image |
| `/api/v1/surveys/{id}/process` | POST | Start AI processing |
| `/api/v1/review/queue` | GET | Priority-sorted review queue |
| `/api/v1/review/candidates/{id}/action` | POST | Accept/reject/correct |
| `/api/v1/analytics/overview` | GET | Dashboard KPIs |
| `/api/v1/maps/survey/{id}/candidates` | GET | GeoJSON candidate map |
| `/api/v1/reports/generate/{id}` | POST | Generate PDF report |

Full API docs: http://localhost:8000/docs

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AquaVision AI                      │
│                                                      │
│  Next.js Frontend (TypeScript + Tailwind)            │
│  ↕ REST API                                         │
│  FastAPI Backend (Python 3.14)                       │
│  ↕ SQLAlchemy ORM                                   │
│  SQLite Database (→ PostgreSQL in production)        │
│                                                      │
│  Processing Pipeline:                                │
│  Upload → Frame Registration → Tiling →              │
│  CLAHE Preprocessing → Detection → Anomaly →         │
│  Candidate Aggregation → IoU Dedup → Priority Rank   │
│  → Review Queue → Human Decision → Report            │
└─────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
aquavision-ai/
├── apps/web/          # Next.js frontend
├── services/api/      # FastAPI backend + processing engine
├── database/          # SQLAlchemy models + seed scripts
├── ml/                # ML pipeline (preprocessing, detection, anomaly)
├── storage/           # Survey imagery (originals preserved)
├── demo/              # Demo survey data
├── docs/sih/          # SIH documentation
├── tests/             # Test suite
├── HONESTY.md         # Honest capability statement (read this!)
└── README.md
```

---

## Troubleshooting

**API won't start:** Check that all pip packages are installed: `pip install --break-system-packages -r services/api/requirements.txt`

**Database error:** Delete `aquavision.db` and re-run seed: `rm aquavision.db && python3 -m database.seed.seed_demo`

**Frontend build error:** `cd apps/web && npm install && npm run build`

**Images not loading:** Ensure `storage/` directory exists and API is running (images served from `/storage/` route)

---

## Known Limitations

1. Detection is DEMO quality (heuristic contour-based, not trained ML)
2. No validated SSS marine debris training data currently available
3. Anomaly thresholds are not statistically calibrated
4. No GPU acceleration (CPU-only inference)
5. No field validation performed
6. Synthetic demo data only — not real sonar acquisitions

See [HONESTY.md](HONESTY.md) for complete limitations.

---

*SIH26057 — Smart India Hackathon 2026 | AquaVision AI Team*
