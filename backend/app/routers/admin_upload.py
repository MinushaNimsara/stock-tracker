"""Upload store list (CSV or Excel) to update descriptions and opening stock. Admin only."""
import csv
import io
from itertools import zip_longest

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth_deps import require_admin
from app.db import firestore_repo
from app.db.firestore_client import get_firestore

router = APIRouter(prefix="/admin", tags=["admin"])


def _parse_csv(content: bytes) -> list[dict]:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV has no headers")
    return list(reader)


def _parse_excel(content: bytes) -> list[dict]:
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=503, detail="Excel support not installed (openpyxl)")
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active
    if not ws:
        raise HTTPException(status_code=400, detail="Excel file has no sheet")
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise HTTPException(status_code=400, detail="Excel sheet is empty")
    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    return [
        dict(zip_longest(headers, [str(c).strip() if c is not None else "" for c in row], fillvalue=""))
        for row in rows[1:]
    ]


def _process_rows(rows: list[dict]) -> tuple[int, int, list[str]]:
    if not rows:
        raise HTTPException(status_code=400, detail="No data rows")
    headers_lower = {str(h).strip().lower(): h for h in rows[0].keys() if h}

    def col(name_variants):
        for v in name_variants:
            if v in headers_lower:
                return headers_lower[v]
        return None

    desc_col = col(["description", "descriptions", "name", "item", "store"])
    stock_col = col(["opening stock", "opening_stock", "openingstock", "stock", "qty", "quantity"])

    if not desc_col:
        raise HTTPException(status_code=400, detail="File must have a 'Description' (or 'Name', 'Item') column")
    if not stock_col:
        raise HTTPException(status_code=400, detail="File must have an 'Opening Stock' (or 'Stock', 'Qty') column")

    db = get_firestore()
    updated = 0
    created = 0
    errors = []

    for i, row in enumerate(rows, start=2):
        name_raw = str(row.get(desc_col) or "").strip()
        if not name_raw:
            continue
        try:
            opening = int(float(str(row.get(stock_col) or 0).replace(",", "")))
        except (ValueError, TypeError):
            opening = 0

        existing = firestore_repo.get_description_by_name_ignore_case(db, name_raw)
        if existing:
            desc_id = existing.get("id")
            if desc_id is not None:
                firestore_repo.update_description(db, int(desc_id), opening_stock=opening)
                updated += 1
            else:
                errors.append(f"Row {i}: '{name_raw}' has no id, skipping")
        else:
            created_desc = firestore_repo.create_description(name_raw, opening_stock=opening)
            if created_desc:
                created += 1
            else:
                errors.append(f"Row {i}: could not create '{name_raw}' (duplicate?)")

    return updated, created, errors


@router.post("/upload-store-list")
async def upload_store_list(
    file: UploadFile = File(...),
    _: dict = Depends(require_admin),
):
    """Upload CSV or Excel (.xlsx) with columns: Description, Opening Stock (or similar)."""
    fn = (file.filename or "").lower()
    if not fn.endswith(".csv") and not fn.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel (.xlsx)")

    content = file.file.read()
    is_excel = content[:2] == b"PK" or fn.endswith(".xlsx")
    rows = _parse_excel(content) if is_excel else _parse_csv(content)

    updated, created, errors = _process_rows(rows)
    return {
        "message": "Store list processed",
        "updated": updated,
        "created": created,
        "errors": errors[:20],
    }
