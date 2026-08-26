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
            Dataset(name="Marine Debris FLS Dataset", source="Forward-Looking Sonar research dataset",
                    url="https://github.com/mvaldenegro/marine-debris-fls-datasets",
                    modality="FLS", license="CC BY 4.0", version="1.0",
                    download_status="NOT_DOWNLOADED", task_type="Object Detection, Classification",
                    label_schema_json=json.dumps(["bottle", "can", "chain", "drink-carton", "hook",
                                                   "propeller", "shampoo-bottle", "standing-bottle",
                                                   "tire", "valve", "wall"]),
                    image_count=1868, sss_model_eligible=False,
                    limitations="FLS modality - NOT SSS. Cannot be used as SSS training data."),
            Dataset(name="AI4Shipwrecks", source="SSS shipwreck detection dataset",
                    modality="SSS", license="Research use", version="1.0",
                    download_status="NOT_DOWNLOADED", task_type="Segmentation, Detection",
                    label_schema_json=json.dumps(["shipwreck", "background"]),
                    image_count=None, sss_model_eligible=True,
                    limitations="Shipwreck labels, not marine debris. Useful for SSS background/preprocessing."),
            Dataset(name="Marine-PULSE", source="SSS underwater structures dataset",
                    modality="SSS", license="Research use", version="1.0",
                    download_status="NOT_DOWNLOADED", task_type="Segmentation, Background modeling",
                    image_count=None, sss_model_eligible=True,
                    limitations="Seabed/structure labels. Useful for SSS domain understanding, not debris detection."),
        ]
        db.add_all(datasets)
        db.commit()

        # === MODEL VERSIONS ===
        print("Creating model registry...")
        demo_model = ModelVersion(
            name="SSS Demo Detector", version="0.1.0", task="DETECTION", modality="SSS",
            status="DEMO", inference_time_ms=45.0,
            classes_json=json.dumps(["Unknown Object", "Potential Debris", "Natural Feature",
                                     "Potential Net-like Structure", "Potential Anomaly"]),
            description="PRECOMPUTED DEMO - Contour-based heuristic detector. NOT a trained ML model. "
                       "Uses image processing to identify bright regions in SSS imagery.",
            metrics_json=json.dumps({"note": "Metric unavailable - requires validated dataset/evaluation.",
                                     "status": "DEMO", "method": "Contour-based heuristic"}),
        )
        anomaly_model = ModelVersion(
            name="SSS Anomaly Detector", version="0.1.0", task="ANOMALY", modality="SSS",
            status="DEMO", inference_time_ms=30.0,
            classes_json=json.dumps(["normal", "anomaly"]),
            description="PRECOMPUTED DEMO - Variance/texture-based anomaly scoring. NOT a trained autoencoder. "
                       "Requires legitimate SSS background data for proper training.",
            metrics_json=json.dumps({"note": "Metric unavailable - requires validated dataset/evaluation.",
                                     "status": "DEMO", "method": "Local variance + Laplacian texture"}),
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
            name="Demo Survey - Bay Area Alpha",
            description="PRECOMPUTED DEMO SURVEY - Simulated SSS survey of a coastal bay area. "
                       "All data is synthetic and for demonstration purposes only.",
            operator_id=researcher.id,
            date=datetime.utcnow() - timedelta(days=2),
            area_name="Coastal Bay Alpha (Synthetic)",
            vessel_name="R/V Demo Vessel",
            sonar_device="Simulated SSS System",
            sonar_modality="SSS",
            frequency="400 kHz (simulated)",
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
            {"type": "DETECTION", "class": "Potential Debris", "conf": 0.87, "anom": 0.72, "priority": "CRITICAL", "score": 0.85},
            {"type": "COMBINED", "class": "Potential Net-like Structure", "conf": 0.82, "anom": 0.68, "priority": "CRITICAL", "score": 0.83},
            {"type": "DETECTION", "class": "Unknown Object", "conf": 0.79, "anom": 0.55, "priority": "HIGH", "score": 0.72},
            {"type": "ANOMALY", "class": "Unknown Anomaly", "conf": None, "anom": 0.81, "priority": "HIGH", "score": 0.70},
            {"type": "DETECTION", "class": "Potential Debris", "conf": 0.71, "anom": 0.45, "priority": "HIGH", "score": 0.65},
            {"type": "DETECTION", "class": "Unknown Object", "conf": 0.65, "anom": 0.38, "priority": "MEDIUM", "score": 0.55},
            {"type": "ANOMALY", "class": "Unknown Anomaly", "conf": None, "anom": 0.52, "priority": "MEDIUM", "score": 0.50},
            {"type": "DETECTION", "class": "Natural Feature", "conf": 0.88, "anom": 0.15, "priority": "MEDIUM", "score": 0.45},
            {"type": "DETECTION", "class": "Potential Anomaly", "conf": 0.55, "anom": 0.42, "priority": "MEDIUM", "score": 0.48},
            {"type": "DETECTION", "class": "Unknown Object", "conf": 0.48, "anom": 0.30, "priority": "LOW", "score": 0.38},
            {"type": "DETECTION", "class": "Natural Feature", "conf": 0.92, "anom": 0.08, "priority": "LOW", "score": 0.30},
            {"type": "DETECTION", "class": "Unknown Object", "conf": 0.35, "anom": 0.22, "priority": "LOW", "score": 0.28},
            {"type": "ANOMALY", "class": "Unknown Anomaly", "conf": None, "anom": 0.35, "priority": "LOW", "score": 0.25},
            {"type": "DETECTION", "class": "Natural Feature", "conf": 0.95, "anom": 0.05, "priority": "LOW", "score": 0.20},
            {"type": "DETECTION", "class": "Unknown Object", "conf": 0.28, "anom": 0.18, "priority": "LOW", "score": 0.18},
        ]

        # Demo locations (synthetic coordinates around a bay area)
        base_lat, base_lon = 12.9716, 77.5946  # Synthetic location
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

            # Add location
            loc = Location(
                survey_id=survey.id, candidate_id=c.id,
                latitude=base_lat + random.uniform(-0.01, 0.01),
                longitude=base_lon + random.uniform(-0.01, 0.01),
                depth=random.uniform(5, 30),
                quality="MEDIUM", source="SYNTHETIC DEMO - Not real coordinates",
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
