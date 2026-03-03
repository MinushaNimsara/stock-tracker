# Vercel checklist – fix "Network Error"

I can’t log into your Vercel account. Do these checks yourself; they fix most "Network Error" cases.

---

## 1. Root Directory (most common cause)

If this is wrong, the API is never deployed and `/api` returns 404 → "Network Error".

1. Go to [vercel.com](https://vercel.com) → your **stock-tracker** project.
2. **Settings** → **General**.
3. Find **Root Directory**.
4. Set it correctly:
   - **Repo root** has `vercel.json`, `api/`, `frontend/`, `backend/` → leave **empty** (or `.`)
   - **Repo root** is parent (e.g. "Stock Tracker") and code is in `a4-format-stock-tracker/` → set **`a4-format-stock-tracker`**
5. Save. If you see "Root Directory does not exist", the path is wrong for your repo structure.
6. Go to **Deployments** → **Redeploy**.

---

## 2. Test the API directly

After redeploying, open this URL in your browser:

**https://stock-tracker-phi-mocha.vercel.app/api/**

- You see **`{"message":"API is running"}`** (or similar JSON) → API works. If the app still shows Network Error, hard refresh the app (Ctrl+F5) or try another page.
- You see **404** → API is not deployed. Fix **Root Directory** (step 1) and redeploy.
- You see **500 / "Function crashed"** → API runs but fails. Check **step 3** and **4**.

---

## 3. Environment variable FIREBASE_SERVICE_ACCOUNT_JSON

1. In the same project: **Settings** → **Environment Variables**.
2. There must be a variable **`FIREBASE_SERVICE_ACCOUNT_JSON`** = full JSON from Firebase service account key.
3. It must be set for **Production** (and Preview if you use it).
4. If you changed it, **Redeploy** again (env vars apply on next deploy).

---

## 4. Check function logs (if API returns 500)

1. **Deployments** → open the latest deployment.
2. Go to **Functions** (or **Logs**).
3. Find the `/api` (or `api/index`) function and open its logs.
4. Look for a Python traceback or error message (e.g. missing module, database connection error). That tells you what to fix.

---

## 5. Repo content

Your GitHub repo should have this shape (so Vercel can build frontend and API):

- **Root:** `vercel.json`, `api/`, `frontend/`, `backend/`
- **Not** only `frontend/` at root.

If you connected Vercel to a repo that only has the frontend folder, connect it instead to the repo that has **api**, **backend**, **frontend**, and **vercel.json** at the root, and set Root Directory to empty.

---

## Summary

| Check              | Where                         | What to do                          |
|--------------------|--------------------------------|-------------------------------------|
| Root Directory     | Settings → General             | Empty (not `frontend`)              |
| FIREBASE_SERVICE_ACCOUNT_JSON | Settings → Environment Variables| Set for Production, then redeploy   |
| MASTER_ADMIN_API_KEY | Settings → Environment Variables | Optional. Set a secret key for Admin Upload (store list). Share only with Master Admin. |
| Test /api/         | Browser                        | Open `/api/` → expect JSON, not 404 |
| Logs               | Deployments → Functions/Logs   | Read error if /api/ returns 500     |

After step 1 + redeploy, test **https://stock-tracker-phi-mocha.vercel.app/api/** again.
