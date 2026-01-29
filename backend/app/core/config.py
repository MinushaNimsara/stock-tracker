from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "A4 Format Stock Tracker API"
    db_url: str = "sqlite:///./a4.db"  # file created in backend/ when server runs


settings = Settings()
