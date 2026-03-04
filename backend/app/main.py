from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.routers.descriptions import router as descriptions_router
from app.routers.colors import router as colors_router
from app.routers.stock_entries import router as stock_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
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
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_upload_router)
app.include_router(descriptions_router)
app.include_router(colors_router)
app.include_router(stock_router)

@app.get("/")
def root():
    return {"message": "API is running"}


@app.get("/health")
def health():
    """Check Firestore connection. Helps debug FIREBASE_SERVICE_ACCOUNT_JSON."""
    try:
        from app.db.firestore_client import get_firestore
        db = get_firestore()
        # Quick read to verify connection
        list(db.collection("users").limit(1).stream())
        return {"status": "ok", "firestore": "connected"}
    except Exception as e:
        return {
            "status": "error",
            "firestore": "failed",
            "message": str(e),
            "hint": "Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel → Settings → Environment Variables",
        }

@app.post("/seed-data")
def seed_data():
    """
    DEV ONLY:
    Seed default A4 colors and master admin if missing.
    Master admin: username=admin, password=RLA_store_8585
    """
    from app.db import firestore_repo
    from app.core.auth import MASTER_ADMIN_HASH

    # Seed master admin if no users exist
    existing_users = firestore_repo.list_users()
    if not existing_users:
        firestore_repo.create_user(
            username="admin",
            password_hash=MASTER_ADMIN_HASH,
            role="admin",
            active=True,
        )

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
