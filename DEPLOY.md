# Deploy Stock Tracker: Cloud Backend + Database (run from any PC)

Your frontend is on Vercel: **https://stock-tracker-ten-eosin.vercel.app**  
To make the app work from any PC you need:
1. **Cloud database** – Neon PostgreSQL (free)
2. **Backend in the cloud** – either on Vercel (same project) or on Railway (recommended if Vercel API gives 404)

**Option A** below: Backend on Vercel (all-in-one).  
**Option B**: Backend on Railway (often more reliable for FastAPI).

---

## Step 1: Create a free cloud database (Neon) – do this first for both options

1. Go to **[Neon](https://neon.tech)** and sign up (free).
2. Create a new project (e.g. "stock-tracker").
3. Copy the **connection string** (PostgreSQL URL). It looks like:
   ```text
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   Or as **postgres://** – both work; the backend converts `postgres://` to `postgresql+psycopg2://`.

Keep this URL for Step 3.

---

## Option A: Backend on Vercel (same project)

### Step A2: Deploy from this repo (Vercel)

1. In **[Vercel Dashboard](https://vercel.com/dashboard)** → your project (or **Add New → Project**).
2. **Import** this Git repository (or upload the `a4-format-stock-tracker` folder).
3. **Root Directory:** leave as repo root (so Vercel sees `api/`, `backend/`, `frontend/`).
4. **Build settings** (from `vercel.json`):
   - Build Command: `cd frontend && npm ci && npm run build`
   - Output Directory: `frontend/dist`
5. Do **not** deploy yet – add the env var next.

### Step A3: Add database URL in Vercel

1. In the project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** paste your Neon connection string (from Step 1).
   - **Environment:** Production (and Preview if you use preview deploys).
3. Save.

### Step A4: Deploy

1. Click **Deploy** (or push to Git if the project is connected).
2. Wait for the build to finish.
3. Open your app: **https://stock-tracker-ten-eosin.vercel.app** (or your project URL).

If **/api/descriptions** or other API routes return 404, use **Option B** (Railway backend) below.

### Step A5: Seed default colors (first time)

After the first deploy, call the seed endpoint once so the dropdown has A4 colors.

**URL (POST):**
```text
https://stock-tracker-ten-eosin.vercel.app/api/seed-data
```
(Replace with your own Vercel domain if different.)

**From browser console (on your deployed site):**
```js
fetch('/api/seed-data', { method: 'POST' }).then(r => r.json()).then(console.log)
```
You should see something like `{ "message": "Seed colors done", "added": 10 }`.

---

## Option B: Backend on Railway (recommended if Vercel API 404s)

1. **Create Neon DB** (Step 1 above) and copy the connection string.
2. Go to **[Railway](https://railway.app)** → Sign up → **New Project** → **Deploy from GitHub repo** (or upload the `a4-format-stock-tracker` folder; select the **backend** folder as root, or deploy the repo and set **Root Directory** to `backend`).
3. In Railway project → **Variables** → add:
   - `DATABASE_URL` = your Neon PostgreSQL URL
4. Railway will run `pip install -r requirements.txt` and needs a start command. Add in **Settings** → **Deploy**:
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Deploy. Copy the public URL (e.g. `https://your-app.railway.app`).
6. **Point the frontend to this backend:** In your **Vercel** project → **Settings** → **Environment Variables** add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-app.railway.app` (no trailing slash)
   - **Environment:** Production
7. **Redeploy** the frontend on Vercel so it picks up `VITE_API_URL`. The frontend will then call the Railway backend from any PC.
8. Seed colors: open `https://your-app.railway.app/seed-data` in the browser and send a POST (or use Postman: POST that URL).

---

## How it works

| Part           | Where it runs | URL |
|----------------|----------------|-----|
| Frontend (React) | Vercel        | `https://stock-tracker-ten-eosin.vercel.app/` |
| Backend (FastAPI) | Vercel (Option A) or Railway (Option B) | Same domain `/api/...` or Railway URL |
| Database       | Neon (cloud)   | Used only by backend via `DATABASE_URL` |

- **Option A:** Frontend calls `/api` (same domain).  
- **Option B:** Frontend calls `VITE_API_URL` (Railway). No need to run anything on your PC.

---

## Local development

- **Backend (your PC):**  
  `cd backend` → activate venv → `uvicorn app.main:app --reload`  
  Uses SQLite by default (or set `DATABASE_URL` to Neon).
- **Frontend:**  
  `cd frontend` → `npm run dev`  
  Uses `http://127.0.0.1:8000` unless you set `VITE_API_URL` in `frontend/.env`.

---

## Troubleshooting

- **"Error loading data" / CORS:** Backend is at `/api` on the same domain; CORS is already set for `*`. If you use a different frontend URL, add it to CORS in `backend/app/main.py`.
- **Database errors:** Check that `DATABASE_URL` in Vercel is the full Neon URL and that the Neon project is not paused (free tier can pause after inactivity).
- **502 / timeout:** Vercel serverless has a 10–60 s limit. For very heavy reports, consider moving the backend to Railway or Render and pointing the frontend to that URL via `VITE_API_URL` (or a build-time env).
