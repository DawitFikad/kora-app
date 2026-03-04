// vercel-entry.ts - Serverless Function Entry Point
// Using CommonJS for maximum Vercel compatibility

let app: any;

try {
    console.log("🚀 Starting Serverless Function...");
    const { EmailService } = require("./services/email.service");
    EmailService.initialize();

    app = require("./app").default;
    console.log("✅ App loaded successfully");
} catch (error: any) {
    console.error("❌ CRITICAL STARTUP ERROR:", error);
    // Fallback app to report error to client
    const express = require("express");
    app = express();
    app.all("(.*)", (req: any, res: any) => {
        res.status(500).json({
            error: "Server Startup Failed",
            details: error?.message || String(error),
            stack: error?.stack || undefined
        });
    });
}

// CommonJS export for Vercel
module.exports = app;
