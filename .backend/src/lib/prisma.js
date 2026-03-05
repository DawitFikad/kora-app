"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// 🚀 V3.12.0: Use DIRECT_URL for stability on serverless if possible
// The pooled URL can sometimes drop connections ("Connection is closed")
let databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (process.env.NODE_ENV === 'production' && process.env.DIRECT_URL) {
    console.log("[Prisma] Production Mode: Switched to DIRECT_URL for stability");
    databaseUrl = process.env.DIRECT_URL;
}
// 🔹 CRITICAL: Handle Supabase Pooler (Port 6543 is Transaction Mode)
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
    if (databaseUrl.includes(':5432')) {
        console.log("Using Supabase Pooler: Switching to Port 6543 for Transaction Mode");
        databaseUrl = databaseUrl.replace(':5432', ':6543');
    }
    // Ensure pgbouncer=true is present for pooler connections to Prisma
    if (!databaseUrl.includes('pgbouncer=true')) {
        const separator = databaseUrl.includes('?') ? '&' : '?';
        databaseUrl = `${databaseUrl}${separator}pgbouncer=true`;
    }
}
console.log(`[Prisma] Initializing with URL: ${databaseUrl?.split('@')[1]?.split('?')[0]} (Masked)`);
// Add connection_limit=3 to allow some parallel queries within the same function instance
if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}connection_limit=3`;
}
const prisma = global.prisma || new client_1.PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    },
    // Log queries in dev, warnings/errors in prod
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
