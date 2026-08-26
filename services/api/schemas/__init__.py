"""Pydantic schemas for API request/response models."""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Any


# === Common ===
class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "OK"

class ErrorResponse(BaseModel):
    success: bool = False
    detail: str

class PaginatedResponse(BaseModel):
    items: list[Any] = []
    total: int = 0
    page: int = 1
    per_page: int = 20


# === Auth ===
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    role: str = "researcher"
    organization: str | None = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    organization: str | None
    is_active: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True


# === Surveys ===
class SurveyCreate(BaseModel):
    name: str
    description: str | None = None
    area_name: str | None = None
    vessel_name: str | None = None
    sonar_device: str | None = None
    sonar_modality: str = "SSS"
    frequency: str | None = None
    depth_range_min: float | None = None
    depth_range_max: float | None = None
    gps_available: bool = False

class SurveyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    area_name: str | None = None
    status: str | None = None

class SurveyResponse(BaseModel):
    id: int
    name: str
    description: str | None
    operator_id: int
    date: datetime | None
    area_name: str | None
    vessel_name: str | None
    sonar_device: str | None
    sonar_modality: str
    frequency: str | None
    depth_range_min: float | None
    depth_range_max: float | None
    gps_available: bool
    status: str
    total_files: int
    total_frames: int
    processed_frames: int
    failed_frames: int
    is_demo: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class SurveyListResponse(BaseModel):
    surveys: list[SurveyResponse] = []
    total: int = 0

class FileResponse(BaseModel):
    id: int
    survey_id: int
    original_filename: str
    file_hash: str
    file_size: int
    mime_type: str | None
    width: int | None
    height: int | None
    sonar_modality: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True

class FrameResponse(BaseModel):
    id: int
    survey_id: int
    file_id: int
    sequence_index: int
    frame_path: str
    width: int | None
    height: int | None

    class Config:
        from_attributes = True

class TileResponse(BaseModel):
    id: int
    frame_id: int
    survey_id: int
    tile_index: int
    x_offset: int
    y_offset: int
    width: int
    height: int
    tile_path: str

    class Config:
        from_attributes = True


# === Candidates ===
class CandidateResponse(BaseModel):
    id: int
    survey_id: int
    candidate_type: str
    object_class: str | None
    confidence: float | None
    anomaly_score: float | None
    priority_score: float
    priority_category: str
    risk: str | None
    status: str
    thumbnail_path: str | None
    explanation_json: str | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True

class CandidateDetailResponse(CandidateResponse):
    source_detections_json: str | None
    source_tiles_json: str | None
    source_frames_json: str | None
    survey_coordinates_json: str | None
    evidence_path: str | None

class CandidateListResponse(BaseModel):
    candidates: list[CandidateResponse] = []
    total: int = 0

class EvidenceResponse(BaseModel):
    id: int
    candidate_id: int
    evidence_type: str
    file_path: str
    metadata_json: str | None

    class Config:
        from_attributes = True


# === Review ===
class ReviewActionRequest(BaseModel):
    action: str  # ACCEPT, REJECT, CORRECT, etc.
    reviewed_label: str | None = None
    reason: str | None = None
    notes: str | None = None

class ReviewSessionCreate(BaseModel):
    survey_id: int

class ReviewSessionResponse(BaseModel):
    id: int
    reviewer_id: int
    survey_id: int
    started_at: datetime
    ended_at: datetime | None
    candidates_reviewed: int
    accepted: int
    rejected: int
    corrected: int
    uncertain: int

    class Config:
        from_attributes = True

class CorrectionResponse(BaseModel):
    id: int
    candidate_id: int
    reviewer_id: int
    action: str
    original_prediction: str | None
    reviewed_label: str | None
    original_status: str
    new_status: str
    reason: str | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewStatsResponse(BaseModel):
    total_candidates: int = 0
    reviewed: int = 0
    pending: int = 0
    accepted: int = 0
    rejected: int = 0
    corrected: int = 0
    uncertain: int = 0
    review_completion_pct: float = 0.0


# === Processing ===
class ProcessingJobResponse(BaseModel):
    id: int
    survey_id: int
    job_type: str
    status: str
    total_items: int
    processed_items: int
    failed_items: int
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


# === Reports ===
class ReportGenerateRequest(BaseModel):
    report_type: str = "FULL_REPORT"
    title: str | None = None

class ReportResponse(BaseModel):
    id: int
    survey_id: int
    report_type: str
    title: str
    file_path: str | None
    status: str
    model_version_info: str | None
    created_at: datetime | None = None
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


# === Analytics ===
class OverviewResponse(BaseModel):
    active_surveys: int = 0
    total_frames: int = 0
    frames_screened: int = 0
    total_candidates: int = 0
    high_priority_candidates: int = 0
    total_anomalies: int = 0
    pending_reviews: int = 0
    completed_reviews: int = 0


# === Models ===
class ModelVersionResponse(BaseModel):
    id: int
    name: str
    version: str
    task: str
    modality: str
    classes_json: str | None
    status: str
    inference_time_ms: float | None
    metrics_json: str | None
    description: str | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


# === Datasets ===
class DatasetResponse(BaseModel):
    id: int
    name: str
    source: str
    url: str | None
    modality: str
    license: str | None
    version: str | None
    download_status: str
    task_type: str | None
    image_count: int | None
    limitations: str | None
    sss_model_eligible: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True


# === Notifications ===
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    entity_type: str | None
    entity_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# === Audit ===
class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity_type: str
    entity_id: str | None
    details_json: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# === Map ===
class MapCandidateResponse(BaseModel):
    id: int
    latitude: float | None
    longitude: float | None
    priority_category: str
    object_class: str | None
    confidence: float | None
    status: str
    survey_id: int
