from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.auth_deps import get_current_user_payload, require_admin
from app.db import firestore_repo
from app.db.firestore_client import get_firestore
from app.schemas.usage_entry import StockEntryCreate, StockEntryRead, StockEntryUpdate, MonthlyReportResponse, MonthlyReportRow, DeptGridSave

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("", response_model=StockEntryRead, status_code=201)
def create_stock_entry(payload: StockEntryCreate, _: dict = Depends(get_current_user_payload)):
    db = get_firestore()
    desc = firestore_repo.get_description_by_id(db, payload.description_id)
    if not desc:
        raise HTTPException(status_code=404, detail="Description not found")
    color = firestore_repo.get_color_by_id(db, payload.color_id)
    if not color:
        raise HTTPException(status_code=404, detail="Color not found")

    doc = firestore_repo.create_stock_entry(
        entry_date=payload.entry_date,
        description_id=payload.description_id,
        color_id=payload.color_id,
        purchase_qty=payload.purchase_qty,
        usage_qty=payload.usage_qty,
        reason=payload.reason,
    )
    return StockEntryRead(
        id=doc["id"],
        entry_date=payload.entry_date,
        description_id=doc["description_id"],
        color_id=doc["color_id"],
        purchase_qty=doc["purchase_qty"],
        usage_qty=doc["usage_qty"],
        reason=doc.get("reason"),
    )


@router.get("/entries", response_model=List[StockEntryRead])
def list_stock_entries(
    start: str | None = None,
    end: str | None = None,
    limit: int = 200,
    _: dict = Depends(require_admin),
):
    """List stock entries (admin only). Optional query: start=YYYY-MM-DD, end=YYYY-MM-DD"""
    db = get_firestore()
    entries = firestore_repo.list_stock_entries(db, start_date=start, end_date=end, limit=limit)
    return [StockEntryRead(**e) for e in entries]


@router.get("/entries/{entry_id}", response_model=StockEntryRead)
def get_stock_entry(entry_id: int, _: dict = Depends(require_admin)):
    db = get_firestore()
    entry = firestore_repo.get_stock_entry_by_id(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return StockEntryRead(**entry)


@router.patch("/entries/{entry_id}", response_model=StockEntryRead)
def update_stock_entry(entry_id: int, payload: StockEntryUpdate, _: dict = Depends(require_admin)):
    db = get_firestore()
    entry = firestore_repo.get_stock_entry_by_id(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        firestore_repo.update_stock_entry(db, entry_id, **updates)
    entry = firestore_repo.get_stock_entry_by_id(db, entry_id)
    return StockEntryRead(**entry)


@router.get("/dept-grid/{entry_date}")
def get_dept_grid(entry_date: str, _: dict = Depends(get_current_user_payload)):
    """Get department IN/OUT grid data for a date. Returns descriptions + their dept entries."""
    db = get_firestore()
    descriptions = firestore_repo.get_all_descriptions_ordered(db)
    dept_entries = firestore_repo.get_dept_entries_for_date(db, entry_date)
    by_desc = {}
    for e in dept_entries:
        did = e["description_id"]
        if did not in by_desc:
            by_desc[did] = {}
        by_desc[did][e["department"]] = {"in_qty": e.get("in_qty", 0), "out_qty": e.get("out_qty", 0)}
    rows = []
    for d in descriptions:
        deps = by_desc.get(d["id"], {})
        rows.append({
            "description_id": d["id"],
            "description": d["name"],
            "size": (d.get("size") or ""),
            "price": float(d.get("price") or 0),
            "opening_stock": d.get("opening_stock", 0),
            "departments": deps,
        })
    return {"entry_date": entry_date, "rows": rows}


@router.post("/dept-grid")
def save_dept_grid(payload: DeptGridSave, _: dict = Depends(get_current_user_payload)):
    """Save department IN/OUT grid for a date."""
    db = get_firestore()
    entries = [e.model_dump() for e in payload.entries]
    firestore_repo.save_dept_entries(db, payload.entry_date.isoformat(), entries)
    return {"message": "Saved"}


@router.delete("/entries/{entry_id}", status_code=204)
def delete_stock_entry(entry_id: int, _: dict = Depends(require_admin)):
    db = get_firestore()
    ok = firestore_repo.delete_stock_entry(db, entry_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Entry not found")
    return None


def _build_monthly_report(year_month: str) -> MonthlyReportResponse:
    """Internal helper to build report (used by route and update-opening-stock)."""
    try:
        year, month = year_month.split("-")
        year, month = int(year), int(month)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid format. Use YYYY-MM")

    db = get_firestore()
    colors_list = firestore_repo.list_colors()
    descriptions = firestore_repo.get_all_descriptions_ordered(db)

    report_rows = []

    for idx, desc in enumerate(descriptions, start=1):
        row_data = {
            "sn": idx,
            "description": desc["name"],
            "size": (desc.get("size") or ""),
            "price": float(desc.get("price") or 0),
            "opening_stock": desc.get("opening_stock", 0),
            **{f"purchase_day_{i:02d}": 0 for i in range(1, 32)},
            **{f"usage_day_{i:02d}": 0 for i in range(1, 32)},
            "total_purchase": 0,
            "total_usage": 0,
            "closing_stock": desc.get("opening_stock", 0),
            "closing_stock_purchase": desc.get("opening_stock", 0),
            "closing_stock_usage": desc.get("opening_stock", 0),
        }

        entries = firestore_repo.get_stock_entries_for_month(db, desc["id"], year, month)
        dept_entries = firestore_repo.get_dept_entries_for_month(db, year, month)
        dept_by_desc_day = {}
        for e in dept_entries:
            if e["description_id"] == desc["id"]:
                day = int(e["entry_date"].split("-")[2])
                if day not in dept_by_desc_day:
                    dept_by_desc_day[day] = {"in": 0, "out": 0}
                dept_by_desc_day[day]["in"] += e.get("in_qty", 0)
                dept_by_desc_day[day]["out"] += e.get("out_qty", 0)
        total_purchase = 0
        total_usage = 0

        for day in range(1, 32):
            purchase_key = f"purchase_day_{day:02d}"
            usage_key = f"usage_day_{day:02d}"
            if day in dept_by_desc_day:
                row_data[purchase_key] = dept_by_desc_day[day]["in"]
                row_data[usage_key] = dept_by_desc_day[day]["out"]
                total_purchase += dept_by_desc_day[day]["in"]
                total_usage += dept_by_desc_day[day]["out"]
            else:
                for entry in entries:
                    if int(entry["entry_date"].split("-")[2]) == day:
                        row_data[purchase_key] += entry.get("purchase_qty", 0)
                        row_data[usage_key] += entry.get("usage_qty", 0)
                        total_purchase += entry.get("purchase_qty", 0)
                        total_usage += entry.get("usage_qty", 0)
                        break

        row_data["total_purchase"] = total_purchase
        row_data["total_usage"] = total_usage
        opening = desc.get("opening_stock", 0)
        row_data["closing_stock"] = opening + total_purchase - total_usage
        row_data["closing_stock_purchase"] = opening + total_purchase
        row_data["closing_stock_usage"] = opening - total_usage

        report_rows.append(MonthlyReportRow(**row_data))

    return MonthlyReportResponse(
        year_month=year_month,
        colors=colors_list,
        data=report_rows,
    )


@router.get("/monthly/{year_month}", response_model=MonthlyReportResponse)
def get_monthly_report(year_month: str, _: dict = Depends(get_current_user_payload)):
    return _build_monthly_report(year_month)


@router.post("/update-opening-stock/{year_month}")
def update_opening_stock_for_month(year_month: str, _: dict = Depends(require_admin)):
    """
    Updates opening stock for next month based on this month's closing stock.
    Example: After January ends, call this to set February opening = January closing.
    """
    try:
        year, month = year_month.split("-")
        year, month = int(year), int(month)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid format. Use YYYY-MM")

    report = _build_monthly_report(year_month)
    db = get_firestore()

    for row in report.data:
        desc = firestore_repo.get_description_by_name(db, row.description)
        if desc:
            firestore_repo.update_description_opening_stock(desc["id"], row.closing_stock)

    return {"message": f"Opening stock updated for period after {year_month}"}
