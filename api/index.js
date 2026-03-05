/**
 * ET-Ticket Platform v3.12.0
 * Vercel Serverless Function Proxy
 */
const path = require('path');
const fs   = require('fs');

let handler;

try {
    const entry = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(entry)) {
        handler = require('./.backend/vercel-entry');
        console.log('✅ Backend bundle loaded safely');
    } else {
        throw new Error('Backend entry not found at: ' + entry);
    }
} catch (err) {
    console.error('❌ Backend initialization error:', err.message);
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
