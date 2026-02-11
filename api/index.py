"""
Vercel serverless entry: mounts backend API at /api.
Set DATABASE_URL in Vercel env to your Neon PostgreSQL URL (required for DB routes).
"""
import os
import sys

# Add backend to path so "from app.main" works
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

try:
    from fastapi import FastAPI
    from mangum import Mangum
    from app.main import app as backend_app

    app = FastAPI(title="Stock Tracker API Gateway")
    app.mount("/api", backend_app)
    handler = Mangum(app)
except Exception as e:
    # If backend fails to load (e.g. missing DATABASE_URL, import error), expose a minimal app
    from fastapi import FastAPI
    from mangum import Mangum
    app = FastAPI(title="Stock Tracker API")
    _load_error = str(e)

    @app.get("/api")
    @app.get("/api/")
    def _fail():
        return {
            "error": "Backend failed to start",
            "hint": "Add DATABASE_URL (Neon PostgreSQL) in Vercel Environment Variables, then redeploy.",
            "detail": _load_error,
        }
    handler = Mangum(app)
