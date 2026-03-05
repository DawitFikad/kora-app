/**
 * ET-Ticket Platform v3.12.5 - MASTER MONOLITH
 * This file handles BOTH static UI and dynamic API in a single Vercel Function for 100% stability.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// 1. Diagnostics & CORS
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. Immediate Health Check
app.get('/api/health-check-v3', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.5',
        type: 'master-monolith',
        timestamp: new Date().toISOString(),
        chapa: !!process.env.CHAPA_SECRET_KEY
    });
});

// 3. Mount Backend Bundle
try {
    const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        // Handle ES Modules .default
        const backendApp = bundle.default || bundle;
        
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend Mounted');
        } else {
            console.error('❌ Backend exported non-function:', typeof backendApp);
        }
    } else {
        console.error('❌ Backend bundle missing');
    }
} catch (err) {
    console.error('🔥 Backend Load Error:', err.message);
}

// 4. Serve Static Files from .static
// We do this AFTER mounting the backend to give API routes priority
const staticPath = path.join(__dirname, '.static');
app.use(express.static(staticPath));

// 5. SPA Fallback / Catch-all
app.get('*', (req, res) => {
    // If it's an API call that failed, return JSON
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    
    // Otherwise, serve the SPA index.html
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Application build missing. Contact Support.');
    }
});

// 6. Global Function-level Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER CRASH:', err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
        v: '3.12.5'
    });
});

module.exports = app;
