from pydantic import BaseModel, Field


class DescriptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    opening_stock: int = 0
    active: bool = True


class DescriptionRead(BaseModel):
    id: int
    name: str
    opening_stock: int
    active: bool

    class Config:
        from_attributes = True  # pydantic v2: allow ORM objects
