"""Report, audit, notification, and benchmark models."""
import datetime
import enum
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.models.base import Base, TimestampMixin


class ReportType(str, enum.Enum):
    SURVEY_SUMMARY = "SURVEY_SUMMARY"
    DETECTION_REPORT = "DETECTION_REPORT"
    ANOMALY_REPORT = "ANOMALY_REPORT"
    REVIEW_REPORT = "REVIEW_REPORT"
    FULL_REPORT = "FULL_REPORT"


class ReportStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class NotificationType(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    HIGH_PRIORITY = "HIGH_PRIORITY"


class WorkflowType(str, enum.Enum):
    MANUAL = "MANUAL"
    AI_ASSISTED = "AI_ASSISTED"


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    report_type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=ReportStatus.QUEUED.value, nullable=False)
    generated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    model_version_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    survey_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Report(id={self.id}, type='{self.report_type}', status='{self.status}')>"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', entity='{self.entity_type}')>"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(20), default=NotificationType.INFO.value)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    workflow_type: Mapped[str] = mapped_column(String(20), nullable=False)
    participant: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_frames: Mapped[int] = mapped_column(Integer, nullable=False)
    frames_inspected: Mapped[int] = mapped_column(Integer, nullable=False)
    candidates_inspected: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confirmed_findings: Mapped[int] = mapped_column(Integer, default=0)
    missed_findings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    false_positives: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
