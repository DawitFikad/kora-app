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
    // ── 0. TOTAL CLEANUP ─────────────────────────────────────────
    section('0. CLEANUP');
    // Remove EVERYTHING that could confuse Vercel's file-based routing
    const foldersToClear = ['.backend', 'api', 'dist', 'public', 'serverless', 'out'];
    foldersToClear.forEach(folder => {
        const fullPath = path.join(rootDir, folder);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing ${folder}...`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    });

    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend Build');
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetDistDir = path.join(rootDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed');
        process.exit(1);
    }

    fs.mkdirSync(targetDistDir, { recursive: true });
    fs.cpSync(clientDistDir, targetDistDir, { recursive: true });
    console.log('✅ Frontend assets moved to root /dist');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const targetBackendDir = path.join(rootDir, '.backend');

    fs.mkdirSync(targetBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, targetBackendDir, { recursive: true });

    // Copy prisma to root modules for runtime tracing
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at /.backend');

    // ── 3. WRITE UNIVERSAL ENTRYPOINT ────────────────────────────
    section('3/3  Writing Universal Orchestrator');

    // Root index.js handles everything. 
    // It's the ONLY function entrypoint.
    const entryContent = `/**
 * ET-Ticket Platform v3.12.2 - Universal Orchestrator
 * Fixes: Path stripping from /api folder, Express 5 compatibility, Static resolution.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');
const backendEntry = path.join(__dirname, '.backend', 'vercel-entry.js');

// Global Logger
app.use((req, res, next) => {
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
    next();
});

// Explicit CORS Preflight
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(204);
});

// 1. Root-level Health Check (Fast)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.2',
        orchestrator: 'universal-v3',
        timestamp: new Date().toISOString()
    });
});

// 2. Mount Backend App
try {
    if (fs.existsSync(backendEntry)) {
        const bundle = require('./.backend/vercel-entry');
        const backendApp = bundle.default || bundle;
        
        // Use app.all() to capture ANY /api/* request and pass it to backend
        app.use(backendApp);
        console.log('✅ Backend logic mounted');
    } else {
        console.error('❌ Backend bundle missing at:', backendEntry);
    }
} catch (err) {
    console.error('❌ MONOLITH FAIL:', err.message);
}

// 3. Serve Static Files
app.use(express.static(distPath));

// 4. SPA Fallback
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'API route not found', 
            path: req.url,
            v: '3.12.2'
        });
    }
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Static application files missing. Deployment incomplete.');
    }
});

module.exports = app;
`;

    // Ensure we are WRITING to the root index.js
    fs.writeFileSync(path.join(rootDir, 'index.js'), entryContent);
    console.log('✅ index.js written to root');

    section('🏁  BUILD SUCCESS');

} catch (err) {
    console.error('\n❌ BUILD FAILURE:', err.message);
    process.exit(1);
}
