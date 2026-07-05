from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.database import AsyncSessionLocal
from app.services.auth_service import decode_token
from app.models.user import User, UserRole

# auto_error=False so we can also check the httpOnly cookie ourselves
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    # 1. Prefer httpOnly cookie (JS-inaccessible, set by server on login)
    # 2. Fall back to Authorization: Bearer header (mobile / API clients)
    resolved = request.cookies.get("access_token") or token

    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(resolved)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = await db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def require_role(*roles: UserRole):
    """
    Dependency factory for server-side role enforcement.

    Usage:
        @router.get("/volunteer-only")
        async def ep(user: User = Depends(require_role(UserRole.VOLUNTEER))):
    """
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required: {[r.value for r in roles]}",
            )
        return current_user
    return _check
