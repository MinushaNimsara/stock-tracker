"""
Vercel serverless entry: mounts backend API at /api.
Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel env (full JSON string) for Firestore.

Vercel expects `app` (ASGI) - not Mangum/Lambda handler.
"""
import os
import sys
import traceback

# Add backend to path so "from app.main" works
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_path)

from fastapi import FastAPI

_load_error = None
_backend_err = None
backend_app = None

try:
    from app.main import app as _backend_app

    backend_app = _backend_app
except Exception as e:
    _load_error = traceback.format_exc()
    _backend_err = e
    try:
        print(_load_error, file=sys.stderr)
    except Exception:
        pass

# Main app: mount backend at /api so /api/descriptions, /api/colors etc work
app = FastAPI(title="Stock Tracker API Gateway")

if backend_app is not None:
    app.mount("/api", backend_app)
else:
    err_msg = str(_backend_err) if _backend_err else "Unknown error"

    @app.get("/api")
    @app.get("/api/")
    def _fail():
        return {
            "error": "Backend failed to start",
            "hint": "Check Vercel Function logs. Add FIREBASE_SERVICE_ACCOUNT_JSON and ensure api/requirements.txt deps are installed.",
            "detail": err_msg,
            "traceback": _load_error,
        }
