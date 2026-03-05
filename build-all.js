const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
const apiDir = path.join(rootDir, 'api');            // Vercel function dir

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
    console.log('✅ Frontend → /dist');

    // ── 2. BACKEND ───────────────────────────────────────────────
    section('2/4  Backend (TypeScript compile)');

    // Install API deps (generates Prisma for Linux on Vercel)
    runCommand('npm install', serverDir);

    // Explicit Prisma generate (runs in Linux on Vercel → correct binary)
    console.log('\n▶ prisma generate');
    try {
        runCommand('npx prisma generate', serverDir);
    } catch (e) {
        console.warn('⚠️  prisma generate non-fatal:', e.message);
    }

    // Compile TypeScript
    runCommand('npm run build', serverDir);

    const serverDist = path.join(serverDir, 'dist', 'vercel-entry.js');
    if (!fs.existsSync(serverDist)) {
        console.error('❌ Backend dist missing:', serverDist);
        process.exit(1);
    }
    console.log('✅ Backend compiled → services/api/dist');

    // ── 3. COPY API DIST → api/dist ──────────────────────────────
    // This is the KEY step: api/index.js loads ./dist/vercel-entry
    // which resolves external requires (express, prisma, etc.) through
    // ROOT node_modules — Vercel's dependency tracer handles this correctly.
    section('3/4  Copy API dist → api/dist (Vercel tracing fix)');

    const apiDistDest = path.join(apiDir, 'dist');
    const apiDistSrc = path.join(serverDir, 'dist');

    if (fs.existsSync(apiDistDest)) fs.rmSync(apiDistDest, { recursive: true, force: true });
    fs.mkdirSync(apiDistDest, { recursive: true });
    fs.cpSync(apiDistSrc, apiDistDest, { recursive: true });

    // Also copy Prisma client so it's accessible from api/
    const prismaSrc = path.join(serverDir, 'node_modules', '.prisma');
    const prismaDest = path.join(rootDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaSrc) && !fs.existsSync(prismaDest)) {
        fs.cpSync(prismaSrc, prismaDest, { recursive: true });
        console.log('✅ Prisma client copied to root node_modules/.prisma');
    }

    console.log('✅ api/dist populated from services/api/dist');

    // ── 4. ROOT FALLBACK index.js ─────────────────────────────────
    section('4/4  Root index.js (static file fallback)');

    const rootIndexContent = `/**
 * ET-Ticket Platform v3.12.0 - Root Fallback
 * Serves static frontend files.
 * API requests are handled by /api/index.js (Vercel native function).
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app = express();

app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'ok', version: '3.12.0', source: 'root-fallback' });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found', path: req.path });
    }
    const idx = path.join(__dirname, 'dist', 'index.html');
    fs.existsSync(idx)
        ? res.sendFile(idx)
        : res.status(404).send('Frontend not built.');
});

module.exports = app;
`;
    fs.writeFileSync(path.join(rootDir, 'index.js'), rootIndexContent);
    console.log('✅ root index.js written');

    section('✅  BUILD COMPLETE');
    console.log('  /dist           → Frontend (static)');
    console.log('  /api/dist       → Backend (Vercel function)');
    console.log('  /api/index.js   → Vercel serverless handler');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
