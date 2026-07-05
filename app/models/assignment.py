from datetime import datetime, timezone
from sqlalchemy import Integer, Float, DateTime, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.services.database import Base

class VolunteerAssignment(Base):
    __tablename__ = "volunteer_assignments"
    __table_args__ = (
        CheckConstraint("eta_minutes >= 0", name="ck_assignment_eta_positive"),
    )

    id:                    Mapped[int]             = mapped_column(Integer, primary_key=True)
    request_id:            Mapped[int]             = mapped_column(ForeignKey("help_requests.id"), unique=True)
    volunteer_id:          Mapped[int]             = mapped_column(ForeignKey("users.id"), index=True)
    accepted_at:           Mapped[datetime]        = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    eta_minutes:           Mapped[int | None]      = mapped_column(Integer)
    completed_at:          Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    volunteer_current_lat: Mapped[float | None]    = mapped_column(Float)
    volunteer_current_lng: Mapped[float | None]    = mapped_column(Float)
    meeting_code:          Mapped[str | None]      = mapped_column(String(8))