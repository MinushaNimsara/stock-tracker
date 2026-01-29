from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.description import Description
from app.schemas.description import DescriptionCreate, DescriptionRead

router = APIRouter(prefix="/descriptions", tags=["descriptions"])


@router.get("", response_model=List[DescriptionRead])
def list_descriptions(db: Session = Depends(get_db)):
    return db.query(Description).order_by(Description.id.asc()).all()


@router.post("", response_model=DescriptionRead, status_code=201)
def create_description(payload: DescriptionCreate, db: Session = Depends(get_db)):
    existing = db.query(Description).filter(Description.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Description already exists")

    row = Description(
        name=payload.name.strip(),
        opening_stock=payload.opening_stock,
        active=payload.active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.delete("/{description_id}", status_code=204)
def delete_description(description_id: int, db: Session = Depends(get_db)):
    desc = db.query(Description).filter(Description.id == description_id).first()
    if not desc:
        raise HTTPException(status_code=404, detail="Description not found")
    
    db.delete(desc)
    db.commit()
    return None
