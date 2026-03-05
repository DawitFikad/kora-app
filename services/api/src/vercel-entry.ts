// vercel-entry.ts - v3.12.0 Ultra-defensive Entry Point
import express, { Request, Response } from "express";

const baseApp = express();

// 1. Pre-register health check (Clean path, no wildcards)
baseApp.get("/api/health-check-v3", (req: Request, res: Response) => {
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
    console.log("🚀 [v3.12.0] Loading Main Application...");

    // Optional services
    try {
        // Use dynamic import to handle potential load errors
        const { EmailService } = require("./services/email.service");
        EmailService.initialize();
    } catch (e) { }

    // Load actual app
    // We use require here to allow for the catch blocks to work as intended during runtime
    const mainAppModule = require("./app").default;
    if (mainAppModule && typeof mainAppModule === "function") {
        app = mainAppModule;
        console.log("✅ Main app loaded");
    }
} catch (error: any) {
    console.error("❌ STARTUP ERROR:", error.message);

    // Final fallback: Use a handler that doesn't use Express routing wildcards
    app = (req: any, res: any) => {
        if (req.url === '/api/health-check-v3') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: "healthy", version: "3.12.0", note: "fallback-active" }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: "Server Initialization Failed",
            message: error?.message || "Unknown error during initialization",
            tip: "Check build logs for Expression syntax errors (Express 5 compatibility)."
        }));
    };
}

export default app;
