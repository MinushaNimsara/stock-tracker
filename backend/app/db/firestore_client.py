"""
Firebase Firestore client. No Supabase/PostgreSQL needed.
Set FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string) in Vercel env, or
GOOGLE_APPLICATION_CREDENTIALS (path to JSON file) for local.
"""
import os
import json

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

    json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not json_str or not json_str.strip():
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON is not set. "
            "Add it in Vercel: Settings → Environment Variables. "
            "Value = full JSON from Firebase Console → Project settings → Service accounts → Generate key."
        )
    try:
        info = json.loads(json_str)
        cred = credentials.Certificate(info)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"Invalid FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
    firebase_admin.initialize_app(cred)
    _firestore_client = firestore.client()
    return _firestore_client
