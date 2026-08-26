# JUDGE Q&A — AquaVision AI (SIH26057)

## 24 Anticipated Judge Questions with Honest Answers

---

### Q1: Why Side-Scan Sonar specifically? What's the problem with manual inspection?

**A:** Side-Scan Sonar (SSS) is the standard tool for large-area underwater survey — a single mission can produce thousands of sonar image frames covering kilometers of seabed. The core problem is the inspection bottleneck: a qualified marine scientist must review every frame looking for debris, anomalies, or objects of interest. This is time-consuming, fatiguing, and scales poorly with survey size. AquaVision AI automatically screens these frames to identify which regions actually need expert attention, so the scientist spends time on the most important candidates rather than watching kilometers of empty seabed.

---

### Q2: How does AquaVision process large surveys?

**A:** The pipeline is: upload → frame registration (checksum, metadata) → large-image tiling (configurable overlap to avoid missed objects at boundaries) → SSS-specific preprocessing (CLAHE contrast enhancement, denoising, normalization) → batch AI screening → anomaly analysis per tile → candidate aggregation across tiles → IoU-based duplicate merging → priority ranking → review queue generation. All steps persist incrementally so a 2,000-frame survey can resume after interruption.

---

### Q3: How are candidates generated and deduplicated?

**A:** Each detected object or anomaly is associated with the tile it was found in, then converted back to original survey coordinates. When the same object appears across overlapping tiles (due to the tiling overlap strategy), we compute Intersection over Union (IoU) and merge overlapping candidates above a threshold (0.3). The merged candidate preserves references to all source detections and tiles for full traceability.

---

### Q4: How does anomaly detection work?

**A:** Currently: a DEMO heuristic using local image variance and Laplacian texture complexity. An anomaly score is computed per tile and thresholded at a configurable value (default 0.5). The real target architecture (for post-hackathon) is a convolutional autoencoder trained on normal SSS seabed patches — it learns to reconstruct "normal" scenes, and regions with high reconstruction error are flagged as anomalies. The distinction between current DEMO status and the target architecture is explicitly shown in the Model Center.

---

### Q5: How does candidate ranking work?

**A:** The Inspection Priority Score uses a documented weighted formula:

```
priority = 0.35 × anomaly_score + 0.25 × confidence + 
           0.20 × type_weight + 0.20 × uncertainty_factor
```

Type weights reflect inspection importance (e.g., "Ghost Net Candidate" = 0.95, "Natural Feature" = 0.20). Output categories are CRITICAL (>0.8), HIGH (>0.6), MEDIUM (>0.4), LOW (≤0.4). The formula and weights are documented and configurable.

---

### Q6: How do you handle ghost nets and fishing gear?

**A:** Where the model lacks validated ghost-net labels, findings are phrased as "Potential Net-like Structure — requires human verification," never "Confirmed Ghost Net." The review queue includes a "POTENTIAL_GEAR" action so researchers can mark candidates appropriately. The system architecture supports adding a validated ghost-net model via the Model Registry when suitable training data becomes available.

---

### Q7: What datasets did you use? Are they SSS or FLS?

**A:** We investigated three datasets:
- **Marine Debris FLS Dataset** — FLS modality, NOT SSS. Used for auxiliary FLS experimentation only. Never presented as SSS data.
- **AI4Shipwrecks** — genuine SSS. Used for understanding SSS characteristics and preprocessing. Shipwreck labels ≠ debris labels.
- **Marine-PULSE** — genuine SSS. Useful for SSS background modeling.

No suitable labeled SSS marine-debris dataset was found at sufficient scale for training a validated detection model. This is honestly documented.

---

### Q8: What is the actual model accuracy?

**A:** The current detection model is a DEMO heuristic (contour-based image processing) — accuracy metrics are NOT available because there is no ground-truth labeled test set. The UI displays "Metric unavailable — requires validated dataset/evaluation" rather than inventing numbers. This is a deliberate, honest design choice that we believe judges will respect more than fabricated metrics.

---

### Q9: How do false positives get handled?

**A:** The human review workflow is the primary false-positive handler. Candidates marked as REJECT, NATURAL_FEATURE, or re-labeled via CORRECT are persisted with reviewer identity, timestamp, and reason. These corrections form a future training dataset. The review queue also shows confidence levels so researchers can easily identify low-confidence detections for extra scrutiny.

---

### Q10: How do you avoid hallucinating object identities?

**A:** The system only exposes classes supported by the active model. Currently: "Unknown Object," "Potential Debris," "Natural Feature," "Potential Net-like Structure," "Potential Anomaly." We never claim "Confirmed Ghost Net" or "Plastic Bottle" without validated training evidence. Every AI result shows its model name, version, and status (DEMO/EXPERIMENTAL/VALIDATED).

---

### Q11: How does human review improve the system over time?

**A:** Every review action (accept/reject/correct/uncertain) is stored in the `corrections` table with the original prediction, reviewed label, reviewer, timestamp, and reason. This creates a growing dataset of verified annotations. A future controlled retraining pipeline (explicit, not automatic) can use these corrections to improve model quality. We do NOT claim the model learns automatically from corrections.

---

### Q12: Could this be deployed on a real research vessel?

**A:** The architecture is designed for that path: the API is containerizable (Docker config provided), database is upgradable to PostgreSQL, processing jobs are asynchronous and resumable, and the ML pipeline is device-agnostic (GPU when available, CPU fallback). However, deployment on a vessel would require field validation with real sonar data, calibration testing, and integration with vessel navigation systems. We label the current system SIH PROTOTYPE, not PRODUCTION-READY.

---

### Q13: Has this been field validated?

**A:** No. The current system uses synthetic demo imagery and DEMO-status AI models. Field validation requires real SSS acquisition, real debris placement or known ground truth, and independent test surveys. We have a documented field validation protocol (Section 96.27 of our build spec) for the post-hackathon path.

---

### Q14: What is your biggest limitation?

**A:** The SSS marine-debris dataset problem. Without labeled real-world SSS imagery showing confirmed debris, we cannot train and evaluate a production-grade detector. All other system components (pipeline, priority engine, review workflow, database, UI) are real and functional. The AI model is the component that requires field data to advance beyond DEMO quality.

---

### Q15: Why is this better than full manual review?

**A:** Full manual review of 2,000 frames means a scientist inspects every region equally. AquaVision presents a prioritized candidate queue — typically a fraction of total frames — where the AI has already filtered obviously empty regions. The scientist validates only the flagged candidates. The theoretical workload reduction depends on candidate generation recall and precision, which we have not yet measured in a controlled experiment (and we say so explicitly — no fabricated percentages).

---

### Q16: How does the system handle different sonar frequencies and systems?

**A:** The modality registry stores frequency where available. The preprocessing pipeline (CLAHE + denoise + normalize) is not frequency-specific and applies generally. However, a production model should be evaluated across different sonar systems and frequencies. We document this as a domain-shift risk and do not claim cross-system generalization without evidence.

---

### Q17: What if GPS/depth metadata is missing?

**A:** Missing navigation data is stored as UNAVAILABLE — never replaced with invented coordinates. The map shows "Location data unavailable" for candidates without coordinates. The system still functions fully for detection, review, and reporting; it just cannot map those candidates spatially.

---

### Q18: How does the system scale to millions of frames?

**A:** Current architecture: SQLite (for demo), asynchronous processing jobs, batch tile inference. Path to millions of frames: PostgreSQL database, distributed job queue (e.g., Celery), GPU inference cluster, tile streaming to avoid loading full surveys into memory. All these are architectural extensions — the current prototype demonstrates the approach at smaller scale with a clean extension path.

---

### Q19: What are your production deployment requirements?

**A:** Minimum viable production requirements: GPU server for inference, PostgreSQL database, field-validated SSS marine debris training data, vessel integration for real-time data ingestion, security audit, QA/QC procedures, and trained operator onboarding. We do not claim production readiness — we demonstrate a credible prototype with an honest roadmap.

---

### Q20: Why use SSS instead of underwater cameras or ROVs?

**A:** SSS surveys wide areas efficiently from the surface — a single tow can scan kilometers per hour. ROVs and cameras are high-resolution but extremely slow for large-area surveys. SSS is the established tool for initial survey; ROV follow-up can then target confirmed candidates. AquaVision fits the actual field workflow: SSS screening → AI prioritization → targeted follow-up.

---

### Q21: What is your innovation vs. existing underwater detection systems?

**A:** The innovation is the workflow integration — connecting large-survey ingestion → automated screening → IoU-based deduplication → documented priority ranking → evidence-preserving human review → audit-logged corrections into one cohesive platform. Most academic work focuses on single-image detection. Our system addresses the operational bottleneck of managing thousands of frames with full provenance tracking.

---

### Q22: How did you ensure honesty in your AI claims?

**A:** Every AI result in the system displays: model name, version, modality badge (SSS/FLS), and status badge (DEMO/EXPERIMENTAL/VALIDATED). All metrics show "N/A — requires validated dataset" when not computed. We maintain HONESTY.md documenting every dataset license, model status, and limitation. The judge Q&A, self-assessment, and evaluator simulation documents were written before building the UI so the design reflects honest framing from the start.

---

### Q23: What would it take to make this production-ready?

**A:** Three things: (1) **Data** — collaborate with marine research institutions to collect labeled SSS surveys with confirmed debris. (2) **Validation** — train and evaluate with held-out test data, cross-survey testing, domain-shift analysis. (3) **Field trial** — deploy on a research vessel, compare AI-assisted review against manual review with real measured timing data. The system architecture is designed to support each of these steps.

---

### Q24: What is your team's biggest technical risk?

**A:** The SSS debris data gap. Everything in the platform works — the risk is that if no labeled SSS marine debris dataset becomes available, the system remains at DEMO quality for the detection component. Our mitigation: (a) the anomaly detection approach doesn't require debris labels — it learns "normal" seabed and flags deviations; (b) the FLS debris detector can be integrated as an auxiliary tool clearly labeled FLS; (c) the architecture is specifically designed for adding a validated model via Model Registry without rewriting the platform.
