from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class A4Color(Base):
    __tablename__ = "a4_colors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hex_code: Mapped[str] = mapped_column(String(7), nullable=False)  # e.g., "#FFFFFF"
