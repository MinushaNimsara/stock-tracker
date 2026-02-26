# Fix API 404 – Backend Not Deploying

If `/api` returns **404**, the API folder is not being deployed. Do these steps **in order**.

---

## Step 1: Root Directory (MOST IMPORTANT)

1. Go to [vercel.com](https://vercel.com) → your **stock-tracker** project.
2. **Settings** → **General**.
3. Find **Root Directory**.
4. **It must be empty** (or `.`).  
   - If it says `frontend`, **clear it** and leave it blank.
5. Click **Save**.

---

## Step 2: Add Firebase Credentials

1. **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** Paste the **entire** JSON from your Firebase service account key file.
   - **Environment:** Production ✓
3. Save.

---

## Step 3: Push Code & Redeploy

1. Push the latest code to GitHub (including the `api/` folder).
2. In Vercel: **Deployments** → **⋮** on latest → **Redeploy**.

---

## Step 4: Test

After redeploy, open:

- **https://stock-tracker-phi-mocha.vercel.app/api/**

- If you see `{"message":"API is running"}` → **Success!**
- If you still see **404** → Root Directory is still wrong. Set it to empty and redeploy again.
- If you see **500** or an error JSON → Check **Deployments** → **Functions** → **Logs** for the traceback.

---

## Step 5: Seed Default Colors (once)

When the API works, visit:

**https://stock-tracker-phi-mocha.vercel.app/api/seed-data**

This adds the default A4 colors (White, Pink, Yellow, etc.) to your database.
