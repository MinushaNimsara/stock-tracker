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
    if json_str:
        try:
            info = json.loads(json_str)
            cred = credentials.Certificate(info)
        except Exception as e:
            raise RuntimeError(f"Invalid FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
        firebase_admin.initialize_app(cred)
    else:
        # Local: use default credentials (GOOGLE_APPLICATION_CREDENTIALS file)
        firebase_admin.initialize_app()
    _firestore_client = firestore.client()
    return _firestore_client
