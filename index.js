/**
 * Vercel Entrypoint
 * This file acts as the primary orchestrator for the ET-Ticket Platform.
 * During the build, build-all.js replaces this content with the actual logic
 * that connects the backend dist and ensures frontend static serving.
 */

try {
    // Attempt to load the built app
    const fs = require('fs');
    const path = require('path');
    let backendPath = './services/api/dist/vercel-entry';

    // Fallback check for nested src if build didn't use rootDir fix yet
    if (!fs.existsSync(path.join(__dirname, 'services/api/dist/vercel-entry.js')) &&
        fs.existsSync(path.join(__dirname, 'services/api/dist/src/vercel-entry.js'))) {
        backendPath = './services/api/dist/src/vercel-entry';
    }

    module.exports = require(backendPath);
} catch (e) {
    // Fallback for Vercel's initial analysis or failed builds
    const express = require('express');
    const app = express();
    // Express 5 needs (.*)
    app.all('(.*)', (req, res) => {
        res.status(503).json({
            error: "Service building or initialization failed",
            detail: e.message,
            tip: "Please check Vercel build logs if this persists."
        });
    });
    module.exports = app;
}
