import { PrismaClient } from "@prisma/client";

// Use pooled DATABASE_URL for serverless to handle many concurrent connections
let databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

// 🔹 CRITICAL: Force Transaction Mode (Port 6543) if using the pooler on Port 5432
if (databaseUrl && databaseUrl.includes('pooler.supabase.com:5432')) {
    console.log("Using Supabase Pooler: Switching to Port 6543 for Transaction Mode");
    databaseUrl = databaseUrl.replace(':5432/', ':6543/');
}

// Add connection_limit=1 to prevent serverless functions from exhausting the pool
if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}connection_limit=1`;
}

// Prevent multiple instances in development
declare global {
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    },
    // Log queries in dev, warnings/errors in prod
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export { prisma };
