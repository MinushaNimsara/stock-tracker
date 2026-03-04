"""
Upload store list (CSV) to update descriptions and opening stock.
"""
import csv
import io

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.db import firestore_repo
from app.db.firestore_client import get_firestore

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/upload-store-list")
async def upload_store_list(file: UploadFile = File(...)):
    """Upload CSV with columns: Description, Opening Stock (or similar)."""

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = file.file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV has no headers")

    # Normalize header names (case-insensitive, strip)
    headers_lower = {h.strip().lower(): h for h in reader.fieldnames}

    def col(name_variants):
        for v in name_variants:
            if v in headers_lower:
                return headers_lower[v]
        return None

    desc_col = col(["description", "descriptions", "name", "item", "store"])
    stock_col = col(["opening stock", "opening_stock", "openingstock", "stock", "qty", "quantity"])

    if not desc_col:
        raise HTTPException(
            status_code=400,
            detail="CSV must have a 'Description' (or 'Name', 'Item') column",
        )
    if not stock_col:
        raise HTTPException(
            status_code=400,
            detail="CSV must have an 'Opening Stock' (or 'Stock', 'Qty') column",
        )

    db = get_firestore()
    updated = 0
    created = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        name_raw = (row.get(desc_col) or "").strip()
        if not name_raw:
            continue

        try:
            opening = int(float(str(row.get(stock_col) or 0).replace(",", "")))
        except (ValueError, TypeError):
            opening = 0

        existing = firestore_repo.get_description_by_name(db, name_raw)
        if existing:
            firestore_repo.update_description(db, existing["id"], opening_stock=opening)
            updated += 1
        else:
            created_desc = firestore_repo.create_description(name_raw, opening_stock=opening)
            if created_desc:
                created += 1
            else:
                errors.append(f"Row {i}: could not create '{name_raw}' (duplicate?)")

    return {
        "message": "Store list processed",
        "updated": updated,
        "created": created,
        "errors": errors[:20],
    }
