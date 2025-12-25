import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

let url: URL;
try {
    url = new URL(databaseUrl);
} catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${databaseUrl}`);
}

const pool = new pg.Pool({
    host: url.hostname,
    port: parseInt(url.port || "5432"),
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
