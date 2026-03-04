const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
// Removed local publicDir reference since we use rootDistDir now

function runCommand(command, cwd) {
    if (process.env.VERCEL && command.includes('npm install')) {
        console.log(`Skipping: ${command} in ${cwd} (Vercel Build)`);
        return;
    }
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'false' } });
}

try {
    // 1. Install Root Dependencies (already done by Vercel, but safe to ensure)
    // console.log('Installing root dependencies...');
    // runCommand('npm install', rootDir);

    // 2. Build Frontend
    console.log('--- Building Frontend (Web App) ---');
    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    // 3. Move Frontend Build to Public (for Vercel Static Serving)
    // Vercel project settings might expect 'dist' or 'public'.
    // We will ensure 'dist' (in root) is populated as that matches the error message.

    // Define dist directories
    const rootDistDir = path.join(rootDir, 'dist');
    const clientDistDir = path.join(clientDir, 'dist');

    console.log('--- Deployment: Moving Frontend Build to /dist ---');

    // Clean root dist
    if (fs.existsSync(rootDistDir)) {
        console.log('Cleaning existing root dist directory...');
        fs.rmSync(rootDistDir, { recursive: true, force: true });
    }
    fs.mkdirSync(rootDistDir);

    if (fs.existsSync(clientDistDir)) {
        console.log('Copying build artifacts to dist/ ...');
        // Use cpSync (Node 16.7+)
        fs.cpSync(clientDistDir, rootDistDir, { recursive: true });
        console.log('Frontend build moved to dist/');
    } else {
        console.error('Frontend build failed: client dist directory not found!');
        process.exit(1);
    }

    // 4. Build Backend (API)
    console.log('--- Building Backend (API) ---');
    // Ensure root node_modules has prisma for the generate command
    runCommand('npm install prisma @prisma/client', rootDir);

    console.log('--- Generating Prisma Client (Root) ---');
    // Force generation into root node_modules so orchestrator sees it
    runCommand('npx prisma generate --schema=services/api/prisma/schema.prisma', rootDir);

    runCommand('npm install', serverDir);
    runCommand('npm run build', serverDir);

    // 5. Create Root Entry Point for Vercel
    const rootEntryFile = path.join(rootDir, 'index.js');
    const entryContent = `const express = require('express');
const path = require('path');

const app = express();

// Diagnostics Route
app.get('/api/debug-orchestrator', (req, res) => {
    try {
        const fs = require('fs');
        res.json({
            status: 'Orchestrator is alive',
            timestamp: new Date().toISOString(),
            rootDir: __dirname,
            backendBuilt: fs.existsSync(path.join(__dirname, 'services/api/dist/vercel-entry.js')),
            distFound: fs.existsSync(path.join(__dirname, 'dist/index.html')),
            env: {
                VERCEL: process.env.VERCEL,
                NODE_ENV: process.env.NODE_ENV
            }
        });
    } catch (e) {
        res.status(500).json({ error: "Diagnostics failed", message: e.message });
    }
});

// 1. Load Backend API
try {
    const backendApp = require('./services/api/dist/vercel-entry');
    // Ensure the backend app is handled correctly by express
    app.use(backendApp);
    console.log("✅ Backend App loaded and mounted");
} catch (error) {
    console.error("❌ Backend Load Error:", error);
    app.all('/api/*', (req, res) => {
        res.status(500).json({
            error: "Backend failed to load in orchestrator",
            message: error.message,
            stack: error.stack
        });
    });
}

// 2. Serve Static Frontend
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Handle SPA Routing for Frontend
app.get('*', (req, res) => {
    // If it starts with /api but reached here, it's a 404 for the API
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

module.exports = app;`;
    fs.writeFileSync(rootEntryFile, entryContent);
    console.log('Created Vercel Entrypoint at /index.js');

} catch (error) {
    console.error('Build script failed:', error);
    process.exit(1);
}
