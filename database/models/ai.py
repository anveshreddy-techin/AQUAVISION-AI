"""AI-related models: debris categories, detections, anomalies, candidates, evidence."""
import datetime
import enum
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.models.base import Base, TimestampMixin


class CandidateType(str, enum.Enum):
    DETECTION = "DETECTION"
    ANOMALY = "ANOMALY"
    COMBINED = "COMBINED"


class PriorityCategory(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class CandidateStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CORRECTED = "CORRECTED"
    UNCERTAIN = "UNCERTAIN"


class EvidenceType(str, enum.Enum):
    ORIGINAL = "ORIGINAL"
    ENHANCED = "ENHANCED"
    DETECTION = "DETECTION"
    ANOMALY = "ANOMALY"
    TARGET_REGION = "TARGET_REGION"
    SHADOW_REGION = "SHADOW_REGION"
    SEABED_CONTEXT = "SEABED_CONTEXT"


class DebrisCategory(Base, TimestampMixin):
    __tablename__ = "debris_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("debris_categories.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=True)
    inference_run_id: Mapped[int] = mapped_column(Integer, ForeignKey("inference_runs.id"), nullable=False)
    tile_id: Mapped[int] = mapped_column(Integer, ForeignKey("survey_tiles.id"), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_x1: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y1: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_x2: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y2: Mapped[float] = mapped_column(Float, nullable=False)
    original_coordinates_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_version_id: Mapped[int] = mapped_column(Integer, ForeignKey("model_versions.id"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="detections")
    inference_run = relationship("InferenceRun", back_populates="detections")
    tile = relationship("SurveyTile", back_populates="detections")

    def __repr__(self):
        return f"<Detection(id={self.id}, class='{self.class_name}', conf={self.confidence:.2f})>"


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=True)
    inference_run_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("inference_runs.id"), nullable=True)
    tile_id: Mapped[int] = mapped_column(Integer, ForeignKey("survey_tiles.id"), nullable=False)
    reconstruction_error: Mapped[float] = mapped_column(Float, nullable=False)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=False)
    evidence_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_version_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("model_versions.id"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="anomalies")
    inference_run = relationship("InferenceRun", back_populates="anomalies")
    tile = relationship("SurveyTile", back_populates="anomalies")


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    candidate_type: Mapped[str] = mapped_column(String(20), default=CandidateType.DETECTION.value, nullable=False)
    object_class: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    anomaly_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    priority_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    priority_category: Mapped[str] = mapped_column(String(10), default=PriorityCategory.LOW.value, nullable=False)
    risk: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=CandidateStatus.PENDING.value, nullable=False)
    source_detections_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_tiles_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_frames_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    survey_coordinates_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    evidence_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    explanation_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # Priority explanation

    # Relationships
    survey = relationship("Survey", back_populates="candidates")
    detections = relationship("Detection", back_populates="candidate")
    anomalies = relationship("Anomaly", back_populates="candidate")
    evidence = relationship("CandidateEvidence", back_populates="candidate", cascade="all, delete-orphan")
    corrections = relationship("Correction", back_populates="candidate", cascade="all, delete-orphan")
    location = relationship("Location", back_populates="candidate", uselist=False)

    def __repr__(self):
        return f"<Candidate(id={self.id}, type='{self.candidate_type}', priority='{self.priority_category}', status='{self.status}')>"


class CandidateEvidence(Base):
    __tablename__ = "candidate_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="evidence")
