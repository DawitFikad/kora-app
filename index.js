/**
 * Vercel Entrypoint
 * This file acts as the primary orchestrator for the ET-Ticket Platform.
 * During the build, build-all.js replaces this content with the actual logic
 * that connects the backend dist and ensures frontend static serving.
 */

try {
    // Attempt to load the built app (this will exist after build-all.js runs)
    const backendPath = './services/api/dist/vercel-entry';
    module.exports = require(backendPath);
} catch (e) {
    // Fallback for Vercel's initial analysis or failed builds
    const express = require('express');
    const app = express();
    app.all('*', (req, res) => {
        res.status(503).json({
            error: "Service building...",
            tip: "Please check Vercel build logs if this persists."
        });
    });
    module.exports = app;
}
