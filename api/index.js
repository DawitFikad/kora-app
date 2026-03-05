/**
 * ET-Ticket Platform v3.12.0
 * Native Serverless Entrypoint
 */
const path = require('path');
const fs   = require('fs');

let handler;

try {
    const entryPath = path.join(__dirname, 'serverless', 'vercel-entry.js');
    if (!fs.existsSync(entryPath)) throw new Error('Backend logic missing at ' + entryPath);

    handler = require('./serverless/vercel-entry');
    console.log('✅ [api/index.js] Function loaded successfully');
} catch (err) {
    console.error('❌ [api/index.js] Load error:', err.message);
    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error:   'Backend Initialize Failed',
            message: err.message,
            version: '3.12.0'
        }));
    };
}

module.exports = handler;
