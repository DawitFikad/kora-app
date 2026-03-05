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
    // ── 0. CLEANUP PREVIOUS CRAP ─────────────────────────────────
    section('0. CLEANUP');
    const foldersToClear = ['.backend', 'backend-bundle', 'public', 'dist', 'api', 'serverless', 'out'];
    foldersToClear.forEach(folder => {
        const fullPath = path.join(rootDir, folder);
        if (fs.existsSync(fullPath)) {
            console.log(`Removing ${folder}...`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    });

    // Explicitly delete root index.js if it exists locally
    const rootIndex = path.join(rootDir, 'index.js');
    if (fs.existsSync(rootIndex)) {
        console.log('Explicitly removing root index.js...');
        fs.unlinkSync(rootIndex);
    }

    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/3  Frontend Build');
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');
    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist missing');
        process.exit(1);
    }

    // Copy frontend to root for static serving
    console.log('Deploying static assets to root...');
    fs.cpSync(clientDistDir, rootDir, { recursive: true, overwrite: true });
    console.log('✅ Static assets deployed to root');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');

    // Use a unique name to avoid conflicts
    const apiBundleDir = path.join(apiDir, 'bundle');
    fs.mkdirSync(apiBundleDir, { recursive: true });
    fs.cpSync(serverDistSrc, apiBundleDir, { recursive: true });
    console.log('✅ Backend bundle prepared at api/bundle');

    // ── 3. WRITE SERVERLESS ENTRYPOINT ───────────────────────────
    section('3/3  Writing Serverless Entrypoint');

    const entryContent = `/**
 * ET-Ticket Platform v3.12.0
 * Native Serverless Entrypoint
 */
const path = require('path');
const fs   = require('fs');

let handler;

try {
    const entryPath = path.join(__dirname, 'bundle', 'vercel-entry.js');
    if (!fs.existsSync(entryPath)) throw new Error('Backend bundle missing at ' + entryPath);

    handler = require('./bundle/vercel-entry');
    console.log('✅ Function loaded successfully');
} catch (err) {
    console.error('❌ Load error:', err.message);
    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error:   'Backend Initialize Failed',
            message: err.message,
            version: '3.12.0',
            timestamp: new Date().toISOString()
        }));
    };
}

module.exports = handler;
`;

    fs.writeFileSync(path.join(apiDir, 'index.js'), entryContent);
    console.log('✅ Written api/index.js');

    section('🏁  BUILD SUCCESSFUL');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
