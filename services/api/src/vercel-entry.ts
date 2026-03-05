// vercel-entry.ts - Ultra-defensive Serverless Function Entry Point

// STEP 1: Create a base Express app IMMEDIATELY so we always have something to respond
const express = require("express");
const baseApp = express();

// Add a basic health check BEFORE anything else loads
baseApp.get("/api/health-check-v3", (_req: any, res: any) => {
    res.json({
        status: "healthy",
        version: "3.12.0",
        service: "ET-Ticket API v3",
        timestamp: new Date().toISOString(),
        mode: "vercel-serverless"
    });
});

let app: any = baseApp;

try {
    console.log("🚀 [v3.12.0] Starting Serverless Function...");

    // Initialize email service (non-fatal)
    try {
        const { EmailService } = require("./services/email.service");
        EmailService.initialize();
    } catch (emailErr: any) {
        console.warn("⚠️ EmailService init failed (non-fatal):", emailErr.message);
    }

    // Load the main Express app
    const mainApp = require("./app").default;

    if (mainApp && typeof mainApp === "function") {
        app = mainApp;
        console.log("✅ App loaded successfully");
    } else {
        console.error("❌ App loaded but is not a function, using base app");
    }
} catch (error: any) {
    console.error("❌ CRITICAL STARTUP ERROR:", error.message);
    console.error("Stack:", error.stack);

    // Fallback: extend baseApp with error reporting
    baseApp.all("/:path*", (req: any, res: any) => {
        // Still serve health check (already registered above)
        res.status(500).json({
            error: "Server Startup Failed",
            message: error?.message || String(error),
            version: "3.12.0",
            path: req.path,
            tip: "Check Vercel Function Logs for full stack trace."
        });
    });
    app = baseApp;
}

// CommonJS export for Vercel
module.exports = app;
