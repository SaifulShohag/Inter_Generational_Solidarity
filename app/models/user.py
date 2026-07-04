import enum
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.services.database import Base

class UserRole(str, enum.Enum):
    REQUESTER = "requester"
    VOLUNTEER = "volunteer"

class User(Base):
    __tablename__ = "users"

    id:            Mapped[int]        = mapped_column(Integer, primary_key=True)
    name:          Mapped[str]        = mapped_column(String(100))
    email:         Mapped[str]        = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str]        = mapped_column(String)
    role:          Mapped[UserRole]   = mapped_column(
        Enum(UserRole, name="user_role_enum", native_enum=False),
        default=UserRole.REQUESTER
    )
    phone:         Mapped[str | None] = mapped_column(String(30))
    avg_rating:    Mapped[float]      = mapped_column(Float, default=0.0)
    total_reviews: Mapped[int]        = mapped_column(Integer, default=0)
    created_at:    Mapped[datetime]   = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )