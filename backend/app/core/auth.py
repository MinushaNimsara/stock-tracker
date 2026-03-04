"""JWT and password hashing for auth."""
import os
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "rla-stock-tracker-secret-change-in-production")
ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # bcrypt limit is 72 bytes
    if len(password.encode("utf-8")) > 72:
        password = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if len(plain.encode("utf-8")) > 72:
        plain = plain.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return pwd_context.verify(plain, hashed)


def create_token(sub: str, role: str, expire_minutes: int | None = None) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=expire_minutes or DEFAULT_EXPIRE_MINUTES
    )
    payload = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
