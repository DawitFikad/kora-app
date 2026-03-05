"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
router.get("/config-check", async (req, res) => {
    try {
        const dbStatus = await prisma_1.prisma.$queryRaw `SELECT 1`.then(() => "connected").catch(err => `error: ${err.message}`);
        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: dbStatus,
            config: {
                apiUrl: env_1.env.apiUrl,
                hasChapaKey: !!env_1.env.chapaSecretKey,
                chapaKeyPrefix: env_1.env.chapaSecretKey ? env_1.env.chapaSecretKey.substring(0, 8) + '...' : 'none',
                hasTelebirrId: !!env_1.env.teleBirrMerchantAppId,
                nodeEnv: process.env.NODE_ENV,
                vercelUrl: process.env.VERCEL_URL
            }
        });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.default = router;
