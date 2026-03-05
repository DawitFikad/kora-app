/**
 * ET-Ticket Platform v3.12.1 - Consolidated Orchestrator
 * Fixes: Express 5 wildcard syntax, ESM/.default require, Static/API split.
 */
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app = express();
const distPath = path.join(__dirname, 'dist');

// Middleware to log requests (helpful for debugging Vercel logs)
app.use((req, res, next) => {
    console.log('[Request]', req.method, req.url);
    next();
});

// 1. Health Check (Immediate)
app.get('/api/health-check-v3', (_req, res) => {
    res.json({
        status: 'healthy',
        version: '3.12.1',
        mode: 'monolith',
        timestamp: new Date().toISOString()
    });
});

// 2. Mount Backend Logic
try {
    const backendPath = path.join(__dirname, '.backend', 'vercel-entry.js');
    if (fs.existsSync(backendPath)) {
        const backendModule = require(backendPath);
        // CRITICAL: Handle ESM 'default' export from TypeScript compilation
        const backendApp = backendModule.default || backendModule;
        
        if (typeof backendApp === 'function') {
            app.use(backendApp);
            console.log('✅ Backend bundle mounted successfully');
        } else {
            console.error('❌ Backend bundle did not export a function/app');
        }
    } else {
        console.error('❌ Backend entry missing at:', backendPath);
    }
} catch (err) {
    console.error('❌ Failed to load backend bundle:', err.message);
    console.error(err.stack);
}

// 3. Serve Static Assets
app.use(express.static(distPath));

// 4. SPA Fallback (Catch-all)
// Using app.use() at the very end as a catch-all is safer than Express 5's regex or wildcards.
app.use((req, res) => {
    // If it's an API call that wasn't caught, return 404 JSON
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found: ' + req.url });
    }
    
    // Otherwise, serve index.html for React SPA
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Static application files not found. Build may be incomplete.');
    }
});

module.exports = app;
