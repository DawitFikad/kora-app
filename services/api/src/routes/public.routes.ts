import { Router } from "express";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/config-check", async (req, res) => {
    try {
        const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => "connected").catch(err => `error: ${err.message}`);

        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: dbStatus,
            config: {
                apiUrl: env.apiUrl,
                hasChapaKey: !!env.chapaSecretKey,
                chapaKeyPrefix: env.chapaSecretKey ? env.chapaSecretKey.substring(0, 8) + '...' : 'none',
                hasTelebirrId: !!env.teleBirrMerchantAppId,
                nodeEnv: process.env.NODE_ENV,
                vercelUrl: process.env.VERCEL_URL
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;
