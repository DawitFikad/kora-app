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
    const foldersToClear = ['.backend', '.static', 'api', 'dist', 'public', 'out', 'assets'];
    foldersToClear.forEach(folder => {
        const fullPath = path.join(rootDir, folder);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing ${folder}...`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    });

    // Crucial: Remove static files from root that hijack Vercel routing
    ['index.html', 'vite.svg', 'favicon.ico', 'index.js'].forEach(file => {
        const fullPath = path.join(rootDir, file);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing root file ${file}...`);
            fs.unlinkSync(fullPath);
        }
    });

    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend Build');
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    const targetStaticDir = path.join(rootDir, '.static');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed');
        process.exit(1);
    }

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

    // ── 3. WRITE API ENTRYPOINT (api/index.js) ───────────────────
    section('3/3  Writing API Entrypoint');

    const apiDir = path.join(rootDir, 'api');
    fs.mkdirSync(apiDir, { recursive: true });

    const indexContent = `/**
 * ET-Ticket Platform v3.12.6 - MASTER SERVER
 * Location: /api/index.js
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const staticPath = path.join(__dirname, '..', '.static');
const backendPath = path.join(__dirname, '..', '.backend', 'vercel-entry.js');

// 1. Diagnostics & CORS
app.use((req, res, next) => {
    // Log every request to Vercel logs
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. Health Check
app.get('/api/health-check-v3', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.6-master',
        timestamp: new Date().toISOString(),
        env: {
            db: !!process.env.DATABASE_URL,
            chapa: !!process.env.CHAPA_SECRET_KEY
        }
    });
});

// 3. Mount Backend Logic
try {
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        const backendApp = bundle.default || bundle;
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend Mounted');
        }
    } else {
        console.error('❌ Backend bundle missing at ' + backendPath);
    }
} catch (err) {
    console.error('🔥 Backend Load Error:', err.message);
}

// 4. Serve Static Files
app.use(express.static(staticPath));

// 5. Catch-all for SPA
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Build inconsistent. Please redeploy.');
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
