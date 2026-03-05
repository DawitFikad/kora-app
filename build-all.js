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
    // Set production API base
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetStaticDir = path.join(rootDir, '.static'); // Use a dedicated folder for static

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed');
        process.exit(1);
    }

    if (fs.existsSync(targetStaticDir)) fs.rmSync(targetStaticDir, { recursive: true });
    fs.mkdirSync(targetStaticDir, { recursive: true });
    fs.cpSync(clientDistDir, targetStaticDir, { recursive: true });
    console.log('✅ Frontend assets moved to /.static');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const targetBackendDir = path.join(rootDir, '.backend');

    if (fs.existsSync(targetBackendDir)) fs.rmSync(targetBackendDir, { recursive: true });
    fs.mkdirSync(targetBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, targetBackendDir, { recursive: true });

    // Copy prisma to root for runtime
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at /.backend');

    // ── 3. WRITE THE MASTER MONOLITH ─────────────────────────────
    section('3/3  Writing Master Orchestrator (index.js)');

    // This index.js will be at the ROOT. Vercel will find it.
    // It will serve static files from .static and API from .backend.
    const indexContent = `/**
 * ET-Ticket Platform v3.12.5 - MASTER MONOLITH
 * This file handles BOTH static UI and dynamic API in a single Vercel Function for 100% stability.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// 1. Diagnostics & CORS
app.use((req, res, next) => {
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. Immediate Health Check
app.get('/api/health-check-v3', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.5',
        type: 'master-monolith',
        timestamp: new Date().toISOString(),
        chapa: !!process.env.CHAPA_SECRET_KEY
    });
});

// 3. Mount Backend Bundle
try {
    const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        // Handle ES Modules .default
        const backendApp = bundle.default || bundle;
        
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend Mounted');
        } else {
            console.error('❌ Backend exported non-function:', typeof backendApp);
        }
    } else {
        console.error('❌ Backend bundle missing');
    }
} catch (err) {
    console.error('🔥 Backend Load Error:', err.message);
}

// 4. Serve Static Files from .static
// We do this AFTER mounting the backend to give API routes priority
const staticPath = path.join(__dirname, '.static');
app.use(express.static(staticPath));

// 5. SPA Fallback / Catch-all
app.get('*', (req, res) => {
    // If it's an API call that failed, return JSON
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    
    // Otherwise, serve the SPA index.html
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Application build missing. Contact Support.');
    }
});

// 6. Global Function-level Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER CRASH:', err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
        v: '3.12.5'
    });
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), indexContent);
    console.log('✅ index.js written to root');

    section('🏁  BUILD SUCCESS');

} catch (err) {
    console.error('\n❌ BUILD FAILURE:', err.message);
    process.exit(1);
}
