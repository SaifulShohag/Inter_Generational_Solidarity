import os
import glob
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.help_request import HelpRequest
from app.models.assignment import VolunteerAssignment
from app.models.review import Review
from app.schemas.user import UserRegister, UserLogin, UserOut
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        phone=body.phone
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.role.value)
    return {"token": token, "user": UserOut.model_validate(user).model_dump()}

@router.post("/login")
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user.id, user.role.value)
    return {"token": token, "user": UserOut.model_validate(user).model_dump()}

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    uid = current_user.id

    # Delete reviews (as reviewer or reviewee)
    await db.execute(delete(Review).where((Review.reviewer_id == uid) | (Review.reviewee_id == uid)))

    # Delete volunteer assignments for this user
    await db.execute(delete(VolunteerAssignment).where(VolunteerAssignment.volunteer_id == uid))

    # Delete help requests by this user (assignments on those requests cascade via prior step)
    req_ids = (await db.execute(select(HelpRequest.id).where(HelpRequest.requester_id == uid))).scalars().all()
    if req_ids:
        await db.execute(delete(VolunteerAssignment).where(VolunteerAssignment.request_id.in_(req_ids)))
        await db.execute(delete(HelpRequest).where(HelpRequest.requester_id == uid))

    # Delete conversation files
    pattern = os.path.join(settings.CONVERSATIONS_DIR, "*.json")
    for path in glob.glob(pattern):
        try:
            import json
            with open(path) as f:
                data = json.load(f)
            if data.get("user_id") == uid:
                os.remove(path)
        except Exception:
            pass

    # Delete user
    await db.execute(delete(User).where(User.id == uid))
    await db.commit()

    return {"ok": True, "message": "Account deleted"}