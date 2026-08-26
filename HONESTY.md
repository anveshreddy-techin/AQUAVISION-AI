# HONESTY.md — AquaVision AI (SIH26057)

## The Honesty Contract

AquaVision AI commits to never fabricating metrics, coordinates, model performance claims, or scientific validations. This document records exactly what is real, what is experimental, and what is not yet built.

---

## Datasets

| Dataset | Modality | SSS Eligible | Status | Use in AquaVision |
|---------|----------|-------------|--------|-------------------|
| Marine Debris FLS Dataset | **FLS** | ❌ NO | Not downloaded | Auxiliary experimentation only. Never used as SSS data. |
| AI4Shipwrecks | **SSS** | ✅ YES (seabed/background only) | Not downloaded | SSS background modeling, preprocessing validation. Shipwreck labels ≠ debris labels. |
| Marine-PULSE | **SSS** | ✅ YES (seabed/background only) | Not downloaded | SSS domain understanding. Not debris labels. |

**Dataset verification date:** August 2026. Availability may change — verify current access before use.

---

## Models

| Model | Status | Modality | What It Actually Does |
|-------|--------|----------|-----------------------|
| SSS Demo Detector v0.1.0 | **DEMO** | SSS | Contour-based heuristic using cv2.findContours on bright regions. NOT a trained neural network. |
| SSS Anomaly Detector v0.1.0 | **DEMO** | SSS | Local variance + Laplacian texture scoring. NOT a trained autoencoder. |
| SSS Marine-Debris Classifier | **BLOCKED** | SSS | Requires field-labeled SSS marine debris training data. Not implemented. |

### What "DEMO" means
- A DEMO detector uses hand-crafted image processing rules, not learned weights.
- Confidence scores are heuristic estimates, not calibrated probabilities.
- Performance is NOT measured against ground truth.

### What "BLOCKED" means
- The system architecture is ready for this model.
- Implementation is blocked by absence of suitable labeled SSS marine-debris training data.
- See Section 96.26 of the build specification.

---

## Metrics

| Metric | Status | Reason |
|--------|--------|--------|
| Detection Precision/Recall/F1 | **NOT AVAILABLE** | No ground-truth labeled SSS marine debris test set |
| mAP@0.5 / mAP@0.5:0.95 | **NOT AVAILABLE** | Requires validated detection dataset |
| Anomaly AUROC/AUPRC | **NOT AVAILABLE** | No anomaly ground truth |
| Workload reduction % | **NOT VALIDATED** | No controlled review-time experiment conducted |
| Inference time | Demo mode: ~45ms/tile on CPU (measured) | Subject to hardware variation |

All metric fields displaying "N/A" in the UI are accurate — they are genuinely not computable from current data.

---

## Demo Data

- **Survey imagery:** 50 synthetic SSS-like images generated with NumPy/OpenCV. NOT real sonar acquisitions.
- **Candidates:** 15 pre-seeded candidates. Represent plausible pipeline output structure, NOT real field findings.
- **Coordinates:** Synthetic coordinates near a placeholder location. NOT real GPS data.
- **All demo results are labeled: "PRECOMPUTED FOR DEMO RELIABILITY"**

---

## Modality Labeling

- SSS (Side-Scan Sonar) and FLS (Forward-Looking Sonar) are treated as **strictly separate modalities**.
- No FLS model is presented as an SSS model anywhere in the system.
- Every AI result shows its source modality badge.

---

## Evidence Hierarchy (per spec Section 96.25)

Current AquaVision AI prototype: **LEVEL 1** (synthetic demonstration with real SSS pipeline architecture)

To reach LEVEL 2: download and use real AI4Shipwrecks/Marine-PULSE data for preprocessing experiments.  
To reach LEVEL 3: obtain labeled SSS marine debris data, train detector, evaluate with held-out test set.  
To reach LEVEL 4: cross-survey validation with multiple independent SSS surveys.  
To reach LEVEL 5: field deployment and ground-truth validation.

---

## Field Validation

**None has been performed.** The system is a prototype. Claims about operational performance require field trials with real sonar equipment, real debris, and independent ground-truth verification.

---

## Benchmark

No manual-vs-AI-assisted review time experiment has been conducted. Any productivity claim without this experiment would be fabricated. The system architecture supports future benchmarking via the `benchmark_runs` table.

---

## What IS Real in This Prototype

✅ Complete SSS survey processing pipeline (ingest → tile → preprocess → detect → anomaly → candidates → rank → review)  
✅ Real SQLAlchemy database with 26 tables and full data traceability  
✅ Real JWT authentication with bcrypt password hashing and RBAC  
✅ Real CLAHE + denoise + normalize preprocessing pipeline  
✅ Real IoU-based candidate deduplication  
✅ Real priority ranking formula (documented, configurable weights)  
✅ Real human review workflow with correction persistence  
✅ Real PDF report generation  
✅ Real audit logging  
✅ Correct SSS vs FLS modality labeling throughout  

---

## Licenses

| Component | License |
|-----------|---------|
| FastAPI | MIT |
| SQLAlchemy | MIT |
| Next.js | MIT |
| OpenCV | Apache 2.0 |
| ReportLab | BSD |
| PyTorch (when added) | BSD |
| Tailwind CSS | MIT |

---

*Last updated: August 2026. This document must be updated whenever model status, dataset access, or metric availability changes.*
