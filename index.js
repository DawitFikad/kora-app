/**
 * ET-Ticket Platform v3.12.0 - Monolithic Orchestrator
 * This is the ONLY entrypoint Vercel needs to find.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');

// Middleware for CORS (Manual for the main app)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// 1. HEALTH CHECK (Fast)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.0',
        mode: 'monolith-entry'
    });
});

// 2. LOAD BACKEND BUNDLE (Try/Catch for robustness)
try {
    const backendEntry = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendEntry)) {
        const backendApp = require('./.backend/vercel-entry');
        // Mount backend at /api
        app.use(backendApp);
        console.log('✅ Backend bundle mounted');
    }
} catch (err) {
    console.error('❌ Backend load error:', err.message);
}

// 3. SERVE STATIC FRONTEND
app.use(express.static(distPath));

// 4. SPA FALLBACK
app.get('/:path*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Application files not found. Build may be incomplete.');
    }
});

module.exports = app;
