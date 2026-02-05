// api/index.ts - Vercel Serverless Entry Point
// Updated: 2026-02-05 11:30 AM
// This exports the Express app for Vercel's zero-config deployment

let handler: any;

try {
    console.log("🔍 Loading app module...");
    const app = require("../src/app").default;

    console.log("🔍 Loading EmailService...");
    const { EmailService } = require("../src/services/email.service");

    console.log("🔍 Initializing EmailService...");
    EmailService.initialize();

    console.log("✅ All loaded successfully");
    handler = app;
} catch (error: any) {
    console.error("❌ CRITICAL ERROR IN api/index.ts:", error);

    // Create emergency fallback handler
    const express = require("express");
    const fallback = express();

    fallback.use((req: any, res: any) => {
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
export default handler;
