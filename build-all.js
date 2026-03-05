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
    section('1/4  Frontend (React / Vite)');

    // Create production env for frontend build to ensure relative /api
    const envProdPath = path.join(clientDir, '.env.production');
    fs.writeFileSync(envProdPath, 'VITE_API_BASE_URL=/api\n');
    console.log('✅ Created .env.production');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const rootDistDir = path.join(rootDir, 'dist');
    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend dist not found:', clientDistDir);
        process.exit(1);
    }

    if (fs.existsSync(rootDistDir)) fs.rmSync(rootDistDir, { recursive: true, force: true });
    fs.mkdirSync(rootDistDir, { recursive: true });
    fs.cpSync(clientDistDir, rootDistDir, { recursive: true });
    console.log('✅ Frontend built and copied to /dist');

    // ── 2. BACKEND ───────────────────────────────────────────────
    section('2/4  Backend (TypeScript compile)');
    runCommand('npm install', serverDir);

    console.log('\n▶ prisma generate');
    runCommand('npx prisma generate', serverDir);

    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    if (!fs.existsSync(path.join(serverDistSrc, 'vercel-entry.js'))) {
        console.error('❌ Backend dist missing vercel-entry.js');
        process.exit(1);
    }

    // ── 3. PREPARE API FUNCTION ──────────────────────────────────
    section('3/4  Prepare Vercel API Function');

    // Hidden dot-folder so Vercel doesn't try to build it as a function
    const apiDistDest = path.join(apiDir, '.backend');

    if (fs.existsSync(apiDistDest)) fs.rmSync(apiDistDest, { recursive: true, force: true });
    fs.mkdirSync(apiDistDest, { recursive: true });
    fs.cpSync(serverDistSrc, apiDistDest, { recursive: true });
    console.log('✅ api/.backend populated');

    // ── 4. WRITE ROOT ENTRYPOINT ─────────────────────────────────
    section('4/4  Writing Root Entrypoint');

    const rootIndexContent = `/**
 * ET-Ticket Platform v3.12.0 - Root Orchestrator
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app = express();

const distPath = path.join(__dirname, 'dist');

// 1. Serve static files FIRST
app.use(express.static(distPath));

// 2. Health check
app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'ok', version: '3.12.0', mode: 'proxy-fallback' });
});

// 3. SPA Catch-all
app.get('/:path*', (req, res) => {
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Frontend files not found in /dist. Path: ' + req.path);
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), rootIndexContent);
    console.log('✅ root index.js written');

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
