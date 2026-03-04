"""JWT and password hashing for auth."""
import os
from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "rla-stock-tracker-secret-change-in-production")
ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Pre-computed hash for RLA_store_8585 - avoids bcrypt issues in reset-admin
MASTER_ADMIN_HASH = "$2b$12$m2L1VXDiXjcWB625aGhpZ.f91K1YzbmqVLAu//j2ExvRyXOJgBTLW"


def _to_bcrypt_bytes(password: str) -> bytes:
    """Bcrypt limit is 72 bytes. Truncate safely."""
    b = password.encode("utf-8")
    if len(b) > 72:
        b = b[:72]
        while b and (b[-1] & 0xC0) == 0x80:  # drop trailing partial UTF-8
            b = b[:-1]
    return b


def hash_password(password: str) -> str:
    pw_bytes = _to_bcrypt_bytes(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw_bytes = _to_bcrypt_bytes(plain)
    return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))


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
