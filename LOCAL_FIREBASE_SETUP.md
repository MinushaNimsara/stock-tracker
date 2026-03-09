# Local Firebase Setup

To run the app locally, Firebase credentials must be set.

## Quick setup (recommended)

1. **Download** your Firebase service account key:
   - [Firebase Console](https://console.firebase.google.com/) → your project → ⚙️ Project settings → Service accounts
   - Click **Generate new private key** (or use existing)

2. **Save** the downloaded JSON file as:
   ```
   a4-format-stock-tracker/firebase-key.json
   ```
   (Same folder as `backend/` and `frontend/`)

3. **Restart** the backend:
   ```bash
   cd a4-format-stock-tracker/backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

The `backend/.env` file already points to `../firebase-key.json`.

---

**Note:** `firebase-key.json` is in `.gitignore` – do not commit it.
