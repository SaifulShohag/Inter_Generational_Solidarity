from datetime import datetime, timezone
from sqlalchemy import Integer, Text, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.services.database import Base

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        # Prevents a user submitting more than one review per request
        UniqueConstraint("request_id", "reviewer_id", name="uq_review_per_request_per_user"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
    )

    id:          Mapped[int]        = mapped_column(Integer, primary_key=True)
    request_id:  Mapped[int]        = mapped_column(ForeignKey("help_requests.id"), index=True)
    reviewer_id: Mapped[int]        = mapped_column(ForeignKey("users.id"))
    reviewee_id: Mapped[int]        = mapped_column(ForeignKey("users.id"), index=True)
    rating:      Mapped[int]        = mapped_column(Integer)
    comment:     Mapped[str | None] = mapped_column(Text)
    created_at:  Mapped[datetime]   = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )