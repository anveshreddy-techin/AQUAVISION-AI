"""Survey Processing Pipeline - the CORE of AquaVision AI.

This implements the complete survey-scale processing workflow:
INGEST → TILE → PREPROCESS → DETECT → ANOMALY → CANDIDATES → RANK → REVIEW_READY
"""
import json
import os
import traceback
from datetime import datetime
from pathlib import Path

from database.connection import get_db_session
from database.models.surveys import Survey, SurveyFrame, SurveyTile
from database.models.processing import ProcessingJob, ModelVersion, InferenceRun
from database.models.ai import Candidate, Detection, Anomaly, CandidateEvidence
from database.models.reports import Notification
from services.api.config import settings


class SurveyProcessingPipeline:
    """End-to-end survey processing pipeline.

    Steps:
    1. Validate survey and frames
    2. Tile large images into processing windows
    3. Preprocess tiles (CLAHE + denoise + normalize)
    4. Run object detection on tiles
    5. Run anomaly detection on tiles
    6. Generate candidates from detections + anomalies
    7. Merge/deduplicate overlapping candidates
    8. Rank candidates by priority score
    9. Update survey status to REVIEW_READY
    """

    def process(self, survey_id: int, job_id: int):
        """Run the full processing pipeline for a survey."""
        db = get_db_session()
        try:
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            survey = db.query(Survey).filter(Survey.id == survey_id).first()
            if not job or not survey:
                return

            self._log(job, "Pipeline started", db)
            job.status = "VALIDATING"
            job.started_at = datetime.utcnow()
            db.commit()

            # Step 1: Get frames
            frames = db.query(SurveyFrame).filter(SurveyFrame.survey_id == survey_id).all()
            if not frames:
                self._fail(job, survey, "No frames found", db)
                return

            job.total_items = len(frames)
            self._log(job, f"Found {len(frames)} frames to process", db)
            db.commit()

            # Step 2: Tile frames
            job.status = "PREPROCESSING"
            self._log(job, "Tiling and preprocessing frames...", db)
            db.commit()

            all_tiles = []
            for i, frame in enumerate(frames):
                try:
                    tiles = self._tile_and_preprocess_frame(frame, survey_id, db)
                    all_tiles.extend(tiles)
                    job.processed_items = i + 1
                    survey.processed_frames = i + 1
                    if (i + 1) % 10 == 0:
                        self._log(job, f"Preprocessed {i+1}/{len(frames)} frames ({len(all_tiles)} tiles)", db)
                    db.commit()
                except Exception as e:
                    job.failed_items += 1
                    survey.failed_frames += 1
                    self._log(job, f"Frame {frame.id} failed: {str(e)}", db)
                    db.commit()

            self._log(job, f"Tiling complete: {len(all_tiles)} tiles from {len(frames)} frames", db)

            # Step 3: Detection
            job.status = "DETECTING"
            self._log(job, "Running AI detection...", db)
            db.commit()

            # Get or create demo model version
            model = db.query(ModelVersion).filter(ModelVersion.status == "DEMO").first()
            if not model:
                model = ModelVersion(name="SSS Demo Detector", version="0.1.0", task="DETECTION",
                                    modality="SSS", status="DEMO",
                                    classes_json=json.dumps(["Unknown Object", "Potential Debris", "Natural Feature"]),
                                    description="PRECOMPUTED DEMO - Contour-based heuristic detector, not a trained ML model")
                db.add(model)
                db.commit()
                db.refresh(model)

            # Create inference run
            inf_run = InferenceRun(model_version_id=model.id, survey_id=survey_id,
                                   processing_job_id=job_id, total_tiles=len(all_tiles))
            db.add(inf_run)
            db.commit()
            db.refresh(inf_run)

            detections = self._run_detection(all_tiles, model.id, inf_run.id, db)
            self._log(job, f"Detection complete: {len(detections)} detections found", db)

            # Step 4: Anomaly analysis
            job.status = "ANALYZING"
            self._log(job, "Running anomaly analysis...", db)
            db.commit()

            anomalies = self._run_anomaly_analysis(all_tiles, inf_run.id, db)
            self._log(job, f"Anomaly analysis complete: {len(anomalies)} anomalies found", db)

            # Step 5: Generate candidates
            self._log(job, "Generating candidates...", db)
            candidates = self._generate_candidates(survey_id, detections, anomalies, all_tiles, db)
            self._log(job, f"Generated {len(candidates)} candidates", db)

            # Step 6: Rank candidates
            job.status = "RANKING"
            self._log(job, "Ranking candidates by priority...", db)
            db.commit()
            self._rank_candidates(candidates, db)

            # Step 7: Complete
            job.status = "REVIEW_READY"
            job.completed_at = datetime.utcnow()
            survey.status = "REVIEW_READY"
            self._log(job, f"Pipeline complete. {len(candidates)} candidates ready for review.", db)
            db.commit()

            # Notify survey owner
            notif = Notification(user_id=survey.operator_id, title="Processing Complete",
                                message=f"Survey '{survey.name}' processing is complete. {len(candidates)} candidates ready for review.",
                                notification_type="SUCCESS", entity_type="survey", entity_id=str(survey_id))
            db.add(notif)
            db.commit()

        except Exception as e:
            tb = traceback.format_exc()
            self._fail(job, survey, f"Pipeline error: {str(e)}\n{tb}", db)
        finally:
            db.close()

    def _tile_and_preprocess_frame(self, frame: SurveyFrame, survey_id: int, db) -> list:
        """Tile a frame and preprocess each tile."""
        import cv2
        import numpy as np

        image_path = frame.frame_path
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Frame file not found: {image_path}")

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        h, w = img.shape
        tile_size = settings.TILE_SIZE
        overlap = settings.TILE_OVERLAP
        stride = tile_size - overlap

        tiles = []
        tile_dir = settings.PROCESSED_DIR / str(survey_id) / "tiles"
        tile_dir.mkdir(parents=True, exist_ok=True)

        tile_idx = 0
        for y in range(0, max(h - tile_size + 1, 1), stride):
            for x in range(0, max(w - tile_size + 1, 1), stride):
                # Extract tile
                tile = img[y:y+tile_size, x:x+tile_size]
                # Pad if needed
                if tile.shape[0] < tile_size or tile.shape[1] < tile_size:
                    padded = np.zeros((tile_size, tile_size), dtype=np.uint8)
                    padded[:tile.shape[0], :tile.shape[1]] = tile
                    tile = padded

                # Preprocess: CLAHE + denoise + normalize
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                tile = clahe.apply(tile)
                tile = cv2.fastNlMeansDenoising(tile, h=10)
                tile = cv2.normalize(tile, None, 0, 255, cv2.NORM_MINMAX)

                # Save tile
                tile_filename = f"frame{frame.id}_tile{tile_idx}.png"
                tile_path = str(tile_dir / tile_filename)
                cv2.imwrite(tile_path, tile)

                # Register in DB
                db_tile = SurveyTile(
                    frame_id=frame.id, survey_id=survey_id, tile_index=tile_idx,
                    x_offset=x, y_offset=y, width=tile_size, height=tile_size,
                    tile_path=tile_path,
                    original_coordinates=json.dumps({"x": x, "y": y, "w": tile_size, "h": tile_size,
                                                     "source_w": w, "source_h": h}),
                )
                db.add(db_tile)
                db.flush()
                tiles.append(db_tile)
                tile_idx += 1

        # Handle single-tile case for small images
        if not tiles:
            tile = img.copy()
            if tile.shape[0] < tile_size or tile.shape[1] < tile_size:
                padded = np.zeros((tile_size, tile_size), dtype=np.uint8)
                padded[:tile.shape[0], :tile.shape[1]] = tile
                tile = padded
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            tile = clahe.apply(tile)
            tile = cv2.fastNlMeansDenoising(tile, h=10)
            tile = cv2.normalize(tile, None, 0, 255, cv2.NORM_MINMAX)
            tile_filename = f"frame{frame.id}_tile0.png"
            tile_path = str(tile_dir / tile_filename)
            cv2.imwrite(tile_path, tile)
            db_tile = SurveyTile(frame_id=frame.id, survey_id=survey_id, tile_index=0,
                                 x_offset=0, y_offset=0, width=w, height=h, tile_path=tile_path,
                                 original_coordinates=json.dumps({"x": 0, "y": 0, "w": w, "h": h}))
            db.add(db_tile)
            db.flush()
            tiles.append(db_tile)

        db.commit()
        return tiles

    def _run_detection(self, tiles: list, model_id: int, inf_run_id: int, db) -> list:
        """Run object detection on tiles using contour-based heuristic (DEMO)."""
        import cv2
        import numpy as np

        detections = []
        for tile in tiles:
            try:
                img = cv2.imread(tile.tile_path, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue

                # Simple contour-based detection: find bright regions (SSS objects appear bright)
                _, thresh = cv2.threshold(img, 180, 255, cv2.THRESH_BINARY)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if area < 100 or area > (tile.width * tile.height * 0.5):
                        continue  # Filter noise and too-large regions

                    x, y, w, h = cv2.boundingRect(cnt)
                    # Confidence based on contour properties (DEMO heuristic, not real ML confidence)
                    aspect = max(w, h) / (min(w, h) + 1e-6)
                    solidity = area / (cv2.contourArea(cv2.convexHull(cnt)) + 1e-6)
                    confidence = min(0.95, 0.3 + solidity * 0.3 + (1.0 / (aspect + 1)) * 0.2 + min(area / 5000, 0.2))

                    if confidence < settings.DETECTION_CONFIDENCE_THRESHOLD:
                        continue

                    # Classify based on shape heuristics (DEMO only)
                    if aspect > 3:
                        class_name = "Potential Net-like Structure"
                    elif area > 2000:
                        class_name = "Potential Debris"
                    elif solidity > 0.8:
                        class_name = "Unknown Object"
                    else:
                        class_name = "Potential Anomaly"

                    det = Detection(
                        inference_run_id=inf_run_id, tile_id=tile.id,
                        class_name=class_name, confidence=round(confidence, 3),
                        bbox_x1=float(x), bbox_y1=float(y),
                        bbox_x2=float(x + w), bbox_y2=float(y + h),
                        model_version_id=model_id,
                        original_coordinates_json=json.dumps({
                            "tile_x": x, "tile_y": y, "tile_w": w, "tile_h": h,
                            "tile_offset_x": tile.x_offset, "tile_offset_y": tile.y_offset,
                            "original_x": tile.x_offset + x, "original_y": tile.y_offset + y,
                        }),
                    )
                    db.add(det)
                    detections.append(det)
            except Exception:
                continue

        db.commit()
        return detections

    def _run_anomaly_analysis(self, tiles: list, inf_run_id: int, db) -> list:
        """Run anomaly analysis on tiles using reconstruction error heuristic (DEMO)."""
        import cv2
        import numpy as np

        anomalies = []
        threshold = settings.ANOMALY_THRESHOLD

        for tile in tiles:
            try:
                img = cv2.imread(tile.tile_path, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue

                # Compute anomaly score based on local variance and texture complexity
                # This is a DEMO heuristic - a real system would use a trained autoencoder
                local_std = cv2.GaussianBlur(img.astype(float), (0, 0), 30)
                diff = np.abs(img.astype(float) - local_std)
                reconstruction_error = float(np.mean(diff) / 255.0)

                # Texture complexity using Laplacian
                laplacian_var = float(cv2.Laplacian(img, cv2.CV_64F).var() / 10000)
                anomaly_score = min(1.0, reconstruction_error * 0.6 + laplacian_var * 0.4)

                is_anomaly = anomaly_score > threshold

                anom = Anomaly(
                    inference_run_id=inf_run_id, tile_id=tile.id,
                    reconstruction_error=round(reconstruction_error, 4),
                    anomaly_score=round(anomaly_score, 4),
                    threshold=threshold, is_anomaly=is_anomaly,
                    evidence_json=json.dumps({
                        "method": "DEMO_HEURISTIC - local variance + Laplacian texture",
                        "reconstruction_error": round(reconstruction_error, 4),
                        "texture_complexity": round(laplacian_var, 4),
                        "note": "PRECOMPUTED DEMO - Not a trained autoencoder"
                    }),
                )
                db.add(anom)
                if is_anomaly:
                    anomalies.append(anom)
            except Exception:
                continue

        db.commit()
        return anomalies

    def _generate_candidates(self, survey_id, detections, anomalies, tiles, db) -> list:
        """Generate candidates from detections and anomalies, with deduplication."""
        candidates = []
        used_regions = []

        # From detections
        for det in detections:
            # Check for spatial overlap with existing candidates (IoU-based dedup)
            bbox = (det.bbox_x1 + (det.tile.x_offset if det.tile else 0),
                    det.bbox_y1 + (det.tile.y_offset if det.tile else 0),
                    det.bbox_x2 + (det.tile.x_offset if det.tile else 0),
                    det.bbox_y2 + (det.tile.y_offset if det.tile else 0))

            is_duplicate = False
            for existing_bbox in used_regions:
                if self._compute_iou(bbox, existing_bbox) > 0.3:
                    is_duplicate = True
                    break

            if is_duplicate:
                continue

            used_regions.append(bbox)
            candidate = Candidate(
                survey_id=survey_id, candidate_type="DETECTION",
                object_class=det.class_name, confidence=det.confidence,
                priority_score=0.0, priority_category="LOW", status="PENDING",
                source_detections_json=json.dumps([det.id]),
                source_tiles_json=json.dumps([det.tile_id]),
                survey_coordinates_json=json.dumps({"x1": bbox[0], "y1": bbox[1], "x2": bbox[2], "y2": bbox[3]}),
            )
            db.add(candidate)
            db.flush()
            det.candidate_id = candidate.id
            candidates.append(candidate)

        # From anomalies (only those not already covered by detections)
        for anom in anomalies:
            tile = anom.tile if hasattr(anom, 'tile') and anom.tile else db.query(SurveyTile).filter(SurveyTile.id == anom.tile_id).first()
            if not tile:
                continue
            center_x = tile.x_offset + tile.width // 2
            center_y = tile.y_offset + tile.height // 2
            bbox = (center_x - 50, center_y - 50, center_x + 50, center_y + 50)

            is_duplicate = False
            for existing_bbox in used_regions:
                if self._compute_iou(bbox, existing_bbox) > 0.2:
                    is_duplicate = True
                    break

            if is_duplicate:
                continue

            used_regions.append(bbox)
            candidate = Candidate(
                survey_id=survey_id, candidate_type="ANOMALY",
                object_class="Unknown Anomaly", anomaly_score=anom.anomaly_score,
                priority_score=0.0, priority_category="LOW", status="PENDING",
                source_tiles_json=json.dumps([anom.tile_id]),
                survey_coordinates_json=json.dumps({"x1": bbox[0], "y1": bbox[1], "x2": bbox[2], "y2": bbox[3]}),
            )
            db.add(candidate)
            db.flush()
            anom.candidate_id = candidate.id
            candidates.append(candidate)

        db.commit()
        return candidates

    def _rank_candidates(self, candidates: list, db):
        """Rank candidates using the priority engine."""
        # Priority formula (documented per spec Section 33):
        # priority = w1*anomaly + w2*confidence + w3*type_weight + w4*uncertainty
        # Weights: anomaly=0.35, confidence=0.25, type=0.20, uncertainty=0.20
        type_weights = {
            "Fishing Gear": 0.9, "Ghost Net Candidate": 0.95,
            "Potential Net-like Structure": 0.85, "Metal Debris": 0.8,
            "Potential Debris": 0.75, "Container": 0.7,
            "Unknown Object": 0.6, "Unknown Anomaly": 0.65,
            "Potential Anomaly": 0.55, "Natural Feature": 0.2,
        }

        for c in candidates:
            anomaly_val = c.anomaly_score or 0.0
            conf_val = c.confidence or 0.0
            type_val = type_weights.get(c.object_class or "", 0.5)
            # Uncertainty: higher when confidence is moderate (neither very high nor very low)
            uncertainty = 1.0 - abs(conf_val - 0.5) * 2 if conf_val else 0.5

            priority = (0.35 * anomaly_val + 0.25 * conf_val +
                       0.20 * type_val + 0.20 * uncertainty)
            priority = min(1.0, max(0.0, priority))

            c.priority_score = round(priority, 4)
            if priority > 0.8:
                c.priority_category = "CRITICAL"
            elif priority > 0.6:
                c.priority_category = "HIGH"
            elif priority > 0.4:
                c.priority_category = "MEDIUM"
            else:
                c.priority_category = "LOW"

            # Generate explanation
            explanation = []
            if anomaly_val > 0:
                explanation.append(f"Anomaly score: {anomaly_val:.2f}")
            if conf_val > 0:
                explanation.append(f"Detection confidence: {conf_val:.2f}")
            explanation.append(f"Object type '{c.object_class}' weight: {type_val:.2f}")
            explanation.append(f"Uncertainty factor: {uncertainty:.2f}")
            explanation.append(f"Priority: {c.priority_category} ({c.priority_score:.3f})")
            c.explanation_json = json.dumps(explanation)

        db.commit()

    def _compute_iou(self, box1, box2) -> float:
        """Compute Intersection over Union for two bounding boxes."""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - intersection
        return intersection / union if union > 0 else 0

    def _log(self, job: ProcessingJob, message: str, db):
        """Add a log entry to the processing job."""
        entries = json.loads(job.log_entries) if job.log_entries else []
        entries.append({"time": datetime.utcnow().isoformat(), "message": message})
        job.log_entries = json.dumps(entries)
        db.commit()

    def _fail(self, job, survey, message, db):
        """Mark job and survey as failed."""
        if job:
            job.status = "FAILED"
            job.error_message = message
            job.completed_at = datetime.utcnow()
            self._log(job, f"FAILED: {message}", db)
        if survey:
            survey.status = "FAILED"
        db.commit()
