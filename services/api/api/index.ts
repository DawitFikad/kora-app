// api/index.ts - Vercel Serverless Entry Point
// Updated: 2026-03-05
import { VercelRequest, VercelResponse } from '@vercel/node';
import app from "../src/app";
import { EmailService } from "../src/services/email.service";

// Initialize critical services
try {
    console.log("🔍 Initializing EmailService...");
    EmailService.initialize();
} catch (e) {
    console.warn("⚠️ EmailService initialization warning:", e);
}

// Export the handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Broad check for 'version' in URL for diagnostics
        if (req.url && req.url.includes('version')) {
            return res.status(200).json({
                status: "Direct Index Check v3.12.1",
                received_url: req.url,
                original_url: (req as any).originalUrl,
                headers_host: req.headers.host,
                timestamp: new Date().toISOString(),
                env_check: {
                    chapa: !!process.env.CHAPA_SECRET_KEY,
                    db: !!process.env.DATABASE_URL,
                    node_env: process.env.NODE_ENV
                }
            });
        }

        // Forward to Express app
        return app(req, res);
    } catch (error: any) {
        console.error("❌ CRITICAL ERROR IN api/index.ts handler:", error);
        return res.status(500).json({
            error: "Serverless Function Execution Failed",
            message: error?.message || String(error),
            stack: error?.stack,
            phase: "handler execution"
        });
    }
}

