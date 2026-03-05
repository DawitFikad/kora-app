/**
 * ET-Ticket Platform v3.12.0 - Root Fallback
 * Serves static frontend files.
 * API requests are handled by /api/index.js (Vercel native function).
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app = express();

app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'ok', version: '3.12.0', source: 'root-fallback' });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('(.*)', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found', path: req.path });
    }
    const idx = path.join(__dirname, 'dist', 'index.html');
    fs.existsSync(idx)
        ? res.sendFile(idx)
        : res.status(404).send('Frontend not built.');
});

module.exports = app;
