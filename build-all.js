const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');

function runCommand(command, cwd) {
    console.log(`\n▶ Running: ${command}`);
    console.log(`  In: ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'false' } });
}

function section(title) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(60));
}

try {
    // ── 1. BUILD FRONTEND ──────────────────────────────────────────
    section('1/3  Building Frontend (React/Vite)');
    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    // Copy frontend dist → root dist/ (for static serving)
    const rootDistDir = path.join(rootDir, 'dist');
    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build output not found at:', clientDistDir);
        process.exit(1);
    }

    if (fs.existsSync(rootDistDir)) {
        fs.rmSync(rootDistDir, { recursive: true, force: true });
    }
    fs.mkdirSync(rootDistDir, { recursive: true });
    fs.cpSync(clientDistDir, rootDistDir, { recursive: true });
    console.log('✅ Frontend build copied to /dist');

    // ── 2. BUILD BACKEND ───────────────────────────────────────────
    section('2/3  Building Backend (Node/Express/TypeScript)');

    // Install API dependencies (triggers postinstall → prisma generate)
    runCommand('npm install', serverDir);

    // Explicitly run prisma generate in case postinstall was skipped
    console.log('\n▶ Running prisma generate...');
    try {
        runCommand('npx prisma generate', serverDir);
    } catch (e) {
        console.warn('⚠️ prisma generate failed (non-fatal if already done):', e.message);
    }

    // Compile TypeScript → dist/
    runCommand('npm run build', serverDir);

    // Verify output
    const distEntry = path.join(serverDir, 'dist', 'vercel-entry.js');
    if (fs.existsSync(distEntry)) {
        console.log('✅ Backend compiled: services/api/dist/vercel-entry.js');
    } else {
        console.error('❌ Backend compile output NOT found:', distEntry);
        process.exit(1);
    }

    // ── 3. GENERATE ROOT ORCHESTRATOR (fallback for non-API routes)  
    section('3/3  Writing root index.js (static file fallback)');

    const rootIndexContent = `/**
 * ET-Ticket Platform v3.12.0
 * Root entry point - serves static frontend files 
 * API requests are handled by api/index.js (Vercel native function)
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Health check (redundant safety net)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'healthy', version: '3.12.0', service: 'root-fallback' });
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'dist')));

// SPA catch-all
app.get('(.*)', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found', path: req.path });
    }
    const index = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(index)) {
        res.sendFile(index);
    } else {
        res.status(404).send('Frontend not built. Run: node build-all.js');
    }
});

module.exports = app;
`;

    fs.writeFileSync(path.join(rootDir, 'index.js'), rootIndexContent);
    console.log('✅ root index.js written');

    section('✅  BUILD COMPLETE');
    console.log('  Frontend → /dist');
    console.log('  Backend  → /services/api/dist');
    console.log('  Function → /api/index.js');
    console.log('  Fallback → /index.js');

} catch (error) {
    console.error('\n❌ BUILD FAILED:', error.message);
    process.exit(1);
}
