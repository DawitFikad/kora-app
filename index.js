/**
 * ET-Ticket Platform v3.12.0
 * Root entry point - serves static frontend files 
 * API requests are handled by api/index.js (Vercel native function)
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Health check (redundant safety net)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({ status: 'healthy', version: '3.12.0', service: 'root-fallback' });
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'dist')));

// SPA catch-all
app.get('(.*)', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found', path: req.path });
    }
    const index = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(index)) {
        res.sendFile(index);
    } else {
        res.status(404).send('Frontend not built. Run: node build-all.js');
    }
});

module.exports = app;
