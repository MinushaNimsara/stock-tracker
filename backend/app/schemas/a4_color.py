from pydantic import BaseModel, Field


class A4ColorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    hex_code: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")  # Validate hex format


class A4ColorRead(BaseModel):
    id: int
    name: str
    hex_code: str

    class Config:
        from_attributes = True
