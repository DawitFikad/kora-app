/**
 * ET-Ticket Platform v3.12.9-ULTIMATE
 * Deployment ID: ${Date.now()}
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

const staticPath = path.join(__dirname, '.static');
const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');

// Global CORS & Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Health check
app.get('/api/health-check-v3', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.9-ultimate',
        timestamp: new Date().toISOString()
    });
});

// Mount Backend
try {
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        const backendApp = bundle.default || bundle;
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend Mounted');
        }
    }
} catch (err) {
    console.error('🔥 Backend Load Error:', err.message);
}

// Serve Static Files
app.use(express.static(staticPath));

// SPA Fallback
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    const idx = path.join(staticPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).json({ error: 'UI build missing' });
    }
});

module.exports = app;
