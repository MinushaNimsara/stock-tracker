"""
Firebase Firestore client. No Supabase/PostgreSQL needed.
Set one of:
  - FIREBASE_SERVICE_ACCOUNT_PATH (path to .json file) - easiest for local dev
  - FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string)
  - FIREBASE_SERVICE_ACCOUNT_B64 (base64-encoded JSON - avoids escaping issues)
"""
import os
import json
import base64
from pathlib import Path

_firestore_client = None


def get_firestore():
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        raise RuntimeError("Install firebase-admin: pip install firebase-admin")

    # Already initialized (e.g. serverless warm start)
    if firebase_admin._apps:
        _firestore_client = firestore.client()
        return _firestore_client

    json_str = None
    path_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if path_str and path_str.strip():
        p = Path(path_str)
        if not p.is_absolute():
            _base = Path(__file__).resolve().parent.parent  # backend/
            p = (_base / path_str).resolve()
        if p.exists():
            json_str = p.read_text(encoding="utf-8")
        else:
            raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_PATH file not found: {p}")

    if not json_str:
        b64_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64")
        if b64_str and b64_str.strip():
            try:
                json_str = base64.b64decode(b64_str).decode("utf-8")
            except Exception as e:
                raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_B64 decode failed: {e}")
        else:
            json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if not json_str or not json_str.strip():
        raise RuntimeError(
            "Firebase credentials missing. "
            "Local dev: set FIREBASE_SERVICE_ACCOUNT_PATH=path/to/your-key.json in backend/.env, "
            "or use FIREBASE_SERVICE_ACCOUNT_B64. See VERCEL_FIREBASE_SETUP.md"
        )

    try:
        info = json.loads(json_str)
        cred = credentials.Certificate(info)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Firebase JSON invalid: {e}")
    except Exception as e:
        raise RuntimeError(f"Firebase credentials error: {e}")
    firebase_admin.initialize_app(cred)
    _firestore_client = firestore.client()
    return _firestore_client
