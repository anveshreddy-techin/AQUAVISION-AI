"""Survey management endpoints: CRUD, file upload, processing trigger."""
import hashlib
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models.users import User
from database.models.surveys import Survey, SurveyFile, SurveyFrame, SurveyTile
from database.models.processing import ProcessingJob
from database.models.ai import Candidate
from database.models.reports import AuditLog
from services.api.dependencies import get_current_user
from services.api.config import settings
from services.api.schemas import (
    SurveyCreate, SurveyUpdate, SurveyResponse, SurveyListResponse,
    FileResponse, FrameResponse, ProcessingJobResponse, CandidateResponse,
    CandidateListResponse, SuccessResponse,
)

router = APIRouter(prefix="/surveys", tags=["Surveys"])


@router.post("", response_model=SurveyResponse)
def create_survey(data: SurveyCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create a new survey."""
    survey = Survey(
        name=data.name, description=data.description, operator_id=user.id,
        area_name=data.area_name, vessel_name=data.vessel_name,
        sonar_device=data.sonar_device, sonar_modality=data.sonar_modality,
        frequency=data.frequency, depth_range_min=data.depth_range_min,
        depth_range_max=data.depth_range_max, gps_available=data.gps_available,
        date=datetime.utcnow(),
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    db.add(AuditLog(user_id=user.id, action="CREATE_SURVEY", entity_type="survey", entity_id=str(survey.id)))
    db.commit()
    return SurveyResponse.model_validate(survey)


@router.get("", response_model=SurveyListResponse)
def list_surveys(status: str | None = None, modality: str | None = None,
                 db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List all surveys accessible to the user."""
    q = db.query(Survey)
    if user.role != "admin":
        q = q.filter(Survey.operator_id == user.id)
    if status:
        q = q.filter(Survey.status == status)
    if modality:
        q = q.filter(Survey.sonar_modality == modality)
    surveys = q.order_by(Survey.created_at.desc()).all()
    return SurveyListResponse(surveys=[SurveyResponse.model_validate(s) for s in surveys], total=len(surveys))


@router.get("/{survey_id}", response_model=SurveyResponse)
def get_survey(survey_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get survey details."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return SurveyResponse.model_validate(survey)


@router.put("/{survey_id}", response_model=SurveyResponse)
def update_survey(survey_id: int, data: SurveyUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Update survey metadata."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(survey, field, value)
    db.commit()
    db.refresh(survey)
    return SurveyResponse.model_validate(survey)


@router.delete("/{survey_id}", response_model=SuccessResponse)
def delete_survey(survey_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete a survey (admin or owner only)."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if user.role != "admin" and survey.operator_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(survey)
    db.commit()
    return SuccessResponse(message="Survey deleted")


@router.post("/{survey_id}/upload")
def upload_file(survey_id: int, file: UploadFile = File(...),
                db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Upload a single sonar image file to a survey."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    settings.ensure_dirs()
    survey_dir = settings.ORIGINALS_DIR / str(survey_id)
    survey_dir.mkdir(parents=True, exist_ok=True)

    # Read file content and compute hash
    content = file.file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    file_size = len(content)

    # Check file size limit
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    # Save file
    stored_name = f"{file_hash[:12]}_{file.filename}"
    stored_path = survey_dir / stored_name
    with open(stored_path, "wb") as f:
        f.write(content)

    # Try to get image dimensions
    width, height = None, None
    try:
        from PIL import Image
        img = Image.open(stored_path)
        width, height = img.size
    except Exception:
        pass

    # Register file in database
    survey_file = SurveyFile(
        survey_id=survey_id, original_filename=file.filename,
        stored_path=str(stored_path), file_hash=file_hash,
        file_size=file_size, mime_type=file.content_type,
        width=width, height=height, sonar_modality=survey.sonar_modality,
    )
    db.add(survey_file)
    survey.total_files += 1
    db.commit()
    db.refresh(survey_file)

    # Register as frame
    frame_count = db.query(SurveyFrame).filter(SurveyFrame.survey_id == survey_id).count()
    frame = SurveyFrame(
        survey_id=survey_id, file_id=survey_file.id,
        sequence_index=frame_count, source_file=file.filename,
        frame_path=str(stored_path), width=width, height=height,
    )
    db.add(frame)
    survey.total_frames += 1
    db.commit()

    db.add(AuditLog(user_id=user.id, action="UPLOAD_FILE", entity_type="survey_file",
                    entity_id=str(survey_file.id), details_json=json.dumps({"filename": file.filename, "size": file_size})))
    db.commit()

    return {"success": True, "file_id": survey_file.id, "frame_id": frame.id, "filename": file.filename,
            "file_hash": file_hash, "size": file_size, "width": width, "height": height}


@router.post("/{survey_id}/upload-batch")
async def upload_batch(survey_id: int, files: list[UploadFile] = File(...),
                       db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Upload multiple sonar image files to a survey."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    settings.ensure_dirs()
    survey_dir = settings.ORIGINALS_DIR / str(survey_id)
    survey_dir.mkdir(parents=True, exist_ok=True)
    results = []

    for file in files:
        try:
            content = await file.read()
            file_hash = hashlib.sha256(content).hexdigest()
            file_size = len(content)
            stored_name = f"{file_hash[:12]}_{file.filename}"
            stored_path = survey_dir / stored_name
            with open(stored_path, "wb") as f:
                f.write(content)

            width, height = None, None
            try:
                from PIL import Image
                img = Image.open(stored_path)
                width, height = img.size
            except Exception:
                pass

            sf = SurveyFile(
                survey_id=survey_id, original_filename=file.filename,
                stored_path=str(stored_path), file_hash=file_hash,
                file_size=file_size, mime_type=file.content_type,
                width=width, height=height, sonar_modality=survey.sonar_modality,
            )
            db.add(sf)
            survey.total_files += 1
            db.commit()
            db.refresh(sf)

            frame_count = db.query(SurveyFrame).filter(SurveyFrame.survey_id == survey_id).count()
            frame = SurveyFrame(
                survey_id=survey_id, file_id=sf.id,
                sequence_index=frame_count, source_file=file.filename,
                frame_path=str(stored_path), width=width, height=height,
            )
            db.add(frame)
            survey.total_frames += 1
            db.commit()

            results.append({"filename": file.filename, "success": True, "file_id": sf.id})
        except Exception as e:
            results.append({"filename": file.filename, "success": False, "error": str(e)})

    db.commit()
    return {"success": True, "total": len(files), "results": results}


@router.post("/{survey_id}/process", response_model=ProcessingJobResponse)
def start_processing(survey_id: int, background_tasks: BackgroundTasks,
                     db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Trigger survey processing pipeline."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if survey.total_frames == 0:
        raise HTTPException(status_code=400, detail="Survey has no frames to process")

    # Create processing job
    job = ProcessingJob(
        survey_id=survey_id, job_type="survey_processing",
        status="QUEUED", total_items=survey.total_frames,
        config_json=json.dumps({"tile_size": settings.TILE_SIZE, "tile_overlap": settings.TILE_OVERLAP,
                                "batch_size": settings.ML_BATCH_SIZE, "confidence_threshold": settings.DETECTION_CONFIDENCE_THRESHOLD,
                                "anomaly_threshold": settings.ANOMALY_THRESHOLD}),
    )
    db.add(job)
    survey.status = "PROCESSING"
    db.commit()
    db.refresh(job)

    # Run processing in background
    background_tasks.add_task(run_processing_pipeline, survey_id, job.id)

    db.add(AuditLog(user_id=user.id, action="START_PROCESSING", entity_type="processing_job", entity_id=str(job.id)))
    db.commit()
    return ProcessingJobResponse.model_validate(job)


@router.get("/{survey_id}/status")
def get_survey_status(survey_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get survey processing status."""
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    jobs = db.query(ProcessingJob).filter(ProcessingJob.survey_id == survey_id).order_by(ProcessingJob.created_at.desc()).all()
    candidates = db.query(Candidate).filter(Candidate.survey_id == survey_id).count()
    return {
        "survey_id": survey_id, "status": survey.status,
        "total_frames": survey.total_frames, "processed_frames": survey.processed_frames,
        "failed_frames": survey.failed_frames, "candidates": candidates,
        "jobs": [ProcessingJobResponse.model_validate(j) for j in jobs],
    }


@router.get("/{survey_id}/frames", response_model=list[FrameResponse])
def get_frames(survey_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all frames in a survey."""
    frames = db.query(SurveyFrame).filter(SurveyFrame.survey_id == survey_id).order_by(SurveyFrame.sequence_index).all()
    return [FrameResponse.model_validate(f) for f in frames]


@router.get("/{survey_id}/candidates", response_model=CandidateListResponse)
def get_survey_candidates(survey_id: int, priority: str | None = None, status: str | None = None,
                          db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all candidates for a survey."""
    q = db.query(Candidate).filter(Candidate.survey_id == survey_id)
    if priority:
        q = q.filter(Candidate.priority_category == priority)
    if status:
        q = q.filter(Candidate.status == status)
    candidates = q.order_by(Candidate.priority_score.desc()).all()
    return CandidateListResponse(candidates=[CandidateResponse.model_validate(c) for c in candidates], total=len(candidates))


def run_processing_pipeline(survey_id: int, job_id: int):
    """Background task: run the full survey processing pipeline."""
    from services.api.engine.pipeline import SurveyProcessingPipeline
    pipeline = SurveyProcessingPipeline()
    pipeline.process(survey_id, job_id)
