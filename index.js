const express = require('express');
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
    // We expect dist/vercel-entry.js (CommonJS)
    const backendApp = require('./services/api/dist/vercel-entry');
    // Ensure the backend app is handled correctly by express
    app.use(backendApp);
    console.log("✅ Backend App loaded and mounted");
} catch (error) {
    console.error("❌ Backend Load Error:", error);
    // Express 5: Need (.*) instead of * for wildcards
    app.all('/api/(.*)', (req, res) => {
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
// Express 5: Need (.*) instead of * for wildcards
app.get('(.*)', (req, res) => {
    // If it starts with /api but reached here, it's a 404 for the API
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

module.exports = app;