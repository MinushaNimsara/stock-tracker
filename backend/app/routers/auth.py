"""Login and token refresh."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.core.auth import create_token, decode_token, verify_password, hash_password
from app.db import firestore_repo
from app.auth_deps import get_current_user_payload

router = APIRouter(prefix="/auth", tags=["auth"])

MASTER_ADMIN_USER = "admin"
MASTER_ADMIN_PASS = "RLA_store_8585"


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    username = form.username
    password = form.password

    try:
        # First-time setup: if no users exist and credentials are master admin, create it
        existing_users = firestore_repo.list_users()
        if not existing_users and username == MASTER_ADMIN_USER and password == MASTER_ADMIN_PASS:
            firestore_repo.create_user(
                username=MASTER_ADMIN_USER,
                password_hash=hash_password(MASTER_ADMIN_PASS),
                role="admin",
                active=True,
            )
        user = firestore_repo.get_user_by_username(username)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        err = str(e)
        if "72 bytes" in err or "bcrypt" in err.lower():
            raise HTTPException(status_code=400, detail="Password too long. Use 72 characters or less.")
        raise HTTPException(status_code=503, detail=f"Database error: {err}")

    if not user or not user.get("active", True):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    stored_hash = user.get("password_hash") or ""
    try:
        ok = stored_hash and verify_password(password, stored_hash)
    except Exception:
        ok = False  # Corrupted hash or bcrypt error
    if not ok:
        # Master admin recovery: fix corrupted hash if password is correct
        if user.get("username") == MASTER_ADMIN_USER and password == MASTER_ADMIN_PASS:
            firestore_repo.update_user_password(user["id"], hash_password(MASTER_ADMIN_PASS))
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(sub=user["username"], role=user.get("role", "user"))
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user.get("role", "user"),
    }


@router.get("/me")
def me(payload: dict = Depends(get_current_user_payload)):
    return {
        "username": payload.get("sub"),
        "role": payload.get("role", "user"),
    }


@router.post("/refresh")
def refresh(payload: dict = Depends(get_current_user_payload)):
    token = create_token(sub=payload["sub"], role=payload.get("role", "user"))
    return {"access_token": token, "token_type": "bearer"}
