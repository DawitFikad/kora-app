/**
 * ET-Ticket Platform v3.12.6 - MASTER SERVER
 * Location: /api/index.js
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const staticPath = path.join(__dirname, '..', '.static');
const backendPath = path.join(__dirname, '..', '.backend', 'vercel-entry.js');

// 1. Diagnostics & CORS
app.use((req, res, next) => {
    // Log every request to Vercel logs
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. Health Check
app.get('/api/health-check-v3', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.6-master',
        timestamp: new Date().toISOString(),
        env: {
            db: !!process.env.DATABASE_URL,
            chapa: !!process.env.CHAPA_SECRET_KEY
        }
    });
});

// 3. Mount Backend Logic
try {
    if (fs.existsSync(backendPath)) {
        const bundle = require(backendPath);
        const backendApp = bundle.default || bundle;
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend Mounted');
        }
    } else {
        console.error('❌ Backend bundle missing at ' + backendPath);
    }
} catch (err) {
    console.error('🔥 Backend Load Error:', err.message);
}

// 4. Serve Static Files
app.use(express.static(staticPath));

// 5. Catch-all for SPA
app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Build inconsistent. Please redeploy.');
    }
});

module.exports = app;
