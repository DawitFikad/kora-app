const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Diagnostic Info
const VERSION = '3.12.0';

// 1. Diagnostics Route
app.get('/api/debug-orchestrator', (req, res) => {
    try {
        const buildDirDirect = path.join(__dirname, 'services/api/dist/vercel-entry.js');
        const buildDirNested = path.join(__dirname, 'services/api/dist/src/vercel-entry.js');
        
        res.json({
            status: 'success',
            service: 'orchestrator',
            version: VERSION,
            timestamp: new Date().toISOString(),
            diagnostics: {
                rootDir: __dirname,
                backendBuildDirect: fs.existsSync(buildDirDirect),
                backendBuildNested: fs.existsSync(buildDirNested),
                frontendDist: fs.existsSync(path.join(__dirname, 'dist/index.html')),
            },
            env: {
                VERCEL: process.env.VERCEL || 'false',
                NODE_ENV: process.env.NODE_ENV || 'development'
            }
        });
    } catch (e) {
        res.status(500).json({ error: "Diagnostics failed", message: e.message });
    }
});

// 2. Load Backend API
try {
    let backendRelativePath = './services/api/dist/vercel-entry';
    const directPath = path.join(__dirname, 'services/api/dist/vercel-entry.js');
    const nestedPath = path.join(__dirname, 'services/api/dist/src/vercel-entry.js');
    
    if (!fs.existsSync(directPath) && fs.existsSync(nestedPath)) {
        console.log("ℹ️ Using nested backend path: /dist/src/vercel-entry");
        backendRelativePath = './services/api/dist/src/vercel-entry';
    } else if (!fs.existsSync(directPath)) {
        console.error("❌ Backend entry point NOT FOUND in /dist or /dist/src");
    }

    const backendApp = require(backendRelativePath);
    // Express 5 requires (.*) for wildcards, so we mount the backend app
    app.use(backendApp);
    console.log("✅ Backend App mounted successfully from:", backendRelativePath);
} catch (error) {
    console.error("❌ Backend Load Error:", error);
    // Graceful failure for API requests
    app.all('/api/(.*)', (req, res) => {
        res.status(503).json({
            error: "Backend unavailable",
            message: error.message,
            tip: "Check build logs to ensure 'services/api' compiled without errors.",
            version: VERSION
        });
    });
}

// 3. Serve Static Frontend
app.use(express.static(path.join(__dirname, 'dist')));

// 4. Handle SPA Routing for Frontend
// Express 5: Need (.*) instead of * for wildcards
app.get('(.*)', (req, res) => {
    // If it starts with /api but reached here, it's a 404 for the API
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found", path: req.path });
    }
    
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend build not found. Please run build script.');
    }
});

module.exports = app;