# AquaVision AI — Demo Script for SIH Presentation

## Complete 15-Minute Demo Walkthrough

**Prerequisites:** API running on :8000, frontend running on :3000, database seeded.

---

## SCENE 1 — Problem Statement (2 minutes)

**Say:** "Side-scan sonar surveys produce thousands of frames per mission. A marine scientist reviewing them manually is looking for a handful of debris items in thousands of images — like finding a few objects in 10,000 photographs taken on autopilot. AquaVision AI changes this workflow."

**Show:** Open `http://localhost:3000` — the AquaVision AI landing page with the dark marine theme.

---

## SCENE 2 — Login & Dashboard (1.5 minutes)

**Show:** Click Login → Enter researcher@aquavision.ai / Research2026!

**Say:** "The dashboard immediately shows the mission state."

**Highlight:** 
- 50 Frames Screened
- 15 Candidates Identified  
- 2 CRITICAL Priority
- Candidate Priority Donut Chart
- Review Completion Progress Bar (0/15)

---

## SCENE 3 — Survey Detail (2 minutes)

**Show:** Click Surveys → Click "Demo Survey - Bay Area Alpha"

**Say:** "This is a Side-Scan Sonar survey processed through our pipeline. Notice the sonar modality badge — SSS — which is explicitly tracked throughout the system."

**Show:** Survey tabs → Processing → See the job log:
- "Pipeline started"
- "Tiling complete: 200 tiles from 50 frames"
- "Detection complete: 23 detections found"
- "Anomaly analysis: 8 anomalies found"
- "Generated 15 candidates"

**Say:** "The system tiled each frame into processing windows, applied CLAHE contrast enhancement and denoising, ran detection and anomaly analysis, then merged overlapping candidates across tiles using IoU matching."

---

## SCENE 4 — AI Transparency (1.5 minutes)

**Show:** Click AI Models in sidebar

**Say:** "We're completely transparent about the AI status. Here's what you see:"

**Highlight:**
- SSS Demo Detector — DEMO badge (orange) — "Contour-based heuristic, NOT a trained ML model"
- SSS Anomaly Detector — DEMO badge — "Variance-based heuristic"
- Status badge: BLOCKED for the trained SSS classifier (requires labeled data)

**Say:** "We label exactly what is real and what is demo. The architecture is built to plug in a validated model when one becomes available. No fabricated accuracy claims."

---

## SCENE 5 — Review Queue (3 minutes)

**Show:** Click Review Queue → Sorted by priority (2 CRITICAL at top)

**Say:** "Instead of reviewing 50 frames, the scientist reviews 15 candidates — and sees the most important ones first."

**Show:** Click first CRITICAL candidate:
- Evidence panels: Original SSS tile | Enhanced | Detection overlay | Anomaly score
- AI explanation: "Anomaly score: 0.87 | Detection confidence: 0.82 | Priority: CRITICAL"
- Priority formula visible

**Show:** Click "ACCEPT" → Candidate status changes → Review count increments

**Show:** Click second candidate → Click "NATURAL FEATURE" with reason "Rocky seabed formation" → Shows REJECT with label

**Show:** Session stats update in real time: "Reviewed: 2/15 (13.3%)"

---

## SCENE 6 — Map View (1 minute)

**Show:** Click Map

**Say:** "Candidates are plotted on a map — color coded by priority. Red = CRITICAL, Orange = HIGH."

**Show:** Click a red marker → Popup shows candidate summary → Link to review

**Say:** "Note: these are synthetic demo coordinates. In a real survey with GPS, actual acquisition coordinates would appear here."

---

## SCENE 7 — Analytics (1 minute)

**Show:** Click Analytics

**Highlight:**
- Priority distribution chart
- Review completion rate (updates live after our earlier reviews)
- Class distribution

**Say:** "These analytics update in real time as the review progresses."

---

## SCENE 8 — Report Generation (1 minute)

**Show:** Click Reports → Generate Report → Select "Full Report" → Click Generate

**Wait:** ~3 seconds

**Show:** Download PDF → Open it

**Highlight:** Title page, executive summary, candidate table, limitations section

**Say:** "The report includes an explicit limitations section disclosing that the AI models are in DEMO status. We designed the system to be defensible, not just impressive-looking."

---

## SCENE 9 — Admin Features (30 seconds)

**Show:** Logout → Login as admin@aquavision.ai / AquaVision2026!

**Show:** Audit Log → Every action logged with user, timestamp, entity

**Say:** "Full audit trail for all user actions — essential for scientific accountability."

---

## SCENE 10 — Upload New Data (optional, 1 minute)

**Show:** Surveys → Create New Survey → Fill form → Upload a test image → Start Processing

**Say:** "The full pipeline runs end-to-end on new data — the same workflow we just demonstrated, on your own sonar imagery."

---

## Common Demo Failures and Recovery

| Problem | Recovery |
|---------|----------|
| API not running | `cd .. && python3 -m uvicorn services.api.main:app --port 8000` |
| Database empty | `python3 -m database.seed.seed_demo` |
| Frontend not loading | `cd apps/web && npm run dev` |
| Login fails | Check email/password exactly as shown above |
| Map blank | Normal if no candidates have coordinates — show the "No GPS" message |

---

## Key Talking Points Under Pressure

**"Your model accuracy?"** — "We display N/A because no validated test set exists. We refuse to fabricate metrics."

**"This is just image processing, not AI?"** — "The demo detector is heuristic — the platform is fully prepared for a trained model the moment labeled SSS marine debris data becomes available. The pipeline, database, review workflow, and priority ranking are all real."

**"How is this different from existing systems?"** — "The integration: whole-survey processing with full provenance, priority-ranked human review queue, audit-logged corrections as future training data — all in one platform designed for marine scientists."
