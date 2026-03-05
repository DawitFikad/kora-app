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
    // ── 0. CLEANUP ───────────────────────────────────────────────
    section('0. CLEANUP');
    const foldersToClear = ['.backend', 'dist', 'public', 'api', 'serverless', 'out'];
    foldersToClear.forEach(folder => {
        const fullPath = path.join(rootDir, folder);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing ${folder}...`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    });

    // Explicitly delete root index.js if it exists
    if (fs.existsSync(path.join(rootDir, 'index.js'))) {
        fs.unlinkSync(path.join(rootDir, 'index.js'));
    }

    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend Build');
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetDistDir = path.join(rootDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist missing');
        process.exit(1);
    }

    // Move to /dist (Vercel's preferred output folder)
    fs.mkdirSync(targetDistDir, { recursive: true });
    fs.cpSync(clientDistDir, targetDistDir, { recursive: true });
    console.log('✅ Frontend built to /dist');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    // Prepare a hidden bundle folder for the serverless function to load
    const serverDistSrc = path.join(serverDir, 'dist');
    const bundleDir = path.join(apiDir, 'bundle');

    fs.mkdirSync(bundleDir, { recursive: true });
    fs.cpSync(serverDistSrc, bundleDir, { recursive: true });

    // Copy prisma query engine to root node_modules for serverless tracing
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at api/bundle');

    // ── 3. WRITE API ENTRYPOINT ──────────────────────────────────
    section('3/3  Writing API Entrypoint');

    // This file handles /api/*
    const apiIndexContent = `/**
 * ET-Ticket Platform v3.12.4 - API Proxy
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Global CORS & Log
app.use((req, res, next) => {
    console.log(\`[\${new Date().toISOString()}] API-REQ: \${req.method} \${req.url}\`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Mounting the actual backend logic
try {
    const bundlePath = path.join(__dirname, 'bundle', 'vercel-entry.js');
    if (fs.existsSync(bundlePath)) {
        const bundle = require(bundlePath);
        const backendApp = bundle.default || bundle;
        
        // Use the backend app directly.
        // It expects paths starting with /api (from app.ts)
        app.use(backendApp);
    } else {
        app.get('/health', (req, res) => res.json({ status: "error", message: "Bundle missing" }));
    }
} catch (err) {
    console.error('Backend Load Error:', err);
    app.use((req, res) => res.status(500).json({ error: "Backend crash", message: err.message }));
}

module.exports = app;
`;

    fs.writeFileSync(path.join(apiDir, 'index.js'), apiIndexContent);
    console.log('✅ api/index.js written');

    section('🏁  BUILD SUCCESS');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
