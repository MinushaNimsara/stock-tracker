from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.auth_deps import get_current_user_payload
from app.db import firestore_repo
from app.schemas.description import DescriptionCreate, DescriptionRead

router = APIRouter(prefix="/descriptions", tags=["descriptions"])


@router.get("", response_model=List[DescriptionRead])
def list_descriptions(_: dict = Depends(get_current_user_payload)):
    items = firestore_repo.list_descriptions()
    return [DescriptionRead(**x) for x in items]


@router.post("", response_model=DescriptionRead, status_code=201)
def create_description(payload: DescriptionCreate, _: dict = Depends(get_current_user_payload)):
    created = firestore_repo.create_description(
        payload.name.strip(),
        opening_stock=payload.opening_stock,
        price=payload.price,
        active=payload.active,
    )
    if created is None:
        raise HTTPException(status_code=400, detail="Description already exists")
    return DescriptionRead(**created)


@router.delete("/{description_id}", status_code=204)
def delete_description(description_id: int, _: dict = Depends(get_current_user_payload)):
    ok = firestore_repo.delete_description(description_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Description not found")
    return None
