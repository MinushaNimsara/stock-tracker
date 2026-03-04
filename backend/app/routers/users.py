"""User management - admin only."""
from fastapi import APIRouter, Body, Depends, HTTPException

from app.auth_deps import require_admin
from app.core.auth import hash_password
from app.db import firestore_repo

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users(_: dict = Depends(require_admin)):
    return firestore_repo.list_users()


@router.post("")
def create_user(
    username: str = Body(...),
    password: str = Body(...),
    role: str = Body("user"),
    _: dict = Depends(require_admin),
):
    created = firestore_repo.create_user(
        username=username,
        password_hash=hash_password(password),
        role=role,
    )
    if not created:
        raise HTTPException(status_code=400, detail="Username already exists")
    return created


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str = Body(..., embed=True),
    _: dict = Depends(require_admin),
):
    ok = firestore_repo.update_user(user_id, role=role)
    if not ok:
        raise HTTPException(status_code=400, detail="User not found or cannot modify master admin")
    return {"message": "Updated"}


@router.patch("/{user_id}/active")
def update_user_active(
    user_id: int,
    active: bool = Body(..., embed=True),
    _: dict = Depends(require_admin),
):
    ok = firestore_repo.update_user(user_id, active=active)
    if not ok:
        raise HTTPException(status_code=400, detail="User not found or cannot modify master admin")
    return {"message": "Updated"}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    new_password: str = Body(..., embed=True),
    _: dict = Depends(require_admin),
):
    ok = firestore_repo.update_user_password(user_id, hash_password(new_password))
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password reset"}


@router.delete("/{user_id}")
def delete_user(user_id: int, _: dict = Depends(require_admin)):
    ok = firestore_repo.delete_user(user_id)
    if not ok:
        raise HTTPException(status_code=400, detail="User not found or cannot delete master admin")
    return {"message": "Deleted"}
