const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
const targetDir = path.join(rootDir, 'dist'); // The absolute output directory

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
    const foldersToClear = ['dist', '.backend', '.static', 'api', 'public', 'out'];
    foldersToClear.forEach(folder => {
        const fullPath = path.join(rootDir, folder);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing ${folder}...`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    });

    // Create fresh dist
    fs.mkdirSync(targetDir, { recursive: true });

    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend Build');
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetStaticDir = path.join(targetDir, '.static');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed');
        process.exit(1);
    }

    fs.mkdirSync(targetStaticDir, { recursive: true });
    fs.cpSync(clientDistDir, targetStaticDir, { recursive: true });
    console.log('✅ Frontend assets moved to dist/.static');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const targetBackendDir = path.join(targetDir, '.backend');

    fs.mkdirSync(targetBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, targetBackendDir, { recursive: true });

    // Copy prisma to root of output for runtime tracing
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(targetDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at dist/.backend');

    // ── 3. WRITE CONSOLIDATED ORCHESTRATOR ───────────────────────
    section('3/3  Writing Consolidated Orchestrator (dist/index.js)');

    const entryContent = `/**
 * ET-Ticket Platform v3.12.7 - CONSOLIDATED MONOLITH
 * This file serves both UI and API from inside the /dist folder.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const staticPath = path.join(__dirname, '.static');
const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');

// Global CORS & Logger
app.use((req, res, next) => {
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Health check
app.get('/api/health-check-v3', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.7-consolidated',
        timestamp: new Date().toISOString()
    });
});

// Mount Backend
try {
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        const backendApp = bundle.default || bundle;
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend mounted');
        }
    }
} catch (err) {
    console.error('🔥 Backend load error:', err.message);
}

// Serve Static Files
app.use(express.static(staticPath));

// SPA Fallback
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    const idx = path.join(staticPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Build inconsistent.');
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(targetDir, 'index.js'), entryContent);
    console.log('✅ dist/index.js written');

    // Also write a dummy package.json in dist to make it a self-contained node app if needed
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify({
        name: "et-ticket-output",
        version: "3.12.7",
        private: true,
        dependencies: {
            "express": "^4.21.2"
        }
    }, null, 2));

    section('🏁  BUILD SUCCESSFUL');

} catch (err) {
    console.error('\n❌ BUILD FAILURE:', err.message);
    process.exit(1);
}
