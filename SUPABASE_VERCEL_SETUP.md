# Supabase + Vercel – Database configuration

## Your details (double-checked)

| Item | Value |
|------|--------|
| **Project URL** | `https://jlvznibkuigbcxhfalat.supabase.co` |
| **Project ref** | `jlvznibkuigbcxhfalat` |
| **Region** | South Asia (Mumbai) → `ap-south-1` |
| **DB password** | `Telecom%40123rla` (no @; use `%25` for `%` in URL) |

---

## Important: use Session pooler, not Direct

- **Direct** (`db....supabase.co:5432`) is **not IPv4 compatible** → Vercel cannot use it.
- **Session pooler** (`...pooler.supabase.com:6543`) works from Vercel.

In Supabase: **Connect** → **Connection string** → set **Method** to **Session pooler**, then copy the URI.

---

## DATABASE_URL for Vercel (Supabase)

Replace `[YOUR-PASSWORD]` with your real password.  
If the password is `Telecom@123`, the `@` must be **URL-encoded** as `%40` inside the URL.

**Option A – Build it yourself**

1. In Supabase: **Connect** → **Connection string** → **Session pooler**.
2. Copy the URI (it will have `[YOUR-PASSWORD]` in it).
3. Replace `[YOUR-PASSWORD]` with your password. If it's `Telecom%40123rla`, in the URL use `Telecom%2540123rla` (encode `%` as `%25`).
4. Paste that full string into Vercel as **DATABASE_URL**.

**Option B – Use this template (Mumbai / ap-south-1)**

If your Supabase DB password is **Telecom%40123rla** (no @), use this (the `%` in the password is encoded as `%25` in the URL):

```
postgresql://postgres.jlvznibkuigbcxhfalat:Telecom%2540123rla@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

- Copy the line above (one line, no spaces).
- In **Vercel** → **Settings** → **Environment Variables**:
  - **Name:** `DATABASE_URL`
  - **Value:** paste that string
  - **Environments:** Production (and Preview if you use it).
- Save, then **Redeploy**.

---

## What your Stock Tracker app actually uses

- **Backend (API on Vercel)** uses **only** `DATABASE_URL` to talk to PostgreSQL (Supabase).  
  It does **not** use:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Publishable key

So for the **backend** to work with Supabase, the only required env var in Vercel is **DATABASE_URL** (Session pooler URI with your password).

You can keep `NEXT_PUBLIC_SUPABASE_*` for future frontend features; they don’t affect the current API.

---

## Current issue in your Vercel project

From your screenshots, **DATABASE_URL** in Vercel is set to **Neon**:

- `postgresql://neondb_owner:npg_F...@ep-lively-flower-...neon.tech/neondb?...`

So the API is using **Neon**, not **Supabase**.

- If you want **Supabase**: replace **DATABASE_URL** with the Supabase **Session pooler** string (Option A or B above), then redeploy.
- If you want **Neon**: leave **DATABASE_URL** as it is; no change needed for DB config.

---

## After changing DATABASE_URL

1. **Redeploy** the project (Deployments → Redeploy).
2. Open **https://stock-tracker-ten-eosin.vercel.app/api/**  
   You should see something like: `{"message":"API is running"}`.
3. Seed colors once (browser console on your site):  
   `fetch('/api/seed-data', { method: 'POST' }).then(r => r.json()).then(console.log)`
