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
    // ── 0. CLEANUP ───────────────────────────────────────────────
    section('0. CLEANUP');
    const foldersToClear = ['.backend', 'api', 'dist', 'public', 'out'];
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
    const targetPublicDir = path.join(rootDir, 'public');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist missing');
        process.exit(1);
    }

    fs.mkdirSync(targetPublicDir, { recursive: true });
    fs.cpSync(clientDistDir, targetPublicDir, { recursive: true });
    console.log('✅ Frontend assets moved to /public');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const targetBackendDir = path.join(rootDir, '.backend');

    fs.mkdirSync(targetBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, targetBackendDir, { recursive: true });

    // Copy prisma query engine
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at /.backend');

    // ── 3. WRITE ULTIMATE ORCHESTRATOR ───────────────────────────
    section('3/3  Writing Ultimate Orchestrator');

    const entryContent = `/**
 * ET-Ticket Platform v3.12.3 - Ultimate Orchestrator
 * Fixes: CORS, default exports, Path stripping, Detailed error reporting.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// 1. Global CORS & Logging
app.use((req, res, next) => {
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. Health Check (Immediate)
app.get('/api/health-check-v3', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        version: '3.12.3',
        orchestrator: 'universal-v3-ultimate',
        timestamp: new Date().toISOString(),
        request: {
            url: req.url,
            path: req.path,
            method: req.method
        }
    });
});

// 3. Mount Backend Logic
try {
    const backendEntry = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendEntry)) {
        const bundle = require(backendEntry);
        const backendApp = bundle.default || bundle;
        
        if (typeof backendApp === 'function') {
            // Mount the backend app. 
            // Since this app will handle requests at /api/*, we mount it at root /
            // It will see the full path (e.g. /api/auth/...) and match its own routes.
            app.use(backendApp);
            console.log('✅ Backend bundle loaded and mounted');
        } else {
            console.error('❌ Backend bundle exported something other than a function:', typeof backendApp);
        }
    } else {
        console.error('❌ Backend entry missing at:', backendEntry);
    }
} catch (err) {
    console.error('❌ MONOLITH LOAD FAIL:', err.message);
    console.error(err.stack);
}

// 4. Final Fallback for API (404 JSON)
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'API Endpoint Not Found',
        path: req.url,
        version: '3.12.3'
    });
});

// 5. Global Error Handler for Orchestrator
app.use((err, req, res, next) => {
    console.error('🔥 Orchestrator Error:', err);
    res.status(500).json({
        error: 'Orchestrator Internal Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), entryContent);
    console.log('✅ index.js written to root');

    section('🏁  BUILD SUCCESS');

} catch (err) {
    console.error('\n❌ BUILD FAILURE:', err.message);
    process.exit(1);
}
