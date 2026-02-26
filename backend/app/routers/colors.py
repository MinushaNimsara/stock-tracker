from typing import List

from fastapi import APIRouter, HTTPException

from app.db import firestore_repo
from app.schemas.a4_color import A4ColorCreate, A4ColorRead

router = APIRouter(prefix="/colors", tags=["colors"])


@router.get("", response_model=List[A4ColorRead])
def list_colors():
    items = firestore_repo.list_colors()
    return [A4ColorRead(**x) for x in items]


@router.post("", response_model=A4ColorRead, status_code=201)
def create_color(payload: A4ColorCreate):
    created = firestore_repo.create_color(payload.name.strip(), payload.hex_code.upper())
    if created is None:
        raise HTTPException(status_code=400, detail="Color already exists")
    return A4ColorRead(**created)
