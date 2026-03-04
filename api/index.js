/**
 * Vercel Serverless Function Entry Point
 * This file is tracked in Git to ensure Vercel enables the Functions pipeline.
 * The build-all.js script ensures the backend is built into services/api/dist.
 */

try {
    // Import the built Express app
    const app = require('../services/api/dist/vercel-entry');
    module.exports = app;
} catch (error) {
    console.error("API Entry Error:", error);
    module.exports = (req, res) => {
        res.status(503).json({
            error: "API not initialized",
            details: error.message,
            tip: "Ensure 'npm run build' completed successfully."
        });
    };
}
