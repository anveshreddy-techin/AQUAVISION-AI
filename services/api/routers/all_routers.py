"""Candidates, analytics, health, maps, reports, models, datasets, processing, notifications, audit routers."""
from datetime import datetime
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.connection import get_db
from database.models.users import User
from database.models.surveys import Survey, SurveyFrame, Location
from database.models.processing import ProcessingJob, ModelVersion, InferenceRun, Dataset
from database.models.ai import Candidate, CandidateEvidence, Detection, Anomaly
from database.models.review import Correction
from database.models.reports import Report, AuditLog, Notification, BenchmarkRun
from services.api.dependencies import get_current_user, require_admin
from services.api.schemas import *

# === CANDIDATES ===
candidates_router = APIRouter(prefix="/candidates", tags=["Candidates"])

@candidates_router.get("", response_model=CandidateListResponse)
def list_candidates(survey_id: int | None = None, priority: str | None = None,
                    status: str | None = None, object_class: str | None = None,
                    db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Candidate)
    if survey_id: q = q.filter(Candidate.survey_id == survey_id)
    if priority: q = q.filter(Candidate.priority_category == priority)
    if status: q = q.filter(Candidate.status == status)
    if object_class: q = q.filter(Candidate.object_class == object_class)
    candidates = q.order_by(Candidate.priority_score.desc()).all()
    return CandidateListResponse(candidates=[CandidateResponse.model_validate(c) for c in candidates], total=len(candidates))

@candidates_router.get("/{candidate_id}", response_model=CandidateDetailResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c: raise HTTPException(status_code=404, detail="Candidate not found")
    return CandidateDetailResponse.model_validate(c)

@candidates_router.get("/{candidate_id}/evidence", response_model=list[EvidenceResponse])
def get_evidence(candidate_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    evidence = db.query(CandidateEvidence).filter(CandidateEvidence.candidate_id == candidate_id).all()
    return [EvidenceResponse.model_validate(e) for e in evidence]

@candidates_router.get("/{candidate_id}/provenance")
def get_provenance(candidate_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c: raise HTTPException(status_code=404, detail="Candidate not found")
    survey = db.query(Survey).filter(Survey.id == c.survey_id).first()
    detections = db.query(Detection).filter(Detection.candidate_id == candidate_id).all()
    model_ids = set(d.model_version_id for d in detections)
    models = db.query(ModelVersion).filter(ModelVersion.id.in_(model_ids)).all() if model_ids else []
    corrections = db.query(Correction).filter(Correction.candidate_id == candidate_id).all()
    return {
        "candidate_id": candidate_id, "survey": {"id": survey.id, "name": survey.name, "modality": survey.sonar_modality} if survey else None,
        "models": [{"name": m.name, "version": m.version, "modality": m.modality, "status": m.status} for m in models],
        "detections_count": len(detections),
        "review_history": [{"action": c.action, "reviewer_id": c.reviewer_id, "created_at": str(c.created_at)} for c in corrections],
    }


# === ANALYTICS ===
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

@analytics_router.get("/overview", response_model=OverviewResponse)
def get_overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    active_surveys = db.query(Survey).filter(Survey.status.in_(["CREATED", "INGESTING", "PROCESSING", "REVIEW_READY"])).count()
    total_frames = db.query(func.sum(Survey.total_frames)).scalar() or 0
    frames_screened = db.query(func.sum(Survey.processed_frames)).scalar() or 0
    total_candidates = db.query(Candidate).count()
    high_priority = db.query(Candidate).filter(Candidate.priority_category.in_(["CRITICAL", "HIGH"])).count()
    total_anomalies = db.query(Anomaly).filter(Anomaly.is_anomaly == True).count()
    pending = db.query(Candidate).filter(Candidate.status.in_(["PENDING", "UNDER_REVIEW"])).count()
    completed = db.query(Candidate).filter(Candidate.status.in_(["ACCEPTED", "REJECTED", "CORRECTED"])).count()
    return OverviewResponse(active_surveys=active_surveys, total_frames=total_frames, frames_screened=frames_screened,
                            total_candidates=total_candidates, high_priority_candidates=high_priority,
                            total_anomalies=total_anomalies, pending_reviews=pending, completed_reviews=completed)

@analytics_router.get("/candidates")
def candidate_analytics(survey_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Candidate)
    if survey_id: q = q.filter(Candidate.survey_id == survey_id)
    candidates = q.all()
    priority_dist = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    class_dist = {}
    status_dist = {}
    for c in candidates:
        priority_dist[c.priority_category] = priority_dist.get(c.priority_category, 0) + 1
        cls = c.object_class or "Unknown"
        class_dist[cls] = class_dist.get(cls, 0) + 1
        status_dist[c.status] = status_dist.get(c.status, 0) + 1
    return {"total": len(candidates), "priority_distribution": priority_dist,
            "class_distribution": class_dist, "status_distribution": status_dist}

@analytics_router.get("/reviews")
def review_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total = db.query(Candidate).count()
    accepted = db.query(Candidate).filter(Candidate.status == "ACCEPTED").count()
    rejected = db.query(Candidate).filter(Candidate.status == "REJECTED").count()
    corrected = db.query(Candidate).filter(Candidate.status == "CORRECTED").count()
    uncertain = db.query(Candidate).filter(Candidate.status == "UNCERTAIN").count()
    reviewed = accepted + rejected + corrected + uncertain
    return {"total_candidates": total, "reviewed": reviewed, "pending": total - reviewed,
            "accepted": accepted, "rejected": rejected, "corrected": corrected, "uncertain": uncertain,
            "completion_pct": round(reviewed / total * 100, 1) if total > 0 else 0}

@analytics_router.get("/processing")
def processing_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    jobs = db.query(ProcessingJob).all()
    total = len(jobs)
    completed = sum(1 for j in jobs if j.status == "COMPLETED")
    failed = sum(1 for j in jobs if j.status == "FAILED")
    return {"total_jobs": total, "completed": completed, "failed": failed, "running": total - completed - failed}


# === HEALTH ===
health_router = APIRouter(prefix="/health", tags=["Health"])

@health_router.get("")
def health_check():
    return {"status": "healthy", "service": "AquaVision AI API", "version": "0.1.0"}

@health_router.get("/db")
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1" if hasattr(db, 'execute') else db.connection())
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "error", "detail": str(e)}

@health_router.get("/ml")
def health_ml():
    try:
        import cv2
        import numpy as np
        return {"status": "healthy", "opencv": cv2.__version__, "numpy": np.__version__, "device": "cpu"}
    except Exception as e:
        return {"status": "degraded", "detail": str(e)}

@health_router.get("/storage")
def health_storage():
    from services.api.config import settings
    dirs_ok = all(d.exists() for d in [settings.ORIGINALS_DIR, settings.PROCESSED_DIR, settings.EVIDENCE_DIR, settings.REPORTS_DIR])
    return {"status": "healthy" if dirs_ok else "unhealthy", "storage_root": str(settings.STORAGE_ROOT)}


# === MAP ===
maps_router = APIRouter(prefix="/maps", tags=["Maps"])

@maps_router.get("/survey/{survey_id}/candidates")
def get_map_candidates(survey_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    candidates = db.query(Candidate).filter(Candidate.survey_id == survey_id).all()
    features = []
    for c in candidates:
        loc = db.query(Location).filter(Location.candidate_id == c.id).first()
        lat, lon = (loc.latitude, loc.longitude) if loc and loc.latitude else (None, None)
        features.append({
            "type": "Feature",
            "properties": {"id": c.id, "priority": c.priority_category, "class": c.object_class,
                          "confidence": c.confidence, "status": c.status, "anomaly_score": c.anomaly_score},
            "geometry": {"type": "Point", "coordinates": [lon, lat]} if lat and lon else None,
        })
    return {"type": "FeatureCollection", "features": features}


# === REPORTS ===
reports_router = APIRouter(prefix="/reports", tags=["Reports"])

@reports_router.post("/generate/{survey_id}", response_model=ReportResponse)
def generate_report(survey_id: int, data: ReportGenerateRequest = None,
                    db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from fastapi import BackgroundTasks
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey: raise HTTPException(status_code=404, detail="Survey not found")
    title = (data.title if data and data.title else f"AquaVision AI Report - {survey.name}")
    report_type = data.report_type if data else "FULL_REPORT"
    report = Report(survey_id=survey_id, report_type=report_type, title=title,
                    status="QUEUED", generated_by=user.id)
    db.add(report)
    db.commit()
    db.refresh(report)
    # Generate report synchronously for now
    from services.api.engine.report_generator import generate_pdf_report
    try:
        file_path = generate_pdf_report(survey_id, report.id, db)
        report.file_path = file_path
        report.status = "COMPLETED"
        report.completed_at = datetime.utcnow()
    except Exception as e:
        report.status = "FAILED"
        report.file_path = None
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)

@reports_router.get("", response_model=list[ReportResponse])
def list_reports(survey_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Report)
    if survey_id: q = q.filter(Report.survey_id == survey_id)
    return [ReportResponse.model_validate(r) for r in q.order_by(Report.created_at.desc()).all()]

@reports_router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r: raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(r)

@reports_router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from fastapi.responses import FileResponse as FastAPIFileResponse
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r or not r.file_path: raise HTTPException(status_code=404, detail="Report file not found")
    return FastAPIFileResponse(path=r.file_path, filename=f"aquavision_report_{report_id}.pdf", media_type="application/pdf")


# === MODELS ===
models_router = APIRouter(prefix="/models", tags=["AI Models"])

@models_router.get("", response_model=list[ModelVersionResponse])
def list_models(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [ModelVersionResponse.model_validate(m) for m in db.query(ModelVersion).all()]

@models_router.get("/{model_id}", response_model=ModelVersionResponse)
def get_model(model_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = db.query(ModelVersion).filter(ModelVersion.id == model_id).first()
    if not m: raise HTTPException(status_code=404, detail="Model not found")
    return ModelVersionResponse.model_validate(m)


# === DATASETS ===
datasets_router = APIRouter(prefix="/datasets", tags=["Datasets"])

@datasets_router.get("", response_model=list[DatasetResponse])
def list_datasets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [DatasetResponse.model_validate(d) for d in db.query(Dataset).all()]

@datasets_router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    d = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not d: raise HTTPException(status_code=404, detail="Dataset not found")
    return DatasetResponse.model_validate(d)


# === PROCESSING JOBS ===
processing_router = APIRouter(prefix="/processing", tags=["Processing"])

@processing_router.get("/jobs", response_model=list[ProcessingJobResponse])
def list_jobs(survey_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(ProcessingJob)
    if survey_id: q = q.filter(ProcessingJob.survey_id == survey_id)
    return [ProcessingJobResponse.model_validate(j) for j in q.order_by(ProcessingJob.created_at.desc()).all()]

@processing_router.get("/jobs/{job_id}", response_model=ProcessingJobResponse)
def get_job(job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    j = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not j: raise HTTPException(status_code=404, detail="Job not found")
    return ProcessingJobResponse.model_validate(j)

@processing_router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    j = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not j: raise HTTPException(status_code=404, detail="Job not found")
    j.status = "CANCELLED"
    db.commit()
    return {"success": True, "message": "Job cancelled"}


# === NOTIFICATIONS ===
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])

@notifications_router.get("", response_model=list[NotificationResponse])
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [NotificationResponse.model_validate(n) for n in
            db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50).all()]

@notifications_router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if n: n.is_read = True; db.commit()
    return {"success": True}

@notifications_router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"success": True}


# === AUDIT ===
audit_router = APIRouter(prefix="/audit", tags=["Audit"])

@audit_router.get("/logs", response_model=list[AuditLogResponse])
def list_audit_logs(entity_type: str | None = None, limit: int = 100,
                    db: Session = Depends(get_db), user: User = Depends(require_admin)):
    q = db.query(AuditLog)
    if entity_type: q = q.filter(AuditLog.entity_type == entity_type)
    return [AuditLogResponse.model_validate(a) for a in q.order_by(AuditLog.created_at.desc()).limit(limit).all()]


# === USERS (admin) ===
users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), user: User = Depends(require_admin)):
    from database.models.users import User as UserModel
    return [UserResponse.model_validate(u) for u in db.query(UserModel).all()]
