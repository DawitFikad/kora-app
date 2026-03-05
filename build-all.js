const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
const apiDir = path.join(rootDir, 'api');

function runCommand(command, cwd) {
    console.log(`\n▶ ${command}`);
    execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'false' } });
}

function section(title) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('═'.repeat(60));
}

try {
    // ── 1. FRONTEND ──────────────────────────────────────────────
    section('1/3  Frontend (React / Vite)');

    // Create production env for frontend build to ensure relative /api
    const envProdPath = path.join(clientDir, '.env.production');
    fs.writeFileSync(envProdPath, 'VITE_API_BASE_URL=/api\n');
    console.log('✅ Created .env.production with VITE_API_BASE_URL=/api');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const rootPublicDir = path.join(rootDir, 'public'); // Use 'public' for Vercel static
    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend dist not found:', clientDistDir);
        process.exit(1);
    }

    if (fs.existsSync(rootPublicDir)) fs.rmSync(rootPublicDir, { recursive: true, force: true });
    fs.mkdirSync(rootPublicDir, { recursive: true });
    fs.cpSync(clientDistDir, rootPublicDir, { recursive: true });
    console.log('✅ Frontend built and copied to /public');

    // ── 2. BACKEND ───────────────────────────────────────────────
    section('2/3  Backend (TypeScript compile)');
    runCommand('npm install', serverDir);

    console.log('\n▶ prisma generate');
    runCommand('npx prisma generate', serverDir);

    runCommand('npm run build', serverDir);

    const serverDist = path.join(serverDir, 'dist', 'vercel-entry.js');
    if (!fs.existsSync(serverDist)) {
        console.error('❌ Backend dist missing:', serverDist);
        process.exit(1);
    }
    console.log('✅ Backend compiled to services/api/dist');

    // ── 3. PREPARE API FUNCTION ──────────────────────────────────
    section('3/3  Prepare Vercel API Function');
    const apiDistDest = path.join(apiDir, 'dist');
    const apiDistSrc = path.join(serverDir, 'dist');

    if (fs.existsSync(apiDistDest)) fs.rmSync(apiDistDest, { recursive: true, force: true });
    fs.mkdirSync(apiDistDest, { recursive: true });
    fs.cpSync(apiDistSrc, apiDistDest, { recursive: true });
    console.log('✅ api/dist populated for Vercel tracing');

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
