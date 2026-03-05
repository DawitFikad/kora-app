/**
 * ET-Ticket Platform v3.12.2 - Universal Orchestrator
 * Fixes: Path stripping from /api folder, Express 5 compatibility, Static resolution.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');
const backendEntry = path.join(__dirname, '.backend', 'vercel-entry.js');

// Global Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Explicit CORS Preflight
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(204);
});

// 1. Root-level Health Check (Fast)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.2',
        orchestrator: 'universal-v3',
        timestamp: new Date().toISOString()
    });
});

// 2. Mount Backend App
try {
    if (fs.existsSync(backendEntry)) {
        const bundle = require('./.backend/vercel-entry');
        const backendApp = bundle.default || bundle;
        
        // Use app.all() to capture ANY /api/* request and pass it to backend
        app.use(backendApp);
        console.log('✅ Backend logic mounted');
    } else {
        console.error('❌ Backend bundle missing at:', backendEntry);
    }
} catch (err) {
    console.error('❌ MONOLITH FAIL:', err.message);
}

// 3. Serve Static Files
app.use(express.static(distPath));

// 4. SPA Fallback
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'API route not found', 
            path: req.url,
            v: '3.12.2'
        });
    }
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Static application files missing. Deployment incomplete.');
    }
});

module.exports = app;
