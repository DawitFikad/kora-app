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
    section('1/4  Frontend Build');

    // Ensure relative API path
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist missing');
        process.exit(1);
    }

    // Static assets go to root. Vercel serves these natively.
    console.log('Deploying static assets to root...');
    fs.cpSync(clientDistDir, rootDir, { recursive: true, overwrite: true });
    console.log('✅ Static assets deployed to root');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/4  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const apiLayerDir = path.join(rootDir, 'api');

    // Clear and prepare api/ folder
    if (fs.existsSync(apiLayerDir)) fs.rmSync(apiLayerDir, { recursive: true, force: true });
    fs.mkdirSync(apiLayerDir, { recursive: true });

    // Copy backend logic to api/serverless/
    const apiServerlessDir = path.join(apiLayerDir, 'serverless');
    fs.mkdirSync(apiServerlessDir, { recursive: true });
    fs.cpSync(serverDistSrc, apiServerlessDir, { recursive: true });
    console.log('✅ Backend bundle prepared at api/serverless');

    // ── 3. WRITE SERVERLESS ENTRYPOINT ───────────────────────────
    section('3/4  Writing Serverless Entrypoint');

    const entryContent = `/**
 * ET-Ticket Platform v3.12.0
 * Native Serverless Entrypoint
 */
const path = require('path');
const fs   = require('fs');

let handler;

try {
    const entryPath = path.join(__dirname, 'serverless', 'vercel-entry.js');
    if (!fs.existsSync(entryPath)) throw new Error('Backend logic missing at ' + entryPath);

    handler = require('./serverless/vercel-entry');
    console.log('✅ [api/index.js] Function loaded successfully');
} catch (err) {
    console.error('❌ [api/index.js] Load error:', err.message);
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

    fs.writeFileSync(path.join(apiLayerDir, 'index.js'), entryContent);
    console.log('✅ Written api/index.js');

    // ── 4. CLEANUP ───────────────────────────────────────────────
    section('4/4  Deleting Conflict Entrypoints');
    const rootIndex = path.join(rootDir, 'index.js');
    if (fs.existsSync(rootIndex)) {
        fs.unlinkSync(rootIndex);
        console.log('✅ DELETED root index.js to prevent home page crash');
    }

    section('🏁  BUILD SUCCESSFUL');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
