"use strict";
// api/index.ts - Vercel Serverless Entry Point
// Updated: 2026-02-05 11:30 AM
// This exports the Express app for Vercel's zero-config deployment
Object.defineProperty(exports, "__esModule", { value: true });
let handler;
try {
    console.log("🔍 Loading app module...");
    const app = require("../src/app").default;
    console.log("🔍 Loading EmailService...");
    const { EmailService } = require("../src/services/email.service");
    console.log("🔍 Initializing EmailService...");
    EmailService.initialize();
    console.log("✅ All loaded successfully");
    // WRAPPER to handle version check before Express
    handler = (req, res) => {
        // Broad check for 'version' in URL
        if (req.url && req.url.includes('version')) {
            return res.status(200).json({
                status: "Direct Index Check v3.12.0",
                received_url: req.url,
                original_url: req.originalUrl,
                headers_host: req.headers.host,
                timestamp: new Date().toISOString(),
                env_check: {
                    chapa: !!process.env.CHAPA_SECRET_KEY,
                    db: !!process.env.DATABASE_URL
                }
            });
        }
        return app(req, res);
    };
}
catch (error) {
    console.error("❌ CRITICAL ERROR IN api/index.ts:", error);
    // Create emergency fallback handler
    const express = require("express");
    const fallback = express();
    fallback.use((req, res) => {
        res.status(500).json({
            error: "Serverless Function Initialization Failed",
            message: error?.message || String(error),
            stack: error?.stack,
            phase: "api/index.ts loading"
        });
    });
    handler = fallback;
}
// Export for Vercel
exports.default = handler;
