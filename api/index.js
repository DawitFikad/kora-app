/**
 * ET-Ticket Platform v3.12.0
 * Vercel Serverless Function - Primary Entry Point
 * Located in /api/ so Vercel automatically treats it as a serverless function.
 */

const path = require('path');
const fs = require('fs');

// Try both possible dist locations
const DIST_PATHS = [
    path.join(__dirname, '../services/api/dist/vercel-entry.js'),
    path.join(__dirname, '../services/api/dist/src/vercel-entry.js'),
];

let handler;

for (const distPath of DIST_PATHS) {
    if (fs.existsSync(distPath)) {
        try {
            handler = require(distPath);
            console.log('✅ [api/index.js] Backend loaded from:', distPath);
            break;
        } catch (err) {
            console.error('❌ [api/index.js] Failed to load from:', distPath, err.message);
        }
    }
}

if (!handler) {
    // No dist available - create a minimal fallback
    const express = require('express');
    const fallback = express();

    // Probe which dist files exist for diagnostics
    const distProbe = DIST_PATHS.map(p => ({ path: p, exists: fs.existsSync(p) }));

    fallback.get('/api/health-check-v3', (_req, res) => {
        res.json({
            status: 'degraded',
            version: '3.12.0',
            error: 'Backend dist not found',
            probe: distProbe,
            tip: 'Ensure build-all.js ran successfully. Check Vercel build logs.',
            timestamp: new Date().toISOString()
        });
    });

    fallback.all('(.*)', (_req, res) => {
        res.status(503).json({
            error: 'API backend not compiled',
            version: '3.12.0',
            probe: distProbe,
            tip: 'Run "node build-all.js" and redeploy, or check Vercel build logs.',
        });
    });

    handler = fallback;
    console.error('❌ [api/index.js] FATAL: No backend dist found. Using fallback.');
}

module.exports = handler;
