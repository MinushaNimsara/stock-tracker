from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException

from app.db import firestore_repo
from app.db.firestore_client import get_firestore
from app.schemas.usage_entry import StockEntryCreate, StockEntryRead, MonthlyReportResponse, MonthlyReportRow

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("", response_model=StockEntryRead, status_code=201)
def create_stock_entry(payload: StockEntryCreate):
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


@router.get("/monthly/{year_month}", response_model=MonthlyReportResponse)
def get_monthly_report(year_month: str):
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
        total_purchase = 0
        total_usage = 0

        for entry in entries:
            # entry_date is "YYYY-MM-DD" string
            day = int(entry["entry_date"].split("-")[2])
            purchase_key = f"purchase_day_{day:02d}"
            usage_key = f"usage_day_{day:02d}"
            if purchase_key in row_data:
                row_data[purchase_key] += entry.get("purchase_qty", 0)
            if usage_key in row_data:
                row_data[usage_key] += entry.get("usage_qty", 0)
            total_purchase += entry.get("purchase_qty", 0)
            total_usage += entry.get("usage_qty", 0)

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


@router.post("/update-opening-stock/{year_month}")
def update_opening_stock_for_month(year_month: str):
    """
    Updates opening stock for next month based on this month's closing stock.
    Example: After January ends, call this to set February opening = January closing.
    """
    try:
        year, month = year_month.split("-")
        year, month = int(year), int(month)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid format. Use YYYY-MM")

    report = get_monthly_report(year_month)
    db = get_firestore()

    for row in report.data:
        desc = firestore_repo.get_description_by_name(db, row.description)
        if desc:
            firestore_repo.update_description_opening_stock(desc["id"], row.closing_stock)

    return {"message": f"Opening stock updated for period after {year_month}"}
