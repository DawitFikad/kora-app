/**
 * ET-Ticket Platform v3.12.3 - Ultimate Orchestrator
 * Fixes: CORS, default exports, Path stripping, Detailed error reporting.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// 1. Global CORS & Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. Health Check (Immediate)
app.get('/api/health-check-v3', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        version: '3.12.3',
        orchestrator: 'universal-v3-ultimate',
        timestamp: new Date().toISOString(),
        request: {
            url: req.url,
            path: req.path,
            method: req.method
        }
    });
});

// 3. Mount Backend Logic
try {
    const backendEntry = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendEntry)) {
        const bundle = require(backendEntry);
        const backendApp = bundle.default || bundle;
        
        if (typeof backendApp === 'function') {
            // Mount the backend app. 
            // Since this app will handle requests at /api/*, we mount it at root /
            // It will see the full path (e.g. /api/auth/...) and match its own routes.
            app.use(backendApp);
            console.log('✅ Backend bundle loaded and mounted');
        } else {
            console.error('❌ Backend bundle exported something other than a function:', typeof backendApp);
        }
    } else {
        console.error('❌ Backend entry missing at:', backendEntry);
    }
} catch (err) {
    console.error('❌ MONOLITH LOAD FAIL:', err.message);
    console.error(err.stack);
}

// 4. Final Fallback for API (404 JSON)
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'API Endpoint Not Found',
        path: req.url,
        version: '3.12.3'
    });
});

// 5. Global Error Handler for Orchestrator
app.use((err, req, res, next) => {
    console.error('🔥 Orchestrator Error:', err);
    res.status(500).json({
        error: 'Orchestrator Internal Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;
