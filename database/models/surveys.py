"""Survey-related models: surveys, files, frames, tiles, locations."""
import datetime
import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.models.base import Base, TimestampMixin


class SonarModality(str, enum.Enum):
    SSS = "SSS"
    FLS = "FLS"
    SAS = "SAS"
    OTHER = "OTHER"


class SurveyStatus(str, enum.Enum):
    CREATED = "CREATED"
    INGESTING = "INGESTING"
    PROCESSING = "PROCESSING"
    REVIEW_READY = "REVIEW_READY"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    ARCHIVED = "ARCHIVED"


class LocationQuality(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNAVAILABLE = "UNAVAILABLE"


class Survey(Base, TimestampMixin):
    __tablename__ = "surveys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    operator_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    date: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    area_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vessel_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sonar_device: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sonar_modality: Mapped[str] = mapped_column(String(10), default=SonarModality.SSS.value, nullable=False)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    depth_range_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    depth_range_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=SurveyStatus.CREATED.value, nullable=False)
    total_files: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_frames: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_frames: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_frames: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    operator = relationship("User", back_populates="surveys")
    files = relationship("SurveyFile", back_populates="survey", cascade="all, delete-orphan")
    frames = relationship("SurveyFrame", back_populates="survey", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="survey", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="survey", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="survey", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Survey(id={self.id}, name='{self.name}', status='{self.status}')>"


class SurveyFile(Base, TimestampMixin):
    __tablename__ = "survey_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sonar_modality: Mapped[str] = mapped_column(String(10), default=SonarModality.SSS.value, nullable=False)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON stored as text for SQLite compat

    # Relationships
    survey = relationship("Survey", back_populates="files")
    frames = relationship("SurveyFrame", back_populates="source_file_obj", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SurveyFile(id={self.id}, filename='{self.original_filename}')>"


class SurveyFrame(Base):
    __tablename__ = "survey_frames"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    file_id: Mapped[int] = mapped_column(Integer, ForeignKey("survey_files.id"), nullable=False)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    source_file: Mapped[str] = mapped_column(String(500), nullable=False)
    frame_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    survey = relationship("Survey", back_populates="frames")
    source_file_obj = relationship("SurveyFile", back_populates="frames")
    tiles = relationship("SurveyTile", back_populates="frame", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SurveyFrame(id={self.id}, survey_id={self.survey_id}, seq={self.sequence_index})>"


class SurveyTile(Base):
    __tablename__ = "survey_tiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    frame_id: Mapped[int] = mapped_column(Integer, ForeignKey("survey_frames.id"), nullable=False)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    tile_index: Mapped[int] = mapped_column(Integer, nullable=False)
    x_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    y_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    tile_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    original_coordinates: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    frame = relationship("SurveyFrame", back_populates="tiles")
    detections = relationship("Detection", back_populates="tile", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="tile", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SurveyTile(id={self.id}, frame_id={self.frame_id}, idx={self.tile_index})>"


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    candidate_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    depth: Mapped[float | None] = mapped_column(Float, nullable=True)
    crs: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quality: Mapped[str] = mapped_column(String(20), default=LocationQuality.UNAVAILABLE.value, nullable=False)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    survey = relationship("Survey", back_populates="locations")
    candidate = relationship("Candidate", back_populates="location")

    def __repr__(self):
        return f"<Location(id={self.id}, lat={self.latitude}, lon={self.longitude}, quality='{self.quality}')>"
