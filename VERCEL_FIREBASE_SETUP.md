# Set up Firebase on Vercel

The app needs Firebase credentials in Vercel. Use **Option B (Base64)** if Option A causes issues.

## Verify setup

After redeploying, visit: `https://your-app.vercel.app/api/health`  
- `{"status":"ok","firestore":"connected"}` → working.  
- Error message → tells you what to fix.

---

## Option A: FIREBASE_SERVICE_ACCOUNT_JSON

### Step 1: Get your Firebase service account key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click the gear icon → **Project settings**
4. Open the **Service accounts** tab
5. Click **Generate new private key** → Confirm
6. A JSON file will download (e.g. `your-project-firebase-adminsdk-xxxxx.json`)

### Step 2: Add to Vercel

- **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
- **Value:** Copy the **entire** JSON file. Paste as **one line** (no line breaks).
- **Environment:** Production

---

## Option B: FIREBASE_SERVICE_ACCOUNT_B64 (recommended if A fails)

Base64 avoids JSON escaping issues in Vercel.

1. Download the Firebase JSON key (same as Step 1 above).
2. Encode it to Base64:
   - **Windows PowerShell:** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\your-key.json"))`
   - **Online:** Use a base64 encoder, paste the JSON, encode.
3. In Vercel → **Settings** → **Environment Variables**:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value:** The base64 string (one long line, no spaces)
   - **Environment:** Production
4. Save and redeploy.

---

## Redeploy

1. Go to **Deployments**
2. Click the **⋮** menu on the latest deployment
3. Click **Redeploy**
4. Wait 1–2 minutes for the build to finish

## Test login

- Username: `admin`
- Password: `RLA_store_8585`

On first login, the master admin user is created automatically if no users exist.

## Reset admin password (if login fails)

If you get "Invalid username or password" and you're sure the password is correct:

1. Add `RESET_ADMIN_KEY` in Vercel env (e.g. `my-secret-123`)
2. Redeploy
3. Call: `POST https://your-app.vercel.app/api/auth/reset-admin?key=my-secret-123`
4. Try logging in again with admin / RLA_store_8585
