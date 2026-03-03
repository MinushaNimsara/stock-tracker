from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.routers.descriptions import router as descriptions_router
from app.routers.colors import router as colors_router
from app.routers.stock_entries import router as stock_router
from app.routers.admin_upload import router as admin_upload_router

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

# Register routers (Bigger Applications style)
app.include_router(descriptions_router)
app.include_router(colors_router)
app.include_router(stock_router)
app.include_router(admin_upload_router)

@app.get("/")
def root():
    return {"message": "API is running"}

@app.post("/seed-data")
def seed_data():
    """
    DEV ONLY:
    Seed default A4 colors (normal) so dropdowns have values.
    Uses Firestore. You can also add descriptions from /descriptions endpoint.
    """
    from app.db import firestore_repo

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
    added = 0
    for name, hex_code in colors_data:
        created = firestore_repo.create_color(name, hex_code)
        if created is not None:
            added += 1
    return {"message": "Seed colors done", "added": added}


# ✅ ADD THIS - Run server on all network interfaces
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # ✅ Listen on ALL network interfaces (not just localhost)
        port=8000,
        reload=True
    )
