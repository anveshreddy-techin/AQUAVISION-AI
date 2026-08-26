"""Processing, model, inference, and dataset models."""
import datetime
import enum
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.models.base import Base, TimestampMixin


class ProcessingStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PREPROCESSING = "PREPROCESSING"
    DETECTING = "DETECTING"
    ANALYZING = "ANALYZING"
    RANKING = "RANKING"
    REVIEW_READY = "REVIEW_READY"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ModelTask(str, enum.Enum):
    DETECTION = "DETECTION"
    ANOMALY = "ANOMALY"
    SEGMENTATION = "SEGMENTATION"
    CLASSIFICATION = "CLASSIFICATION"


class ModelStatus(str, enum.Enum):
    DEMO = "DEMO"
    EXPERIMENTAL = "EXPERIMENTAL"
    VALIDATED = "VALIDATED"
    RETIRED = "RETIRED"


class DownloadStatus(str, enum.Enum):
    NOT_DOWNLOADED = "NOT_DOWNLOADED"
    DOWNLOADING = "DOWNLOADING"
    DOWNLOADED = "DOWNLOADED"
    FAILED = "FAILED"
    UNAVAILABLE = "UNAVAILABLE"


class ProcessingJob(Base, TimestampMixin):
    __tablename__ = "processing_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    job_type: Mapped[str] = mapped_column(String(50), nullable=False, default="survey_processing")
    status: Mapped[str] = mapped_column(String(20), default=ProcessingStatus.QUEUED.value, nullable=False)
    total_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON as text
    log_entries: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of log lines

    # Relationships
    survey = relationship("Survey", back_populates="processing_jobs")
    inference_runs = relationship("InferenceRun", back_populates="processing_job")

    def __repr__(self):
        return f"<ProcessingJob(id={self.id}, survey_id={self.survey_id}, status='{self.status}')>"


class ModelVersion(Base, TimestampMixin):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    task: Mapped[str] = mapped_column(String(20), nullable=False)
    modality: Mapped[str] = mapped_column(String(10), nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("datasets.id"), nullable=True)
    classes_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list of class names
    checkpoint_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON metrics dict
    status: Mapped[str] = mapped_column(String(20), default=ModelStatus.DEMO.value, nullable=False)
    inference_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="model_versions")
    inference_runs = relationship("InferenceRun", back_populates="model_version")
    model_runs = relationship("ModelRun", back_populates="model_version")

    def __repr__(self):
        return f"<ModelVersion(id={self.id}, name='{self.name}', v='{self.version}', status='{self.status}')>"


class ModelRun(Base):
    __tablename__ = "model_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_version_id: Mapped[int] = mapped_column(Integer, ForeignKey("model_versions.id"), nullable=False)
    dataset_version_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    hardware: Mapped[str | None] = mapped_column(String(255), nullable=True)
    software_versions_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    model_version = relationship("ModelVersion", back_populates="model_runs")


class InferenceRun(Base):
    __tablename__ = "inference_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_version_id: Mapped[int] = mapped_column(Integer, ForeignKey("model_versions.id"), nullable=False)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    processing_job_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("processing_jobs.id"), nullable=True)
    total_tiles: Mapped[int] = mapped_column(Integer, default=0)
    processed_tiles: Mapped[int] = mapped_column(Integer, default=0)
    failed_tiles: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    model_version = relationship("ModelVersion", back_populates="inference_runs")
    processing_job = relationship("ProcessingJob", back_populates="inference_runs")
    detections = relationship("Detection", back_populates="inference_run")
    anomalies = relationship("Anomaly", back_populates="inference_run")


class Dataset(Base, TimestampMixin):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    modality: Mapped[str] = mapped_column(String(10), nullable=False)
    license: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    verified_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    download_status: Mapped[str] = mapped_column(String(20), default=DownloadStatus.NOT_DOWNLOADED.value)
    task_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    label_schema_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    limitations: Mapped[str | None] = mapped_column(Text, nullable=True)
    sss_model_eligible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    model_versions = relationship("ModelVersion", back_populates="dataset")

    def __repr__(self):
        return f"<Dataset(id={self.id}, name='{self.name}', modality='{self.modality}')>"
