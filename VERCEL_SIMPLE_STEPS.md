# Easiest way to deploy – do only this

You’re on the **New Project** page with your repo imported. Do these steps in order.

---

## On the New Project page (right now)

### Step 1: Root Directory
- Find the **Root Directory** field.
- If it shows **`./`** → **do nothing**, leave it as is.
- If it’s empty → **do nothing**, leave it empty.
- **Do not** type `frontend` or anything else.

### Step 2: Don’t open “Build and Output Settings”
- Leave **Build and Output Settings** closed (don’t expand it).
- The repo’s `vercel.json` already has the right build command and output. Vercel will use them.

### Step 3: Click Deploy
- Scroll down and click the **Deploy** button.
- Wait until the deployment finishes (can take 1–2 minutes).

---

## After the first deployment is done

### Step 4: Add the database URL
1. In the new project, open **Settings** (top menu).
2. In the left sidebar, click **Environment Variables**.
3. Click **Add** (or **Add New**).
4. **Name:** type `DATABASE_URL`
5. **Value:** paste this (your Supabase URL; one line, no spaces):
   ```
   postgresql://postgres.jlvznibkuigbcxhfalat:Telecom%2540123rla@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
6. **Environment:** choose **Production** (and **Preview** if you want).
7. Click **Save**.

### Step 5: Redeploy once
1. Open **Deployments** (top menu).
2. Find the latest deployment and click the **⋯** (three dots).
3. Click **Redeploy** and confirm.
4. Wait until the new deployment is **Ready**.

---

## Check that it works

1. Open your app URL (e.g. `https://stock-tracker-xxxx.vercel.app`).
2. In the same URL, add `/api/` at the end (e.g. `https://stock-tracker-xxxx.vercel.app/api/`).
3. You should see something like: `{"message":"API is running"}`.
4. Go back to the main app URL and try **Store Entry** or **Monthly Report**.

---

## Summary

| Where        | What to do |
|-------------|------------|
| New Project | Leave Root Directory as `./` or empty. Don’t open Build settings. Click **Deploy**. |
| After deploy| **Settings** → **Environment Variables** → Add **DATABASE_URL** → Save. |
| Then       | **Deployments** → **⋯** → **Redeploy**. |
| Then       | Open **your-url.vercel.app/api/** and test the app. |

That’s all. The rest is already in your repo.
