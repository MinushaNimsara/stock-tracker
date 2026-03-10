from pydantic import BaseModel, Field


class DescriptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    size: str = Field(default="", max_length=50)
    opening_stock: int = 0
    price: float = Field(default=0, ge=0)
    active: bool = True


class DescriptionRead(BaseModel):
    id: int
    name: str
    size: str = ""
    opening_stock: int
    price: float = 0
    active: bool

    class Config:
        from_attributes = True  # pydantic v2: allow ORM objects
