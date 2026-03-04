# Set up Firebase on Vercel

The app needs `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel so it can connect to Firestore.

## Verify setup

After redeploying, visit: `https://your-app.vercel.app/api/health`  
- If it returns `{"status":"ok","firestore":"connected"}` → Firebase is working.  
- If it shows an error → the message will tell you what to fix.

## Step 1: Get your Firebase service account key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click the gear icon → **Project settings**
4. Open the **Service accounts** tab
5. Click **Generate new private key** → Confirm
6. A JSON file will download (e.g. `your-project-firebase-adminsdk-xxxxx.json`)

## Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Open your project (e.g. **stock-tracker-phi-mocha**)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON` (exactly this, no typos)
   - **Value:** Open the JSON file in a text editor, copy the **entire contents** (everything from `{` to `}`). Paste as **one single line** — remove any line breaks. Example format: `{"type":"service_account","project_id":"...","private_key_id":"...",...}`
   - **Environment:** Production (and Preview if you use it)
5. Click **Save**

## Step 3: Redeploy

1. Go to **Deployments**
2. Click the **⋮** menu on the latest deployment
3. Click **Redeploy**
4. Wait 1–2 minutes for the build to finish

## Step 4: Test login

- Username: `admin`
- Password: `RLA_store_8585`

On first login, the master admin user is created automatically if no users exist.
