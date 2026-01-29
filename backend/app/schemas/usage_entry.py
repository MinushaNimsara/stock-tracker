from datetime import date
from pydantic import BaseModel, Field


class StockEntryCreate(BaseModel):
    entry_date: date
    description_id: int
    color_id: int
    purchase_qty: int = Field(ge=0, default=0)  # >= 0
    usage_qty: int = Field(ge=0, default=0)  # >= 0
    reason: str | None = None


class StockEntryRead(BaseModel):
    id: int
    entry_date: date
    description_id: int
    color_id: int
    purchase_qty: int
    usage_qty: int
    reason: str | None

    class Config:
        from_attributes = True


class MonthlyReportRow(BaseModel):
    """Excel-like format: Opening + Daily Purchase + Daily Usage + Closing"""
    
    sn: int | None
    description: str
    opening_stock: int
    
    # Purchase columns (daily)
    purchase_day_01: int = 0
    purchase_day_02: int = 0
    purchase_day_03: int = 0
    purchase_day_04: int = 0
    purchase_day_05: int = 0
    purchase_day_06: int = 0
    purchase_day_07: int = 0
    purchase_day_08: int = 0
    purchase_day_09: int = 0
    purchase_day_10: int = 0
    purchase_day_11: int = 0
    purchase_day_12: int = 0
    purchase_day_13: int = 0
    purchase_day_14: int = 0
    purchase_day_15: int = 0
    purchase_day_16: int = 0
    purchase_day_17: int = 0
    purchase_day_18: int = 0
    purchase_day_19: int = 0
    purchase_day_20: int = 0
    purchase_day_21: int = 0
    purchase_day_22: int = 0
    purchase_day_23: int = 0
    purchase_day_24: int = 0
    purchase_day_25: int = 0
    purchase_day_26: int = 0
    purchase_day_27: int = 0
    purchase_day_28: int = 0
    purchase_day_29: int = 0
    purchase_day_30: int = 0
    purchase_day_31: int = 0
    
    # Usage columns (daily)
    usage_day_01: int = 0
    usage_day_02: int = 0
    usage_day_03: int = 0
    usage_day_04: int = 0
    usage_day_05: int = 0
    usage_day_06: int = 0
    usage_day_07: int = 0
    usage_day_08: int = 0
    usage_day_09: int = 0
    usage_day_10: int = 0
    usage_day_11: int = 0
    usage_day_12: int = 0
    usage_day_13: int = 0
    usage_day_14: int = 0
    usage_day_15: int = 0
    usage_day_16: int = 0
    usage_day_17: int = 0
    usage_day_18: int = 0
    usage_day_19: int = 0
    usage_day_20: int = 0
    usage_day_21: int = 0
    usage_day_22: int = 0
    usage_day_23: int = 0
    usage_day_24: int = 0
    usage_day_25: int = 0
    usage_day_26: int = 0
    usage_day_27: int = 0
    usage_day_28: int = 0
    usage_day_29: int = 0
    usage_day_30: int = 0
    usage_day_31: int = 0
    
    total_purchase: int
    total_usage: int
    closing_stock: int  # opening + total_purchase - total_usage (All Stock)
    closing_stock_purchase: int  # opening + total_purchase (Purchase tab)
    closing_stock_usage: int  # opening - total_usage (Usage tab)


class MonthlyReportResponse(BaseModel):
    year_month: str
    colors: list[dict]
    data: list[MonthlyReportRow]
