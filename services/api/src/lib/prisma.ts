import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// Try DIRECT_URL first (non-pooled) as it's more reliable for serverless
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

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
