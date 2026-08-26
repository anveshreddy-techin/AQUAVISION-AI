"""Review models: sessions and corrections for human-in-the-loop workflow."""
import datetime
import enum
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.models.base import Base


class ReviewAction(str, enum.Enum):
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"
    CORRECT = "CORRECT"
    UNCERTAIN = "UNCERTAIN"
    NATURAL_FEATURE = "NATURAL_FEATURE"
    POTENTIAL_DEBRIS = "POTENTIAL_DEBRIS"
    POTENTIAL_GEAR = "POTENTIAL_GEAR"
    ADD_NOTE = "ADD_NOTE"


class ReviewSession(Base):
    __tablename__ = "review_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    survey_id: Mapped[int] = mapped_column(Integer, ForeignKey("surveys.id"), nullable=False)
    started_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    ended_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    candidates_reviewed: Mapped[int] = mapped_column(Integer, default=0)
    accepted: Mapped[int] = mapped_column(Integer, default=0)
    rejected: Mapped[int] = mapped_column(Integer, default=0)
    corrected: Mapped[int] = mapped_column(Integer, default=0)
    uncertain: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    reviewer = relationship("User", back_populates="review_sessions")
    corrections = relationship("Correction", back_populates="review_session")

    def __repr__(self):
        return f"<ReviewSession(id={self.id}, reviewer_id={self.reviewer_id}, reviewed={self.candidates_reviewed})>"


class Correction(Base):
    __tablename__ = "corrections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    candidate_id: Mapped[int] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=False)
    reviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    review_session_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("review_sessions.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    original_prediction: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reviewed_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    original_status: Mapped[str] = mapped_column(String(20), nullable=False)
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="corrections")
    reviewer = relationship("User", back_populates="corrections")
    review_session = relationship("ReviewSession", back_populates="corrections")

    def __repr__(self):
        return f"<Correction(id={self.id}, action='{self.action}', candidate_id={self.candidate_id})>"
