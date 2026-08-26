"""Review queue and human-in-the-loop endpoints."""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models.users import User
from database.models.ai import Candidate
from database.models.review import ReviewSession, Correction
from database.models.reports import AuditLog, Notification
from services.api.dependencies import get_current_user
from services.api.schemas import (
    ReviewActionRequest, ReviewSessionCreate, ReviewSessionResponse,
    CorrectionResponse, ReviewStatsResponse, CandidateResponse, CandidateListResponse,
)

router = APIRouter(prefix="/review", tags=["Review"])


@router.get("/queue", response_model=CandidateListResponse)
def get_review_queue(survey_id: int | None = None, priority: str | None = None,
                     status: str | None = None, sort_by: str = "priority",
                     db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get the review queue sorted by priority."""
    q = db.query(Candidate)
    if survey_id:
        q = q.filter(Candidate.survey_id == survey_id)
    if priority:
        q = q.filter(Candidate.priority_category == priority)
    if status:
        q = q.filter(Candidate.status == status)
    else:
        q = q.filter(Candidate.status.in_(["PENDING", "UNDER_REVIEW", "UNCERTAIN"]))

    if sort_by == "anomaly":
        q = q.order_by(Candidate.anomaly_score.desc().nullslast())
    elif sort_by == "confidence":
        q = q.order_by(Candidate.confidence.asc().nullslast())
    else:
        q = q.order_by(Candidate.priority_score.desc())

    candidates = q.all()
    return CandidateListResponse(
        candidates=[CandidateResponse.model_validate(c) for c in candidates],
        total=len(candidates),
    )


@router.post("/sessions", response_model=ReviewSessionResponse)
def start_review_session(data: ReviewSessionCreate, db: Session = Depends(get_db),
                         user: User = Depends(get_current_user)):
    """Start a new review session."""
    session = ReviewSession(reviewer_id=user.id, survey_id=data.survey_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    db.add(AuditLog(user_id=user.id, action="START_REVIEW_SESSION", entity_type="review_session",
                    entity_id=str(session.id)))
    db.commit()
    return ReviewSessionResponse.model_validate(session)


@router.put("/sessions/{session_id}", response_model=ReviewSessionResponse)
def end_review_session(session_id: int, db: Session = Depends(get_db),
                       user: User = Depends(get_current_user)):
    """End a review session."""
    session = db.query(ReviewSession).filter(ReviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Review session not found")
    session.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return ReviewSessionResponse.model_validate(session)


@router.post("/candidates/{candidate_id}/action", response_model=CorrectionResponse)
def review_candidate(candidate_id: int, data: ReviewActionRequest,
                     session_id: int | None = None,
                     db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Perform a review action on a candidate."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    valid_actions = ["ACCEPT", "REJECT", "CORRECT", "UNCERTAIN", "NATURAL_FEATURE",
                     "POTENTIAL_DEBRIS", "POTENTIAL_GEAR", "ADD_NOTE"]
    if data.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")

    # Map action to new status
    status_map = {
        "ACCEPT": "ACCEPTED", "REJECT": "REJECTED", "CORRECT": "CORRECTED",
        "UNCERTAIN": "UNCERTAIN", "NATURAL_FEATURE": "REJECTED",
        "POTENTIAL_DEBRIS": "ACCEPTED", "POTENTIAL_GEAR": "ACCEPTED",
        "ADD_NOTE": candidate.status,
    }

    original_status = candidate.status
    new_status = status_map.get(data.action, candidate.status)

    # Create correction record
    correction = Correction(
        candidate_id=candidate_id, reviewer_id=user.id,
        review_session_id=session_id, action=data.action,
        original_prediction=candidate.object_class,
        reviewed_label=data.reviewed_label,
        original_status=original_status, new_status=new_status,
        reason=data.reason, notes=data.notes,
    )
    db.add(correction)

    # Update candidate status
    candidate.status = new_status
    if data.reviewed_label and data.action == "CORRECT":
        candidate.object_class = data.reviewed_label

    # Update review session if provided
    if session_id:
        session = db.query(ReviewSession).filter(ReviewSession.id == session_id).first()
        if session:
            session.candidates_reviewed += 1
            if data.action == "ACCEPT" or data.action in ("POTENTIAL_DEBRIS", "POTENTIAL_GEAR"):
                session.accepted += 1
            elif data.action == "REJECT" or data.action == "NATURAL_FEATURE":
                session.rejected += 1
            elif data.action == "CORRECT":
                session.corrected += 1
            elif data.action == "UNCERTAIN":
                session.uncertain += 1

    db.commit()
    db.refresh(correction)

    db.add(AuditLog(user_id=user.id, action=f"REVIEW_{data.action}", entity_type="candidate",
                    entity_id=str(candidate_id),
                    details_json=json.dumps({"action": data.action, "old_status": original_status,
                                             "new_status": new_status, "label": data.reviewed_label})))
    db.commit()

    return CorrectionResponse.model_validate(correction)


@router.get("/candidates/{candidate_id}/history", response_model=list[CorrectionResponse])
def get_candidate_history(candidate_id: int, db: Session = Depends(get_db),
                          user: User = Depends(get_current_user)):
    """Get review history for a candidate."""
    corrections = db.query(Correction).filter(Correction.candidate_id == candidate_id)\
        .order_by(Correction.created_at.desc()).all()
    return [CorrectionResponse.model_validate(c) for c in corrections]


@router.get("/stats", response_model=ReviewStatsResponse)
def get_review_stats(survey_id: int | None = None, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    """Get review statistics."""
    q = db.query(Candidate)
    if survey_id:
        q = q.filter(Candidate.survey_id == survey_id)
    total = q.count()
    pending = q.filter(Candidate.status.in_(["PENDING", "UNDER_REVIEW"])).count()
    accepted = q.filter(Candidate.status == "ACCEPTED").count()
    rejected = q.filter(Candidate.status == "REJECTED").count()
    corrected = q.filter(Candidate.status == "CORRECTED").count()
    uncertain = q.filter(Candidate.status == "UNCERTAIN").count()
    reviewed = accepted + rejected + corrected + uncertain
    pct = (reviewed / total * 100) if total > 0 else 0.0
    return ReviewStatsResponse(
        total_candidates=total, reviewed=reviewed, pending=total - reviewed,
        accepted=accepted, rejected=rejected, corrected=corrected, uncertain=uncertain,
        review_completion_pct=round(pct, 1),
    )
