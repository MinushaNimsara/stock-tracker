"""Login and token refresh."""
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm

from app.core.auth import create_token, decode_token, verify_password, hash_password, MASTER_ADMIN_HASH
from app.db import firestore_repo
from app.auth_deps import get_current_user_payload

router = APIRouter(prefix="/auth", tags=["auth"])

MASTER_ADMIN_USER = "admin"
MASTER_ADMIN_PASS = "RLA_store_8585"


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    username = (form.username or "").strip()
    password = (form.password or "").strip()

    try:
        # First-time setup: if no users exist and credentials are master admin, create and log in
        existing_users = firestore_repo.list_users()
        if not existing_users and username == MASTER_ADMIN_USER and password == MASTER_ADMIN_PASS:
            created = firestore_repo.create_user(
                username=MASTER_ADMIN_USER,
                password_hash=MASTER_ADMIN_HASH,
                role="admin",
                active=True,
            )
            if created:
                token = create_token(sub=created["username"], role="admin")
                return {
                    "access_token": token,
                    "token_type": "bearer",
                    "username": created["username"],
                    "role": "admin",
                }
        user = firestore_repo.get_user_by_username(username)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        err = str(e)
        if "72 bytes" in err or "bcrypt" in err.lower():
            raise HTTPException(status_code=401, detail="Invalid username or password")
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
            firestore_repo.update_user_password(user["id"], MASTER_ADMIN_HASH)
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(sub=user["username"], role=user.get("role", "user"))
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user.get("role", "user"),
    }


@router.get("/reset-admin")
@router.post("/reset-admin")
def reset_admin(key: str = Query("", alias="key")):
    """Reset admin password to RLA_store_8585. Add ?key=YOUR_RESET_ADMIN_KEY"""
    expected = os.getenv("RESET_ADMIN_KEY")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="RESET_ADMIN_KEY not set in Vercel. Add it in Environment Variables, then redeploy.",
        )
    if not key or key != expected:
        raise HTTPException(status_code=403, detail="Add ?key=your_reset_key (must match RESET_ADMIN_KEY)")
    try:
        user = firestore_repo.get_user_by_username("admin")
        if not user:
            firestore_repo.create_user(
                username="admin",
                password_hash=MASTER_ADMIN_HASH,
                role="admin",
                active=True,
            )
            return {"message": "Admin user created. Login with admin / RLA_store_8585"}
        firestore_repo.update_user_password(user["id"], MASTER_ADMIN_HASH)
        return {"message": "Admin password reset. Login with admin / RLA_store_8585"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


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
