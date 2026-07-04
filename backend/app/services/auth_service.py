from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.hash import pbkdf2_sha256
import bcrypt
from app.config import settings

def hash_password(password: str) -> str:
    return pbkdf2_sha256.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("$2"):
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except ValueError:
            return False
    return pbkdf2_sha256.verify(plain, hashed)

def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return {}