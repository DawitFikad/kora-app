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
    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend (React / Vite)');

    // Ensure relative API path for local dev/prod toggle
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const rootPublicDir = path.join(rootDir, 'public'); // Native Vercel static dir
    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist not found');
        process.exit(1);
    }

    if (fs.existsSync(rootPublicDir)) fs.rmSync(rootPublicDir, { recursive: true, force: true });
    fs.mkdirSync(rootPublicDir, { recursive: true });
    fs.cpSync(clientDistDir, rootPublicDir, { recursive: true });
    console.log('✅ Frontend assets moved to /public');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend (TypeScript compile)');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const rootBackendDir = path.join(apiDir, '.backend'); // Move backend into api/.backend

    if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir);
    if (fs.existsSync(rootBackendDir)) fs.rmSync(rootBackendDir, { recursive: true, force: true });
    fs.mkdirSync(rootBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, rootBackendDir, { recursive: true });

    // Ensure prisma binary is in root node_modules for Vercel tracing
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(apiDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true, force: true });
        fs.mkdirSync(path.join(apiDir, 'node_modules'), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }

    // ── 3. WRITE API ENTRYPOINT (Inside /api) ────────────────────
    section('3/3  Writing API Entrypoint');

    const apiIndexContent = `/**
 * ET-Ticket Platform v3.12.0
 * Vercel Serverless Function Proxy
 */
const path = require('path');
const fs   = require('fs');

let handler;

try {
    const entry = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(entry)) {
        handler = require('./.backend/vercel-entry');
        console.log('✅ Backend bundle loaded safely');
    } else {
        throw new Error('Backend entry not found at: ' + entry);
    }
} catch (err) {
    console.error('❌ Backend initialization error:', err.message);
    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error:   'Backend Initialize Failed',
            message: err.message,
            version: '3.12.0'
        }));
    };
}

module.exports = handler;
`;

    fs.writeFileSync(path.join(apiDir, 'index.js'), apiIndexContent);
    console.log('✅ api/index.js written');

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
