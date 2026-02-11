"""
Vercel serverless entry: mounts backend API at /api so that
https://your-app.vercel.app/api/descriptions, /api/colors, /api/stock/... work.
Set DATABASE_URL in Vercel env to your Neon (or other) PostgreSQL URL.
"""
import os
import sys

# Add backend to path so "from app.main" works
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from fastapi import FastAPI
from mangum import Mangum

from app.main import app as backend_app

# Parent app: Vercel invokes this at /api, so all requests have path /api/...
# Mount backend so /api/descriptions -> backend /descriptions, etc.
app = FastAPI(title="Stock Tracker API Gateway")
app.mount("/api", backend_app)

# Vercel serverless handler
handler = Mangum(app)
