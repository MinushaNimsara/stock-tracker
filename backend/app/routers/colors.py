from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.a4_color import A4Color
from app.schemas.a4_color import A4ColorCreate, A4ColorRead

router = APIRouter(prefix="/colors", tags=["colors"])


@router.get("", response_model=List[A4ColorRead])
def list_colors(db: Session = Depends(get_db)):
    return db.query(A4Color).order_by(A4Color.id.asc()).all()


@router.post("", response_model=A4ColorRead, status_code=201)
def create_color(payload: A4ColorCreate, db: Session = Depends(get_db)):
    existing = db.query(A4Color).filter(A4Color.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Color already exists")

    row = A4Color(name=payload.name.strip(), hex_code=payload.hex_code.upper())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
