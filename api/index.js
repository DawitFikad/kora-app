/**
 * ET-Ticket Platform v3.12.0
 * Vercel Serverless Function
 */

const path = require('path');
const fs = require('fs');

let handler;

try {
    // Hidden backend folder to avoid Vercel Function Discovery conflicts
    const entryPath = path.join(__dirname, '.backend', 'vercel-entry.js');

    if (!fs.existsSync(entryPath)) {
        throw new Error(`api/.backend/vercel-entry.js not found`);
    }

    handler = require('./.backend/vercel-entry');
    console.log('✅ [api/index.js] Backend loaded');

} catch (err) {
    console.error('❌ [api/index.js] Startup error:', err.message);

    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error: 'Backend Initialize Failed',
            message: err.message,
            tip: 'Check Vercel Build logs for "api/.backend" population.'
        }));
    };
}

module.exports = handler;
