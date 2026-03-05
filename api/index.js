/**
 * ET-Ticket Platform v3.12.0
 * Vercel Serverless Function - Primary Entry Point
 * 
 * api/dist/ is populated by build-all.js (copied from services/api/dist/)
 * All external requires resolve to ROOT node_modules - Vercel traces correctly.
 */

const path = require('path');
const fs = require('fs');

let handler;

try {
    // dist/ is in the same directory as this file (api/dist/vercel-entry.js)
    const entryPath = path.join(__dirname, 'dist', 'vercel-entry.js');

    if (!fs.existsSync(entryPath)) {
        throw new Error(`dist/vercel-entry.js not found at: ${entryPath}. Build may have failed.`);
    }

    handler = require('./dist/vercel-entry');
    console.log('✅ [api/index.js v3.12.0] Backend loaded successfully');

} catch (err) {
    console.error('❌ [api/index.js] Startup error:', err.message);

    // Ultra-safe fallback - uses only built-in Node.js modules
    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error: 'Backend failed to initialize',
            version: '3.12.0',
            message: err.message,
            path: req.url,
            tip: 'Check Vercel build logs. Ensure build-all.js ran successfully.',
            timestamp: new Date().toISOString()
        }));
    };
}

module.exports = handler;
