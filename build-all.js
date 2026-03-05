const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');

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
    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend (React / Vite)');

    // Ensure relative API path
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const rootDistDir = path.join(rootDir, 'dist');
    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        process.exit(1);
    }

    if (fs.existsSync(rootDistDir)) fs.rmSync(rootDistDir, { recursive: true, force: true });
    fs.mkdirSync(rootDistDir, { recursive: true });
    fs.cpSync(clientDistDir, rootDistDir, { recursive: true });
    console.log('✅ Frontend assets moved to /dist');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend (TypeScript compile)');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const rootBackendDir = path.join(rootDir, '.backend');

    if (fs.existsSync(rootBackendDir)) fs.rmSync(rootBackendDir, { recursive: true, force: true });
    fs.mkdirSync(rootBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, rootBackendDir, { recursive: true });

    // Ensure prisma binary is in root node_modules for Vercel
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }

    // ── 3. WRITE CONSOLIDATED ROOT INDEX ─────────────────────────
    section('3/3  Writing Consolidate Root Entrypoint');

    const rootIndexContent = `/**
 * ET-Ticket Platform v3.12.0 - Monolithic Orchestrator
 * This is the ONLY entrypoint Vercel needs to find.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');

// Middleware for CORS (Manual for the main app)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// 1. HEALTH CHECK (Fast)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.0',
        mode: 'monolith-entry'
    });
});

// 2. LOAD BACKEND BUNDLE (Try/Catch for robustness)
try {
    const backendEntry = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendEntry)) {
        const backendApp = require('./.backend/vercel-entry');
        // Mount backend at /api
        app.use(backendApp);
        console.log('✅ Backend bundle mounted');
    }
} catch (err) {
    console.error('❌ Backend load error:', err.message);
}

// 3. SERVE STATIC FRONTEND
app.use(express.static(distPath));

// 4. SPA FALLBACK
app.get('/:path*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Application files not found. Build may be incomplete.');
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), rootIndexContent);
    console.log('✅ index.js written to root');

    const legacyApi = path.join(rootDir, 'api');
    if (fs.existsSync(legacyApi)) fs.rmSync(legacyApi, { recursive: true, force: true });

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
