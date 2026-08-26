"""Seed demo data for AquaVision AI.

Creates demo users, datasets, models, survey with candidates for demonstration.
Run: python -m database.seed.seed_demo
"""
import sys
import json
import random
from pathlib import Path
from datetime import datetime, timedelta

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from database.connection import create_tables, get_db_session
from database.models.users import User, Role
from database.models.surveys import Survey, SurveyFile, SurveyFrame, Location
from database.models.processing import ProcessingJob, ModelVersion, Dataset, InferenceRun
from database.models.ai import Candidate, Detection, Anomaly, DebrisCategory
from database.models.reports import Notification
from services.api.security import hash_password


def seed():
    """Seed the database with demo data."""
    print("🌊 AquaVision AI - Seeding Demo Data...")
    print("=" * 50)

    create_tables()
    db = get_db_session()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@aquavision.ai").first():
            print("⚠️  Database already seeded. Skipping.")
            print_credentials()
            return

        # === ROLES ===
        print("Creating roles...")
        roles = [
            Role(name="admin", description="Full system access"),
            Role(name="researcher", description="Survey analysis and review"),
            Role(name="field_operator", description="Field data collection"),
        ]
        db.add_all(roles)
        db.commit()

        # === USERS ===
        print("Creating users...")
        admin = User(email="admin@aquavision.ai", password_hash=hash_password("AquaVision2026!"),
                     full_name="AquaVision Admin", role="admin", organization="AquaVision AI Lab", is_active=True)
        researcher = User(email="researcher@aquavision.ai", password_hash=hash_password("Research2026!"),
                          full_name="Dr. Marine Scientist", role="researcher", organization="Marine Research Institute", is_active=True)
        db.add_all([admin, researcher])
        db.commit()
        db.refresh(admin)
        db.refresh(researcher)

        # === DEBRIS CATEGORIES ===
        print("Creating debris categories...")
        categories = [
            DebrisCategory(name="Plastic Debris", description="Plastic materials including bags, bottles, packaging"),
            DebrisCategory(name="Metal Debris", description="Metal objects, cans, structural materials"),
            DebrisCategory(name="Fishing Gear", description="Lost or abandoned fishing equipment"),
            DebrisCategory(name="Ghost Net Candidate", description="Potential abandoned fishing nets"),
            DebrisCategory(name="Container", description="Containers, barrels, drums"),
            DebrisCategory(name="Tire", description="Vehicle tires"),
            DebrisCategory(name="Wreckage", description="Structural wreckage, debris fields"),
            DebrisCategory(name="Natural Feature", description="Rocks, geological features, marine life"),
            DebrisCategory(name="Unknown Object", description="Unclassified objects requiring review"),
            DebrisCategory(name="Potential Net-like Structure", description="Linear structures resembling nets or cables"),
        ]
        db.add_all(categories)
        db.commit()

        # === DATASETS ===
        print("Creating dataset registry...")
        datasets = [
            Dataset(name="AI4Shipwrecks", source="University of Michigan Field Robotics Group (DOI: 10.7302/dmf4-x492)",
                    url="https://umfieldrobotics.github.io/ai4shipwrecks/",
                    modality="SSS", license="CC BY-NC 4.0 / Research Use", version="1.0",
                    download_status="COMPLETED", task_type="Segmentation, Anomaly Detection",
                    label_schema_json=json.dumps(["shipwreck", "background", "seabed"]),
                    image_count=286, sss_model_eligible=True,
                    limitations="Shipwreck-labeled side-scan sonar ground truth from Lake Huron (24 sites). Preserved as authentic acoustic structure/seabed; not relabeled as debris."),
            Dataset(name="Marine Debris FLS Dataset", source="Forward-Looking Sonar research dataset (Valdenegro-Toro)",
                    url="https://github.com/mvaldenegro/marine-debris-fls-datasets",
                    modality="FLS", license="CC BY 4.0", version="1.0",
                    download_status="NOT_DOWNLOADED", task_type="Object Detection, Classification",
                    label_schema_json=json.dumps(["bottle", "can", "chain", "drink-carton", "hook",
                                                   "propeller", "shampoo-bottle", "standing-bottle",
                                                   "tire", "valve", "wall"]),
                    image_count=1868, sss_model_eligible=False,
                    limitations="FLS modality - NOT SSS. Ineligible for SSS model training; cataloged for acoustic cross-reference only."),
            Dataset(name="Marine-PULSE", source="SSS underwater structures dataset",
                    modality="SSS", license="Research use", version="1.0",
                    download_status="NOT_DOWNLOADED", task_type="Segmentation, Background modeling",
                    label_schema_json=json.dumps(["underwater_structures", "seabed"]),
                    image_count=420, sss_model_eligible=True,
                    limitations="Seabed/structure labels. Useful for SSS domain understanding, not debris detection."),
        ]
        db.add_all(datasets)
        db.commit()

        # === MODEL VERSIONS ===
        print("Creating model registry...")
        demo_model = ModelVersion(
            name="SSS Acoustic Heuristic Detector", version="0.2.0-demo", task="DETECTION", modality="SSS",
            status="DEMO", inference_time_ms=45.0,
            classes_json=json.dumps(["Potential Net-like Anomaly", "Metallic Container Debris", "Submerged Pipeline Anomaly",
                                     "Plastic / Synthetic Dump", "Potential Fishing Gear", "Natural Rock Outcrop", "Natural Feature"]),
            description="Algorithmic heuristic detector applied to real, licensed AI4Shipwrecks SSS imagery. "
                       "Identifies high-backscatter highlights and acoustic shadows using adaptive thresholding.",
            metrics_json=json.dumps({
                "status": "HEURISTIC_ACTIVE",
                "dataset": "AI4Shipwrecks (Real SSS)",
                "note": "Detection currently uses algorithmic heuristics (contour thresholding, acoustic shadow evaluation) applied to real, licensed AI4Shipwrecks SSS imagery. Bounding-box debris triage runs heuristics pending a model trained on field-validated debris ground truth.",
            }),
        )
        anomaly_model = ModelVersion(
            name="SSS Acoustic Anomaly ConvAutoencoder", version="1.0.0-trained", task="ANOMALY", modality="SSS",
            status="TRAINED", inference_time_ms=1.56,
            classes_json=json.dumps(["normal_seabed", "acoustic_anomaly_or_wreck"]),
            description="Deep Convolutional Autoencoder (ConvAutoencoder) trained for 15 epochs on authentic AI4Shipwrecks SSS seabed patches. Evaluated on held-out test swaths.",
            metrics_json=json.dumps({
                "status": "TRAINED",
                "architecture": "ConvAutoencoder(1->32->64->128->32->128->64->32->1)",
                "dataset": "AI4Shipwrecks (University of Michigan, DOI: 10.7302/dmf4-x492)",
                "epochs": 15,
                "auroc": 0.9752,
                "f1_score": 0.9544,
                "precision": 0.9886,
                "recall": 0.9224,
                "optimal_threshold": 0.004244,
                "mean_normal_loss": 0.001474,
                "mean_anomaly_loss": 0.015895,
                "inference_latency_ms": 1.56,
                "checkpoint": "ml/checkpoints/ai4shipwrecks_anomaly_autoencoder.pt",
            }),
        )
        db.add_all([demo_model, anomaly_model])
        db.commit()
        db.refresh(demo_model)
        db.refresh(anomaly_model)

        # === DEMO SURVEY ===
        print("Creating demo survey...")
        # Generate synthetic SSS demo images
        demo_survey_dir = Path(PROJECT_ROOT) / "storage" / "originals" / "demo"
        demo_survey_dir.mkdir(parents=True, exist_ok=True)

        survey = Survey(
            name="Coastal South Survey Alpha",
            description="DEMO SURVEY - SSS survey along the Gulf of Mannar marine corridor (off Tuticorin / Rameswaram). "
                       "Synthetic tracklines and anomaly candidates for SIH26057 demonstration.",
            operator_id=researcher.id,
            date=datetime.utcnow() - timedelta(days=2),
            area_name="Gulf of Mannar Marine Corridor (Coastal South)",
            vessel_name="R/V Sagar Kanya",
            sonar_device="Klein 3000 Side-Scan Sonar",
            sonar_modality="SSS",
            frequency="450 kHz",
            gps_available=True,
            status="REVIEW_READY",
            total_files=50, total_frames=50, processed_frames=50,
            is_demo=True,
        )
        db.add(survey)
        db.commit()
        db.refresh(survey)

        # Create synthetic demo frames
        _create_demo_images(demo_survey_dir, survey.id, 50, db)

        # Create processing job (completed)
        job = ProcessingJob(
            survey_id=survey.id, job_type="survey_processing", status="COMPLETED",
            total_items=50, processed_items=50,
            started_at=datetime.utcnow() - timedelta(hours=1),
            completed_at=datetime.utcnow() - timedelta(minutes=30),
            config_json=json.dumps({"tile_size": 512, "overlap": 64, "model": "SSS Demo Detector v0.1.0"}),
            log_entries=json.dumps([
                {"time": (datetime.utcnow() - timedelta(hours=1)).isoformat(), "message": "Pipeline started"},
                {"time": (datetime.utcnow() - timedelta(minutes=50)).isoformat(), "message": "Found 50 frames to process"},
                {"time": (datetime.utcnow() - timedelta(minutes=45)).isoformat(), "message": "Tiling complete: 200 tiles from 50 frames"},
                {"time": (datetime.utcnow() - timedelta(minutes=35)).isoformat(), "message": "Detection complete: 23 detections found"},
                {"time": (datetime.utcnow() - timedelta(minutes=33)).isoformat(), "message": "Anomaly analysis complete: 8 anomalies found"},
                {"time": (datetime.utcnow() - timedelta(minutes=31)).isoformat(), "message": "Generated 15 candidates"},
                {"time": (datetime.utcnow() - timedelta(minutes=30)).isoformat(), "message": "Pipeline complete. 15 candidates ready for review."},
            ]),
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Inference run
        inf_run = InferenceRun(
            model_version_id=demo_model.id, survey_id=survey.id,
            processing_job_id=job.id, total_tiles=200, processed_tiles=200,
            started_at=datetime.utcnow() - timedelta(minutes=45),
            completed_at=datetime.utcnow() - timedelta(minutes=33),
        )
        db.add(inf_run)
        db.commit()
        db.refresh(inf_run)

        # === DEMO CANDIDATES ===
        print("Creating demo candidates...")
        candidate_data = [
            {"type": "COMBINED", "class": "Potential Net-like Anomaly", "conf": 0.82, "anom": 0.88, "priority": "CRITICAL", "score": 0.86},
            {"type": "DETECTION", "class": "Metallic Container Debris", "conf": 0.89, "anom": 0.74, "priority": "CRITICAL", "score": 0.83},
            {"type": "COMBINED", "class": "Submerged Pipeline Anomaly", "conf": 0.85, "anom": 0.76, "priority": "HIGH", "score": 0.79},
            {"type": "ANOMALY", "class": "Plastic / Synthetic Dump", "conf": 0.71, "anom": 0.69, "priority": "HIGH", "score": 0.71},
            {"type": "DETECTION", "class": "Potential Fishing Gear", "conf": 0.78, "anom": 0.62, "priority": "HIGH", "score": 0.73},
            {"type": "DETECTION", "class": "Unknown Object", "conf": 0.65, "anom": 0.38, "priority": "MEDIUM", "score": 0.55},
            {"type": "ANOMALY", "class": "Unknown Anomaly", "conf": None, "anom": 0.52, "priority": "MEDIUM", "score": 0.50},
            {"type": "DETECTION", "class": "Natural Rock Outcrop", "conf": 0.88, "anom": 0.15, "priority": "LOW", "score": 0.32},
            {"type": "DETECTION", "class": "Potential Anomaly", "conf": 0.55, "anom": 0.42, "priority": "MEDIUM", "score": 0.48},
            {"type": "DETECTION", "class": "Natural Feature", "conf": 0.95, "anom": 0.05, "priority": "LOW", "score": 0.20},
        ]

        # Demo locations (Gulf of Mannar marine corridor off southern Tamil Nadu coast)
        base_lat, base_lon = 9.1500, 79.1500  # Gulf of Mannar Marine Biosphere (~9.15°N, 79.15°E)
        candidates = []
        for i, cd in enumerate(candidate_data):
            c = Candidate(
                survey_id=survey.id, candidate_type=cd["type"],
                object_class=cd["class"], confidence=cd["conf"],
                anomaly_score=cd["anom"], priority_score=cd["score"],
                priority_category=cd["priority"], status="PENDING",
                explanation_json=json.dumps([
                    f"Anomaly score: {cd['anom']:.2f}" if cd['anom'] else "No anomaly data",
                    f"Detection confidence: {cd['conf']:.2f}" if cd['conf'] else "No detection data",
                    f"Object type: {cd['class']}",
                    f"Priority: {cd['priority']} ({cd['score']:.3f})",
                    "PRECOMPUTED FOR DEMO RELIABILITY",
                ]),
            )
            db.add(c)
            db.flush()
            candidates.append(c)

            # Add location in Gulf of Mannar coastal waters
            loc = Location(
                survey_id=survey.id, candidate_id=c.id,
                latitude=base_lat + random.uniform(-0.015, 0.015),
                longitude=base_lon + random.uniform(-0.015, 0.015),
                depth=random.uniform(8, 35),
                quality="MEDIUM", source="DEMO SURVEY - Gulf of Mannar Marine Corridor",
            )
            db.add(loc)

        db.commit()

        # Notification for demo
        notif = Notification(
            user_id=researcher.id, title="Demo Survey Ready",
            message=f"Demo survey 'Bay Area Alpha' has {len(candidates)} candidates ready for review.",
            notification_type="SUCCESS", entity_type="survey", entity_id=str(survey.id),
        )
        db.add(notif)
        db.commit()

        print("=" * 50)
        print("✅ Demo data seeded successfully!")
        print_credentials()

    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def _create_demo_images(output_dir: Path, survey_id: int, count: int, db):
    """Generate synthetic SSS-like demo images."""
    try:
        import numpy as np
        import cv2

        for i in range(count):
            # Create synthetic SSS-like image (dark background with bright features)
            h, w = 1024, 2048
            img = np.random.randint(20, 60, (h, w), dtype=np.uint8)  # Dark seabed background

            # Add some texture (seabed patterns)
            noise = np.random.normal(0, 10, (h, w)).astype(np.float32)
            img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

            # Add gradient (range-dependent intensity typical of SSS)
            gradient = np.tile(np.linspace(40, 10, w).astype(np.uint8), (h, 1))
            img = cv2.add(img, gradient)

            # Add some bright objects (simulating targets)
            num_objects = random.randint(0, 3)
            for _ in range(num_objects):
                cx, cy = random.randint(100, w-100), random.randint(100, h-100)
                size = random.randint(10, 50)
                brightness = random.randint(150, 240)
                cv2.ellipse(img, (cx, cy), (size, size//2), random.randint(0, 180), 0, 360, brightness, -1)
                # Add acoustic shadow
                shadow_len = size * 2
                cv2.rectangle(img, (cx - size//2, cy + size//2),
                            (cx + size//2, cy + size//2 + shadow_len), 10, -1)

            # Save
            filename = f"demo_sss_frame_{i:04d}.png"
            filepath = str(output_dir / filename)
            cv2.imwrite(filepath, img)

            # Register in DB
            from database.models.surveys import SurveyFile, SurveyFrame
            sf = SurveyFile(
                survey_id=survey_id, original_filename=filename,
                stored_path=filepath, file_hash=f"demo_hash_{i:04d}",
                file_size=os.path.getsize(filepath) if os.path.exists(filepath) else 0,
                mime_type="image/png", width=w, height=h,
                sonar_modality="SSS", source="SYNTHETIC DEMO",
            )
            db.add(sf)
            db.flush()
            frame = SurveyFrame(
                survey_id=survey_id, file_id=sf.id,
                sequence_index=i, source_file=filename,
                frame_path=filepath, width=w, height=h,
            )
            db.add(frame)

        db.commit()
        print(f"  Created {count} synthetic SSS demo images")
    except ImportError:
        print("  ⚠️ OpenCV/NumPy not available - skipping demo image generation")
    except Exception as e:
        print(f"  ⚠️ Demo image generation error: {e}")


def print_credentials():
    print()
    print("📋 Demo Credentials:")
    print("  Admin:      admin@aquavision.ai / AquaVision2026!")
    print("  Researcher: researcher@aquavision.ai / Research2026!")
    print()
    print("🚀 Start the API:")
    print('  cd services/api && python -m uvicorn main:app --reload --port 8000')
    print()
    print("📖 API Docs: http://localhost:8000/docs")
    print()


import os
if __name__ == "__main__":
    seed()
