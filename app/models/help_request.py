import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text, Enum, event
from sqlalchemy.orm import Mapped, mapped_column
from app.services.database import Base

class RequestCategory(str, enum.Enum):
    MEDICAL   = "medical"
    GROCERY   = "grocery"
    CLEANING  = "cleaning"
    TRANSPORT = "transport"
    OTHER     = "other"

class RequestStatus(str, enum.Enum):
    PENDING     = "pending"
    ACCEPTED    = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    CANCELLED   = "cancelled"

class RequestPriority(str, enum.Enum):
    LOW    = "low"
    MEDIUM = "medium"
    URGENT = "urgent"

class HelpRequest(Base):
    __tablename__ = "help_requests"

    id:            Mapped[int]             = mapped_column(Integer, primary_key=True)
    requester_id:  Mapped[int]             = mapped_column(ForeignKey("users.id"), index=True)
    title:         Mapped[str]             = mapped_column(String(200))
    description:   Mapped[str]             = mapped_column(Text)
    category:      Mapped[RequestCategory] = mapped_column(
        Enum(RequestCategory, name="request_category_enum", native_enum=False)
    )
    priority: Mapped[RequestPriority] = mapped_column(
        Enum(RequestPriority, name="request_priority_enum", native_enum=False),
        default=RequestPriority.MEDIUM
    )
    scheduled_at:  Mapped[datetime]        = mapped_column(DateTime(timezone=True))  # proper DateTime
    location_text: Mapped[str]             = mapped_column(String(300))
    latitude:      Mapped[float | None]    = mapped_column(Float)
    longitude:     Mapped[float | None]    = mapped_column(Float)
    status:        Mapped[RequestStatus]   = mapped_column(
        Enum(RequestStatus, name="request_status_enum", native_enum=False),
        default=RequestStatus.PENDING,
        index=True
    )
    created_at:    Mapped[datetime]        = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at:    Mapped[datetime]        = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

# Reliable updated_at — works on SQLite unlike server-side onupdate=func.now()
@event.listens_for(HelpRequest, "before_update")
def refresh_updated_at(mapper, connection, target):
    target.updated_at = datetime.now(timezone.utc)