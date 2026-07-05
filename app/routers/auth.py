import os
import glob
from fastapi import APIRouter, Depends, HTTPException, Request, Response
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
from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    """Write the JWT into an httpOnly cookie so JS cannot read it."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,                              # JS cannot access this
        secure=settings.HTTPS_ENABLED,              # True in production (HTTPS)
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/register")
@limiter.limit("10/minute")
async def register(request: Request, body: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        phone=body.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.role.value)
    _set_auth_cookie(response, token)
    # Also return token in body so existing localStorage-based clients keep working
    return {"token": token, "user": UserOut.model_validate(user).model_dump()}


@router.post("/login")
@limiter.limit("10/minute")          # brute-force protection: 10 attempts per minute per IP
async def login(request: Request, body: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user.id, user.role.value)
    _set_auth_cookie(response, token)
    # Also return token in body so existing localStorage-based clients keep working
    return {"token": token, "user": UserOut.model_validate(user).model_dump()}


@router.post("/logout")
async def logout(response: Response):
    """Clear the httpOnly auth cookie."""
    response.delete_cookie("access_token", path="/", samesite="lax")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    response: Response = None,
):
    uid = current_user.id

    await db.execute(delete(Review).where((Review.reviewer_id == uid) | (Review.reviewee_id == uid)))
    await db.execute(delete(VolunteerAssignment).where(VolunteerAssignment.volunteer_id == uid))

    req_ids = (await db.execute(select(HelpRequest.id).where(HelpRequest.requester_id == uid))).scalars().all()
    if req_ids:
        await db.execute(delete(VolunteerAssignment).where(VolunteerAssignment.request_id.in_(req_ids)))
        await db.execute(delete(HelpRequest).where(HelpRequest.requester_id == uid))

    # Delete conversation files
    pattern = os.path.join(settings.CONVERSATIONS_DIR, "*.json")
    for path in glob.glob(pattern):
        try:
            import json
            from app.services.crypto import try_decrypt_str
            with open(path) as f:
                data = json.loads(try_decrypt_str(f.read()))
            if data.get("user_id") == uid:
                os.remove(path)
        except Exception:
            pass

    await db.execute(delete(User).where(User.id == uid))
    await db.commit()

    # Also clear the auth cookie
    if response:
        response.delete_cookie("access_token", path="/", samesite="lax")

    return {"ok": True, "message": "Account deleted"}
