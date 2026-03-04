"""
Firebase Firestore client. No Supabase/PostgreSQL needed.
Set in Vercel env:
  - FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string), OR
  - FIREBASE_SERVICE_ACCOUNT_B64 (base64-encoded JSON - avoids escaping issues)
"""
import os
import json
import base64

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
    b64_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64")

    if b64_str and b64_str.strip():
        try:
            json_str = base64.b64decode(b64_str).decode("utf-8")
        except Exception as e:
            raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_B64 decode failed: {e}")
    elif not json_str or not json_str.strip():
        raise RuntimeError(
            "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_B64 in Vercel. "
            "See VERCEL_FIREBASE_SETUP.md"
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
