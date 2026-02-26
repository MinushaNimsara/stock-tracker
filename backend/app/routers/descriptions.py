from typing import List

from fastapi import APIRouter, HTTPException

from app.db import firestore_repo
from app.schemas.description import DescriptionCreate, DescriptionRead

router = APIRouter(prefix="/descriptions", tags=["descriptions"])


@router.get("", response_model=List[DescriptionRead])
def list_descriptions():
    items = firestore_repo.list_descriptions()
    return [DescriptionRead(**x) for x in items]


@router.post("", response_model=DescriptionRead, status_code=201)
def create_description(payload: DescriptionCreate):
    created = firestore_repo.create_description(
        payload.name.strip(),
        opening_stock=payload.opening_stock,
        active=payload.active,
    )
    if created is None:
        raise HTTPException(status_code=400, detail="Description already exists")
    return DescriptionRead(**created)


@router.delete("/{description_id}", status_code=204)
def delete_description(description_id: int):
    ok = firestore_repo.delete_description(description_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Description not found")
    return None
