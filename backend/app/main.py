from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.db.base import Base

# Routers
from app.routers.descriptions import router as descriptions_router
from app.routers.colors import router as colors_router
from app.routers.stock_entries import router as stock_router

app = FastAPI(title="A4 Format Stock Tracker API")

# DEV CORS (for React/Vite + mobile LAN testing)
# In production, restrict to your frontend domains only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup (dev convenience)
Base.metadata.create_all(bind=engine)

# Register routers (Bigger Applications style)
app.include_router(descriptions_router)
app.include_router(colors_router)
app.include_router(stock_router)

@app.get("/")
def root():
    return {"message": "API is running"}

@app.post("/seed-data")
def seed_data():
    """
    DEV ONLY:
    Seed default A4 colors (normal) so dropdowns have values.
    You can also add descriptions from /descriptions endpoint.
    """
    from app.db.database import SessionLocal
    from app.models.a4_color import A4Color
    
    db = SessionLocal()
    colors_data = [
        ("White", "#FFFFFF"),
        ("Pink", "#FFB6C1"),
        ("Yellow", "#FFFF00"),
        ("Blue", "#0000FF"),
        ("Green", "#008000"),
        ("Red", "#FF0000"),
        ("Orange", "#FFA500"),
        ("Purple", "#800080"),
        ("Brown", "#8B4513"),
        ("Gray", "#808080"),
    ]
    
    try:
        added = 0
        for name, hex_code in colors_data:
            existing = db.query(A4Color).filter(A4Color.name == name).first()
            if not existing:
                db.add(A4Color(name=name, hex_code=hex_code))
                added += 1
        db.commit()
        return {"message": "Seed colors done", "added": added}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


# ✅ ADD THIS - Run server on all network interfaces
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # ✅ Listen on ALL network interfaces (not just localhost)
        port=8000,
        reload=True
    )
