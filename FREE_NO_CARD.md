# Use the app for FREE – no credit card

You have **two ways** to run the app without paying or adding a card.

---

## Option 1: Firebase Firestore (recommended – no card)

This app uses **Firebase Firestore** as the database. Free tier, no credit card.

1. Create a project at [Firebase Console](https://console.firebase.google.com/), enable Firestore.
2. Get the **service account JSON** (Project settings → Service accounts → Generate new private key).
3. In **Vercel** → Settings → Environment Variables → add **`FIREBASE_SERVICE_ACCOUNT_JSON`** = full JSON string.
4. Redeploy. Then POST to `/api/seed-data` once to seed default colors.

Full steps: see **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**.

---

## Option 1b: Neon or Supabase (legacy – app now uses Firebase)

If you previously used Neon/Supabase, this project has **moved to Firebase**. Use Option 1 above. The following is kept for reference only.

### Neon

1. Go to **[neon.tech](https://neon.tech)** and sign up (e.g. with GitHub or email).
2. Create a new project.
3. Copy the **connection string** (PostgreSQL URL).
4. In **Vercel** → your project → **Settings** → **Environment Variables** → add **`DATABASE_URL`** = that URL.
5. Redeploy.

If any page asks for a card, **skip it** or go back – the **Free** plan does not need it. Only paid plans ask for a card.

### Supabase (alternative)

1. Go to **[supabase.com](https://supabase.com)** and sign up (e.g. with GitHub).
2. New project → wait for it to be ready.
3. **Settings** → **Database** → copy the **Connection string** (URI).
4. In Vercel add **`DATABASE_URL`** = that URL (use “URI” format).
5. Redeploy.

Same as Neon: **Free** plan = no card. Ignore any “Upgrade” or “Add payment” for now.

---

## Option 2: No cloud at all – use your PC as the server (100% free, no signup for DB)

No database signup, no card, no cloud DB. The **frontend** stays on Vercel; the **backend** runs on your computer. When your PC is on and the backend is running, the site works from anywhere.

### Step 1: Run the backend on your PC

On your computer (in the project folder):

```bash
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Leave this window open. Your backend is now at `http://localhost:8000` (and on your LAN).

### Step 2: Expose it to the internet with a free tunnel

Use a **free tunnel** so the internet can reach your PC (no card, free tier):

**A) localhost.run (no install, no signup)**  
In a **new** terminal (PowerShell or CMD):

```bash
ssh -R 80:localhost:8000 nokey@localhost.run
```

It will print a URL like `https://xxxx.lhr.life`. Copy that URL. Leave this terminal open.

**B) Or use ngrok (after signup, still free)**  
- Install from [ngrok.com](https://ngrok.com), sign up (free), then run:

```bash
ngrok http 8000
```

Copy the `https://xxxx.ngrok.io` URL it shows.

### Step 3: Point the Vercel frontend to your tunnel URL

1. **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** the tunnel URL (e.g. `https://xxxx.lhr.life` or `https://xxxx.ngrok.io`) – **no trailing slash**
   - **Environment:** Production
3. Save, then **Redeploy** the frontend (Deployments → Redeploy).

### Step 4: Use the app

- Open **https://stock-tracker-ten-eosin.vercel.app** – it will call your PC’s backend through the tunnel.
- Keep **both** running: (1) backend (`uvicorn`), (2) tunnel (`ssh` or `ngrok`).
- When you turn off your PC or stop the backend, the site will show “Network Error” until you start them again.

**Pros:** Free, no card, no cloud DB.  
**Cons:** App only works when your PC is on and the tunnel is running.

---

## Summary

| Option | Card? | Cost | When it works |
|--------|--------|------|----------------|
| **1 – Neon/Supabase** | No | Free | 24/7 (cloud) |
| **2 – Your PC + tunnel** | No | Free | When your PC and tunnel are running |

If a site asks for a card, you’re on a **paid** path – go back and choose the **Free** plan or use Option 2.
