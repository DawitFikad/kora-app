/**
 * ET-Ticket Platform v3.12.4 - API Proxy
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Global CORS & Log
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] API-REQ: ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Mounting the actual backend logic
try {
    const bundlePath = path.join(__dirname, 'bundle', 'vercel-entry.js');
    if (fs.existsSync(bundlePath)) {
        const bundle = require(bundlePath);
        const backendApp = bundle.default || bundle;
        
        // Use the backend app directly.
        // It expects paths starting with /api (from app.ts)
        app.use(backendApp);
    } else {
        app.get('/health', (req, res) => res.json({ status: "error", message: "Bundle missing" }));
    }
} catch (err) {
    console.error('Backend Load Error:', err);
    app.use((req, res) => res.status(500).json({ error: "Backend crash", message: err.message }));
}

module.exports = app;
