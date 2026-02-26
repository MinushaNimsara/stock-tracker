# Fresh Vercel deploy (delete and try again)

Do this when the API keeps 404 or settings feel stuck. You’ll create a new project so Root Directory and build are correct from the start.

---

## Before you start

1. **GitHub is up to date**  
   Push your latest code so the repo has at the **root**:
   - `api/` (with `index.py`, `requirements.txt`)
   - `frontend/`
   - `backend/`
   - `vercel.json`

2. **Save your env vars**  
   In the **current** Vercel project go to **Settings** → **Environment Variables** and copy:
   - **DATABASE_URL** (your Supabase pooler URL)  
   You’ll add it again in the new project.

---

## Step 1: Delete (or leave) the old project

1. Go to [vercel.com](https://vercel.com) → your **stock-tracker** project.
2. **Settings** → scroll to the bottom → **Delete Project**.
3. Confirm deletion.  
   (Your GitHub repo is unchanged; only the Vercel project is removed.)

---

## Step 2: New project from the same repo

1. Vercel dashboard → **Add New…** → **Project**.
2. **Import** the same Git repository (e.g. **MinushaNimsara/stock-tracker**).
3. **Configure:**
   - **Project Name:** e.g. `stock-tracker` (or whatever you like).
   - **Root Directory:** leave **empty** (do not set `frontend`).
   - **Framework Preset:** leave as detected or set to **Other** (we use `vercel.json` for build).
   - **Build Command:** should come from `vercel.json` (`cd frontend && npm ci && npm run build`). If Vercel shows a different one, you can override with that.
   - **Output Directory:** `frontend/dist` (from `vercel.json`).
4. **Deploy** once without env vars if you want, or add **DATABASE_URL** in the next step and then deploy.

---

## Step 3: Add environment variable

1. In the **new** project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** your Supabase Session pooler URL (e.g.  
     `postgresql://postgres.jlvznibkuigbcxhfalat:Telecom%2540123rla@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`)
   - **Environments:** Production (and Preview if you use it).
3. Save.

---

## Step 4: Redeploy so env is applied

1. **Deployments** → **⋯** on the latest → **Redeploy**.
2. Wait until status is **Ready**.

---

## Step 5: Check

1. Open **https://[your-new-project].vercel.app/api/**  
   You should see JSON like `{"message":"API is running"}` (not 404).
2. Open **https://[your-new-project].vercel.app** and try Store Entry / Monthly Report.
3. If the domain changed, update any bookmarks or links (e.g. from `stock-tracker-ten-eosin.vercel.app` to the new URL).

---

## Summary

| Step | Action |
|------|--------|
| 1 | Delete old Vercel project (copy DATABASE_URL first). |
| 2 | Add New Project → import same repo, **Root Directory empty**. |
| 3 | Add **DATABASE_URL** in the new project. |
| 4 | Redeploy. |
| 5 | Test `/api/` and the app. |

Starting from a new project with Root Directory empty from the first deploy usually fixes API 404s.
