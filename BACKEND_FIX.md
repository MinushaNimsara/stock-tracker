# Fix "Network Error" or "Serverless Function has crashed" (500) on Vercel

- **"Network Error"** = frontend can't reach the API (e.g. Root Directory was `frontend`, so `/api` didn't exist).
- **"This Serverless Function has crashed" (500)** = the API is invoked but the Python function crashes, usually because **`DATABASE_URL` is not set** or the DB connection fails. **Fix: add `DATABASE_URL` (Neon) in Vercel → Settings → Environment Variables, then redeploy.**

---

## Option 1: Fix Vercel so the API is deployed (same project)

Your repo has an `api/` folder that should run as a serverless backend. If the API was never deployed, do this:

### 1. Check Root Directory

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your project **stock-tracker-ten-eosin** (or whatever it’s called).
2. Go to **Settings** → **General**.
3. Under **Root Directory**, make sure it is **empty** or **`.`** (repo root).  
   If it is set to `frontend`, the `api/` folder is ignored and `/api` will not work.  
   **Change it to empty**, then save.

### 2. Add database (required for API)

1. Create a free PostgreSQL DB at **[Neon](https://neon.tech)** and copy the connection string.
2. In Vercel → **Settings** → **Environment Variables** add:
   - **Name:** `DATABASE_URL`
   - **Value:** your Neon URL (e.g. `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
   - **Environment:** Production (and Preview if you use it).

### 3. Redeploy

1. **Deployments** → open the **⋯** on the latest deployment → **Redeploy** (or push a new commit).
2. After deploy, test: open  
   `https://stock-tracker-ten-eosin.vercel.app/api/`  
   You should see something like `{"message":"API is running"}` or similar from the backend.

### 4. Seed colors (first time)

- POST to: `https://stock-tracker-ten-eosin.vercel.app/api/seed-data`  
  (e.g. in browser console on your site:  
  `fetch('/api/seed-data', { method: 'POST' }).then(r => r.json()).then(console.log)`)

If **Option 1** still gives 404 on `/api` or the API never works, use **Option 2**.

---

## Option 2: Backend on Railway (recommended if Vercel API fails)

Run the backend on Railway and point the frontend to it.

### 1. Create Neon database

- Go to [Neon](https://neon.tech) → create project → copy the **connection string**.

### 2. Deploy backend on Railway

1. Go to [Railway](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo** → select **MinushaNimsara/stock-tracker** (or your repo).
3. When asked for root directory, set **Root Directory** to **`backend`** (so Railway builds the Python app).
4. In the new service → **Variables** → add:
   - **Name:** `DATABASE_URL`  
   - **Value:** your Neon connection string
5. **Settings** → **Deploy** → set **Start Command** to:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Deploy. Then open **Settings** → **Networking** → **Generate Domain**. Copy the URL (e.g. `https://stock-tracker-backend-production-xxxx.up.railway.app`).

### 3. Point frontend to Railway

1. In **Vercel** → your **frontend** project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** your Railway URL (e.g. `https://stock-tracker-backend-production-xxxx.up.railway.app`) — **no trailing slash**
   - **Environment:** Production
3. Save, then **Redeploy** the frontend (Deployments → Redeploy, or push a commit).

### 4. Seed colors (first time)

- Open: `https://YOUR-RAILWAY-URL/seed-data` and send a **POST** request (e.g. Postman or browser console from any site:  
  `fetch('https://YOUR-RAILWAY-URL/seed-data', { method: 'POST' }).then(r => r.json()).then(console.log)`).

After this, **https://stock-tracker-ten-eosin.vercel.app** will use the Railway backend and the "Network Error" should be gone.
