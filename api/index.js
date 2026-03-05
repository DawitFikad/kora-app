/**
 * ET-Ticket Platform v3.12.0
 * Native Serverless Entrypoint
 */
const path = require('path');
const fs   = require('fs');

let handler;

try {
    const entryPath = path.join(__dirname, 'bundle', 'vercel-entry.js');
    if (!fs.existsSync(entryPath)) throw new Error('Backend bundle missing at ' + entryPath);

    handler = require('./bundle/vercel-entry');
    console.log('✅ Function loaded successfully');
} catch (err) {
    console.error('❌ Load error:', err.message);
    handler = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({
            error:   'Backend Initialize Failed',
            message: err.message,
            version: '3.12.0',
            timestamp: new Date().toISOString()
        }));
    };
}

module.exports = handler;
