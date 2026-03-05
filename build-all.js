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

    const serverDist = path.join(serverDir, 'dist', 'vercel-entry.js');
    if (!fs.existsSync(serverDist)) {
        console.error('❌ Backend dist missing:', serverDist);
        process.exit(1);
    }
    console.log('✅ Backend compiled to services/api/dist');

    // ── 3. PREPARE API FUNCTION ──────────────────────────────────
    section('3/4  Prepare Vercel API Function');
    const apiDistDest = path.join(apiDir, 'dist');
    const apiDistSrc = path.join(serverDir, 'dist');

    if (fs.existsSync(apiDistDest)) fs.rmSync(apiDistDest, { recursive: true, force: true });
    fs.mkdirSync(apiDistDest, { recursive: true });
    fs.cpSync(apiDistSrc, apiDistDest, { recursive: true });
    console.log('✅ api/dist populated for Vercel tracing');

    // ── 4. WRITE ORCHESTRATORS ───────────────────────────────────
    section('4/4  Writing Orchestrators with Express 5 syntax');

    // Root index.js (Serves Frontend)
    const rootIndexContent = `/**
 * ET-Ticket Platform v3.12.0 - Root Frontend Orchestrator
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app = express();

// Serve static assets from 'dist' folder
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check
app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'ok', version: '3.12.0', source: 'frontend-orchestrator' });
});

// SPA Catch-all: Use Express 5 compatible named wildcard
app.get('/:path*', (req, res) => {
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Frontend build not found. Current dir: ' + __dirname);
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), rootIndexContent);
    console.log('✅ Updated root index.js');

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
