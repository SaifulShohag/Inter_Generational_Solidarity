from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole

class UserRegister(BaseModel):
    name:     str
    email:    EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    role:     UserRole
    phone:    str | None = None

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class UserOut(BaseModel):
    id:            int
    name:          str
    email:         EmailStr
    role:          UserRole
    phone:         str | None
    avg_rating:    float
    total_reviews: int
    created_at:    datetime

    class Config:
        from_attributes = True