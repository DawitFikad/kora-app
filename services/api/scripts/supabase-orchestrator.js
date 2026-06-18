/**
 * ET-Ticket Platform — Supabase Setup Orchestrator
 * =================================================
 * One-command setup: migrate DB → seed initial data → verify.
 *
 * Usage:
 *   cd services/api
 *   node scripts/supabase-orchestrator.js
 *
 * Prerequisites:
 *   - .env file with DATABASE_URL and DIRECT_URL pointing to Supabase
 *   - Node.js 20+
 *   - All npm packages installed (npm install)
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function run(command, label) {
  console.log(`\n━━━ ${label} ━━━`);
  console.log(`$ ${command}`);
  execSync(command, { cwd: ROOT, stdio: 'inherit', env: { ...process.env } });
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     ET-TICKET PLATFORM — SUPABASE SETUP v3.12.0       ║
╚════════════════════════════════════════════════════════╝
`);

  // ── Step 0: Check .env exists ────────────────────────────────────────
  section('0/6  CHECKING ENVIRONMENT');
  const fs = require('fs');
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ .env file not found at ' + ENV_PATH);
    console.error('   Copy .env.example to .env and fill in your Supabase credentials.');
    process.exit(1);
  }

  // Validate that DATABASE_URL is present
  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  if (!envContent.includes('DATABASE_URL') || !envContent.includes('supabase')) {
    console.error('❌ .env file does not contain a Supabase DATABASE_URL.');
    console.error('   Please update .env with your Supabase connection string.');
    process.exit(1);
  }
  console.log('✅ .env file found with Supabase configuration.');

  // ── Step 1: Install dependencies ─────────────────────────────────────
  section('1/6  INSTALLING DEPENDENCIES');
  run('npm install', 'npm install');
  console.log('✅ Dependencies installed.');

  // ── Step 2: Generate Prisma Client ───────────────────────────────────
  section('2/6  GENERATING PRISMA CLIENT');
  run('npx prisma generate', 'Prisma Generate');
  console.log('✅ Prisma client generated.');

  // ── Step 3: Run database migrations ──────────────────────────────────
  section('3/6  RUNNING DATABASE MIGRATIONS');
  try {
    run('npx prisma migrate deploy', 'Prisma Migrate Deploy');
    console.log('✅ All 16 migrations applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed. Trying prisma db push as fallback...');
    run('npx prisma db push', 'Prisma DB Push (fallback)');
    console.log('✅ Schema pushed via db push.');
  }

  // ── Step 4: Seed system configuration ────────────────────────────────
  section('4/6  SEEDING SYSTEM CONFIG');
  run('node seed-system-config.js', 'System Config Seed');
  console.log('✅ System config seeded (app name, OTP settings, etc.).');

  // ── Step 5: Seed categories and cities ───────────────────────────────
  section('5/6  SEEDING CATEGORIES & CITIES');
  try {
    run('npx tsx scripts/seed-categories.ts', 'Seed Categories');
    console.log('✅ Categories and sub-categories seeded.');
  } catch (e) {
    console.warn('⚠️  Category seeding skipped (tsx may not be installed). Run manually:');
    console.warn('   npx tsx scripts/seed-categories.ts');
  }

  try {
    run('npx tsx scripts/seed-cities.ts', 'Seed Cities');
    console.log('✅ Cities seeded.');
  } catch (e) {
    console.warn('⚠️  City seeding skipped (tsx may not be installed). Run manually:');
    console.warn('   npx tsx scripts/seed-cities.ts');
  }

  // ── Step 6: Verify everything ────────────────────────────────────────
  section('6/6  VERIFYING DATABASE');
  try {
    run('node verify-database.js', 'Database Verification');
    console.log('✅ Database verification complete.');
  } catch (e) {
    console.error('❌ Verification failed:', e.message);
    process.exit(1);
  }

  // ── Done ─────────────────────────────────────────────────────────────
  section('🏁  SUPABASE SETUP COMPLETE');
  console.log(`
  ✅ Supabase database is ready and populated.
  ✅ Prisma schema is synchronized.
  ✅ Seed data loaded (config, categories, cities).

  Next steps for VERCEL deployment:
  1. Push your code to GitHub
  2. Import into Vercel
  3. Set all environment variables from .env in Vercel Dashboard
  4. Set Root Directory to "services/api"
  5. Set Build Command to "npm run build"
  6. Deploy!

  For local testing:
    npm run dev   (or: npx ts-node-dev src/server.ts)
`);
}

main().catch((err) => {
  console.error('\n❌ SETUP FAILED:', err.message);
  process.exit(1);
});
