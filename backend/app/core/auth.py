"""JWT and password hashing for auth."""
import os
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "rla-stock-tracker-secret-change-in-production")
ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-computed hash for RLA_store_8585 - avoids bcrypt issues in reset-admin
MASTER_ADMIN_HASH = "$2b$12$m2L1VXDiXjcWB625aGhpZ.f91K1YzbmqVLAu//j2ExvRyXOJgBTLW"


def hash_password(password: str) -> str:
    # bcrypt limit is 72 bytes - truncate to avoid passlib error
    b = password.encode("utf-8")
    if len(b) > 72:
        b = b[:72]
        while b and (b[-1] & 0xC0) == 0x80:  # remove trailing partial UTF-8 char
            b = b[:-1]
        password = b.decode("utf-8", errors="replace")
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    b = plain.encode("utf-8")
    if len(b) > 72:
        b = b[:72]
        while b and (b[-1] & 0xC0) == 0x80:
            b = b[:-1]
        plain = b.decode("utf-8", errors="replace")
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
