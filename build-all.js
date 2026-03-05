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
    // Ensure relative API path
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetDistDir = path.join(rootDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist missing');
        process.exit(1);
    }

    fs.mkdirSync(targetDistDir, { recursive: true });
    fs.cpSync(clientDistDir, targetDistDir, { recursive: true });
    console.log('✅ Frontend built to /dist');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const targetBackendDir = path.join(rootDir, '.backend');

    fs.mkdirSync(targetBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, targetBackendDir, { recursive: true });

    // Copy prisma query engine for the serverless function
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at /.backend');

    // ── 3. WRITE CONSOLIDATED ORCHESTRATOR ───────────────────────
    section('3/3  Writing Monolithic Orchestrator (index.js)');

    const indexContent = `/**
 * ET-Ticket Platform v3.12.1 - Consolidated Orchestrator
 * Fixes: Express 5 wildcard syntax, ESM/.default require, Static/API split.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');

// Middleware to log requests (helpful for debugging Vercel logs)
app.use((req, res, next) => {
    console.log('[Request]', req.method, req.url);
    next();
});

// 1. Health Check (Immediate)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.1',
        mode: 'monolith',
        timestamp: new Date().toISOString()
    });
});

// 2. Mount Backend Logic
try {
    const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendPath)) {
        const backendModule = require(backendPath);
        // CRITICAL: Handle ESM 'default' export from TypeScript compilation
        const backendApp = backendModule.default || backendModule;
        
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend bundle mounted successfully');
        } else {
            console.error('❌ Backend bundle did not export a function/app');
        }
    } else {
        console.error('❌ Backend entry missing at:', backendPath);
    }
} catch (err) {
    console.error('❌ Failed to load backend bundle:', err.message);
    console.error(err.stack);
}

// 3. Serve Static Assets
app.use(express.static(distPath));

// 4. SPA Fallback (Catch-all)
// Using app.use() at the very end as a catch-all is safer than Express 5's regex or wildcards.
app.use((req, res) => {
    // If it's an API call that wasn't caught, return 404 JSON
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found: ' + req.url });
    }
    
    // Otherwise, serve index.html for React SPA
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Static application files not found. Build may be incomplete.');
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), indexContent);
    console.log('✅ Written root index.js');

    // Also write a shadow api/index.js just in case Vercel's rewrites are stubborn
    const apiDir = path.join(rootDir, 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'index.js'), `module.exports = require('../index.js');\n`);
    console.log('✅ Written api/index.js (Shadow)');

    section('🏁  BUILD SUCCESSFUL');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
