/**
 * ET-Ticket Platform v3.12.0
 * Vercel Serverless Function - API Entry Point
 */

const path = require('path');
const fs = require('fs');

let handler;

try {
    // Load from the bundle created by build-all.js
    const entryPath = path.join(__dirname, '../backend-bundle/vercel-entry.js');

    if (!fs.existsSync(entryPath)) {
        throw new Error(`API bundle not found at ${entryPath}`);
    }

    handler = require('../backend-bundle/vercel-entry');
    console.log('✅ [api/index.js] Backend bundle loaded');

} catch (err) {
    console.error('❌ [api/index.js] Load error:', err.message);

    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error: 'API Initialization Failed',
            message: err.message,
            tip: 'Check Vercel Build logs for /backend-bundle population.'
        }));
    };
}

module.exports = handler;
