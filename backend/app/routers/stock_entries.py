from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.usage_entry import StockEntry
from app.models.description import Description
from app.models.a4_color import A4Color
from app.schemas.usage_entry import StockEntryCreate, StockEntryRead, MonthlyReportResponse, MonthlyReportRow

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("", response_model=StockEntryRead, status_code=201)
def create_stock_entry(payload: StockEntryCreate, db: Session = Depends(get_db)):
    desc = db.query(Description).filter(Description.id == payload.description_id).first()
    if not desc:
        raise HTTPException(status_code=404, detail="Description not found")

    color = db.query(A4Color).filter(A4Color.id == payload.color_id).first()
    if not color:
        raise HTTPException(status_code=404, detail="Color not found")

    row = StockEntry(
        entry_date=payload.entry_date,
        description_id=payload.description_id,
        color_id=payload.color_id,
        purchase_qty=payload.purchase_qty,
        usage_qty=payload.usage_qty,
        reason=payload.reason,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/monthly/{year_month}", response_model=MonthlyReportResponse)
def get_monthly_report(year_month: str, db: Session = Depends(get_db)):
    try:
        year, month = year_month.split("-")
        year, month = int(year), int(month)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid format. Use YYYY-MM")

    colors = db.query(A4Color).order_by(A4Color.id.asc()).all()
    colors_list = [{"id": c.id, "name": c.name, "hex_code": c.hex_code} for c in colors]

    descriptions = db.query(Description).order_by(Description.id.asc()).all()

    report_rows = []

    for idx, desc in enumerate(descriptions, start=1):
        # Initialize row
        row_data = {
            "sn": idx,
            "description": desc.name,
            "opening_stock": desc.opening_stock,
            **{f"purchase_day_{i:02d}": 0 for i in range(1, 32)},
            **{f"usage_day_{i:02d}": 0 for i in range(1, 32)},
            "total_purchase": 0,
            "total_usage": 0,
            "closing_stock": desc.opening_stock,  # All Stock tab
            "closing_stock_purchase": desc.opening_stock,  # Purchase tab only
            "closing_stock_usage": desc.opening_stock,  # Usage tab only
        }

        # Query entries for this description in this month
        entries = db.query(StockEntry).filter(
            StockEntry.description_id == desc.id,
            extract("year", StockEntry.entry_date) == year,
            extract("month", StockEntry.entry_date) == month,
        ).all()

        total_purchase = 0
        total_usage = 0

        for entry in entries:
            day = entry.entry_date.day
            purchase_key = f"purchase_day_{day:02d}"
            usage_key = f"usage_day_{day:02d}"

            if purchase_key in row_data:
                row_data[purchase_key] += entry.purchase_qty

            if usage_key in row_data:
                row_data[usage_key] += entry.usage_qty

            total_purchase += entry.purchase_qty
            total_usage += entry.usage_qty

        row_data["total_purchase"] = total_purchase
        row_data["total_usage"] = total_usage
        
        # ✅ THREE DIFFERENT CLOSING STOCK CALCULATIONS
        row_data["closing_stock"] = desc.opening_stock + total_purchase - total_usage  # All Stock
        row_data["closing_stock_purchase"] = desc.opening_stock + total_purchase  # Purchase only
        row_data["closing_stock_usage"] = desc.opening_stock - total_usage  # Usage only

        report_rows.append(MonthlyReportRow(**row_data))

    return MonthlyReportResponse(
        year_month=year_month,
        colors=colors_list,
        data=report_rows,
    )


@router.post("/update-opening-stock/{year_month}")
def update_opening_stock_for_month(year_month: str, db: Session = Depends(get_db)):
    """
    Updates opening stock for next month based on this month's closing stock
    Example: After January ends, call this to set February opening = January closing
    """
    try:
        year, month = year_month.split("-")
        year, month = int(year), int(month)
    except:
        raise HTTPException(400, "Invalid format. Use YYYY-MM")
    
    # Get this month's report
    report = get_monthly_report(year_month, db)
    
    # Update each description's opening stock for next month
    for row in report.data:
        desc = db.query(Description).filter(Description.name == row.description).first()
        if desc:
            desc.opening_stock = row.closing_stock
    
    db.commit()
    return {"message": f"Opening stock updated for period after {year_month}"}
