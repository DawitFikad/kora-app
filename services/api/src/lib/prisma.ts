import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// Use pooled DATABASE_URL for serverless to handle many concurrent connections
let databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

// 🔹 CRITICAL: Force Transaction Mode (Port 6543) if using the pooler on Port 5432
// Port 5432 on the pooler is "Session Mode" and will hit "Max Clients" errors immediately on Vercel.
if (databaseUrl && databaseUrl.includes('pooler.supabase.com:5432')) {
    databaseUrl = databaseUrl.replace(':5432/', ':6543/');
}

// Add connection_limit=1 to prevent serverless functions from exhausting the pool
if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}connection_limit=1`;
}

let prismaInstance: PrismaClient | null = null;

const getPrisma = () => {
    if (!prismaInstance) {
        try {
            if (!databaseUrl) {
                console.error('DATABASE_URL or DIRECT_URL environment variable is not set.');
                prismaInstance = new PrismaClient();
                return prismaInstance;
            }

            // Using standard Prisma initialization without custom driver adapter for better compatibility
            prismaInstance = new PrismaClient({
                datasources: {
                    db: {
                        url: databaseUrl
                    }
                }
            });
            console.log("✅ Prisma Client Initialized (Standard)");
        } catch (err) {
            console.error("❌ Failed to initialize Prisma:", err);
            prismaInstance = new PrismaClient();
        }
    }
    return prismaInstance;
};

// Proxy to delay initialization until property access
export const prisma = new Proxy({} as PrismaClient, {
    get: (_target, prop) => {
        const client = getPrisma();
        if (!client) return undefined;
        // @ts-ignore
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});
