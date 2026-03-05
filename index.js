/**
 * ET-Ticket Platform v3.12.0 - Root Orchestrator
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app = express();

const distPath = path.join(__dirname, 'dist');

// 1. Serve static files FIRST
app.use(express.static(distPath));

// 2. Health check
app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'ok', version: '3.12.0', mode: 'proxy-fallback' });
});

// 3. SPA Catch-all
app.get('/:path*', (req, res) => {
    const idx = path.join(distPath, 'index.html');
    if (fs.existsSync(idx)) {
        res.sendFile(idx);
    } else {
        res.status(404).send('Frontend files not found in /dist. Path: ' + req.path);
    }
});

module.exports = app;
