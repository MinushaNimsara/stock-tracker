# Firebase (Firestore) setup – Stock Tracker

The app uses **Firebase Firestore** instead of Supabase/PostgreSQL. No credit card required for the free tier.

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. **Add project** → name it (e.g. `stock-tracker`) → disable Google Analytics if you like → Create.
3. In the project, go to **Build → Firestore Database** → **Create database** → Start in **test mode** (or production with rules later) → choose a region → Enable.

## 2. Get the service account key (for backend/Vercel)

1. In Firebase: **Project settings** (gear) → **Service accounts**.
2. Click **Generate new private key** → download the JSON file.
3. Open the JSON file and copy its **entire contents** (one line or pretty-printed – both work).

## 3. Vercel environment variable

1. Vercel → your project → **Settings → Environment Variables**.
2. Add:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** paste the full JSON (the whole `{"type":"service_account", ...}` object).
3. Save and **redeploy** the project.

## 4. Local development (optional)

- **Option A:** Put the same JSON in a file (e.g. `backend/firebase-key.json`), then set:
  - `GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-key.json`
  - Do **not** commit this file (it’s in `.gitignore`).
- **Option B:** Set `FIREBASE_SERVICE_ACCOUNT_JSON` in a `.env` file with the full JSON string (same as Vercel).

## 5. Seed default colors

After the first deploy:

1. Open: `https://your-app.vercel.app/api/seed-data`
2. Send a **POST** request (e.g. from browser dev tools or Postman), or use:  
   `curl -X POST https://your-app.vercel.app/api/seed-data`
3. This creates the default A4 colors in Firestore. Add descriptions from the app or via the `/descriptions` API.

## 6. Firestore indexes (if needed)

If the **monthly report** returns an error about a missing index, Firestore will show a link in the error. Open that link to create the composite index (e.g. collection `stock_entries`, fields `description_id` + `entry_date`). Then wait a few minutes and try again.

## Summary

| Item | Value |
|------|--------|
| Env var (Vercel) | `FIREBASE_SERVICE_ACCOUNT_JSON` = full service account JSON |
| Local (optional) | `GOOGLE_APPLICATION_CREDENTIALS` = path to JSON file, or same env as above |
| Seed | POST `/api/seed-data` once after deploy |

No `DATABASE_URL` or Supabase is needed anymore.
