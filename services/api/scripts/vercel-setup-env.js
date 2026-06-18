/**
 * ET-Ticket Platform — Vercel Environment Variable Setter
 * =======================================================
 * Reads values from your .env file and pushes them to Vercel
 * as production environment variables.
 *
 * Usage:
 *   cd services/api
 *   node scripts/vercel-setup-env.js
 *
 * Prerequisites:
 *   - Vercel CLI installed (npm i -g vercel)
 *   - Logged into Vercel (vercel login)
 *   - Linked to your project (vercel link)
 *   - .env file with all your Supabase + API credentials
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '..', '.env');
const VERCEL_PROJECT = process.env.VERCEL_PROJECT || undefined;

// Environment variables to push to Vercel (keyed by name)
// Only include non-comment, non-empty lines
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const eqIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key && value) {
      vars[key] = value;
    }
  }

  return vars;
}

function setVercelEnv(key, value) {
  console.log(`  Setting ${key}...`);

  // Remove existing first (ignore error if doesn't exist)
  try {
    execSync(`npx vercel env rm ${key} production -y`, {
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (e) {
    // OK if it doesn't exist yet
  }

  // Add the variable
  try {
    execSync(`npx vercel env add ${key} production --value="${value}"`, {
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '..')
    });
    console.log(`  ✅ ${key} set`);
  } catch (e) {
    console.error(`  ❌ Failed to set ${key}:`, e.message);
  }
}

function main() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     ET-TICKET — VERCEL ENV VAR SETUP                  ║
╚════════════════════════════════════════════════════════╝
`);

  if (!fs.existsSync(ENV_PATH)) {
    console.error(`❌ .env file not found at ${ENV_PATH}`);
    console.error('   Copy .env.example to .env first and fill in your values.');
    process.exit(1);
  }

  // Key vars to push (in order of importance)
  const REQUIRED_KEYS = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'REDIS_URL',
    'CHAPA_SECRET_KEY',
    'TELEBIRR_MERCHANT_APP_ID',
    'TELEBIRR_FABRIC_APP_ID',
    'TELEBIRR_SHORT_CODE',
    'TELEBIRR_APP_SECRET',
    'TELEBIRR_PRIVATE_KEY',
    'TELEBIRR_API_URL',
    'STORAGE_TYPE',
    'NODE_ENV',
    'API_URL',
  ];

  const allVars = parseEnvFile(ENV_PATH);
  console.log(`Found ${Object.keys(allVars).length} variables in .env\n`);

  for (const key of REQUIRED_KEYS) {
    if (allVars[key]) {
      setVercelEnv(key, allVars[key]);
    } else {
      console.warn(`  ⚠️  ${key} not found in .env — skipping`);
    }
  }

  // Also push any extra vars not in the required list
  const extraKeys = Object.keys(allVars).filter(k => !REQUIRED_KEYS.includes(k));
  if (extraKeys.length > 0) {
    console.log(`\nPushing ${extraKeys.length} additional variables...`);
    for (const key of extraKeys) {
      setVercelEnv(key, allVars[key]);
    }
  }

  console.log(`
✅ Done! ${REQUIRED_KEYS.filter(k => allVars[k]).length} required variables pushed to Vercel production.

Next step: Deploy to Vercel
  git add .
  git commit -m "Deploy to Vercel with Supabase"
  git push
  (or: npx vercel --prod)
`);
}

main();
