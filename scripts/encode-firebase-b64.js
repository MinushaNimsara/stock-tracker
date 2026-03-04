/**
 * Encode Firebase service account JSON to Base64 for Vercel.
 * Run: node scripts/encode-firebase-b64.js path/to/your-firebase-key.json
 * Copy the output and paste as FIREBASE_SERVICE_ACCOUNT_B64 in Vercel.
 */
const fs = require('fs');
const path = process.argv[2];
if (!path || !fs.existsSync(path)) {
  console.error('Usage: node scripts/encode-firebase-b64.js path/to/your-firebase-key.json');
  process.exit(1);
}
const json = fs.readFileSync(path, 'utf8');
const b64 = Buffer.from(json).toString('base64');
console.log('\nCopy this value for FIREBASE_SERVICE_ACCOUNT_B64 in Vercel:\n');
console.log(b64);
console.log('\n');
