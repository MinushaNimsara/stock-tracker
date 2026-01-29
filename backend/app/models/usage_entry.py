from datetime import date
from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StockEntry(Base):  # Renamed from UsageEntry
    __tablename__ = "stock_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description_id: Mapped[int] = mapped_column(ForeignKey("descriptions.id"), nullable=False)
    color_id: Mapped[int] = mapped_column(ForeignKey("a4_colors.id"), nullable=False)
    
    # Both purchase and usage (can be 0 if not applicable)
    purchase_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    usage_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    reason: Mapped[str] = mapped_column(String(255), nullable=True)

    description = relationship("Description")
    color = relationship("A4Color")
