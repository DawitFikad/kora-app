const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
const apiDir = path.join(rootDir, 'api');

function runCommand(command, cwd) {
    console.log(`\n▶ ${command}`);
    execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
}

function section(title) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('═'.repeat(60));
}

try {
    // ── 0. TOTAL PURGE ───────────────────────────────────────────
    section('0. PURGE STALE ASSETS');
    const itemsToClear = [
        'dist', '.backend', '.static', 'api', 'public', 'out', 'assets',
        'index.js', 'index.html', 'vercel.json.old'
    ];
    itemsToClear.forEach(item => {
        const fullPath = path.join(rootDir, item);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing ${item}...`);
            if (fs.lstatSync(fullPath).isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(fullPath);
            }
        }
    });

    // Create fresh api dir
    fs.mkdirSync(apiDir, { recursive: true });

    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend Build');
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetStaticDir = path.join(apiDir, '.static'); // Put INSIDE api/

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed');
        process.exit(1);
    }

    fs.mkdirSync(targetStaticDir, { recursive: true });
    fs.cpSync(clientDistDir, targetStaticDir, { recursive: true });
    console.log('✅ Frontend assets moved to api/.static');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const targetBackendDir = path.join(apiDir, '.backend'); // Put INSIDE api/

    fs.mkdirSync(targetBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, targetBackendDir, { recursive: true });

    // Copy prisma to api/ as well
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(apiDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at api/.backend');

    // ── 3. WRITE THE CONSOLIDATED LAMBDA ─────────────────────────
    section('3/3  Writing Monolith Lambda (api/index.js)');

    const indexContent = `/**
 * ET-Ticket Platform v3.12.8-FINAL
 * Deployment ID: \${Date.now()}
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
        version: '3.12.8-final',
        timestamp: new Date().toISOString(),
        build_id: '\${Date.now()}'
    });
});

// Mount Backend Logic
try {
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        const backendApp = bundle.default || bundle;
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend Logic Mounted');
        }
    } else {
        console.error('❌ Backend bundle missing at: ' + backendPath);
    }
} catch (err) {
    console.error('🔥 Backend Load Error:', err.message);
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
        res.status(404).json({ error: 'UI build missing', check: staticPath });
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(apiDir, 'index.js'), indexContent);
    console.log('✅ api/index.js written');

    section('🏁  BUILD SUCCESSFUL');

} catch (err) {
    console.error('\n❌ BUILD FAILURE:', err.message);
    process.exit(1);
}
