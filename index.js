/**
 * ET-Ticket Platform v3.12.0 - Universal Orchestrator
 * This is the root index.js that Vercel looks for.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');
const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');

// 1. HEALTH CHECK (Fast)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.0',
        mode: 'universal-orchestrator',
        timestamp: new Date().toISOString()
    });
});

// 2. MOUNT BACKEND (Priority: Same Express instance for CORS/MIME consistency)
try {
    if (fs.existsSync(backendPath)) {
        const backendApp = require('./.backend/vercel-entry');
        // Mount backend logic. Backend handles its own CORS.
        app.use(backendApp);
    }
} catch (err) {
    console.error('❌ Backend Fail:', err.message);
}

// 3. SERVE STATIC ASSETS BEFORE CATCH-ALL
app.use(express.static(distPath));

// 4. SPA FALLBACK (For React Navigation)
app.get('/:path*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Application build missing. Please check build logs.');
    }
});

// Export as an Express handler for Vercel V2 legacy adaptation
module.exports = app;
