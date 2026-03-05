"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
async function main() {
    try {
        console.log("Connecting to DB...");
        console.log("URL:", process.env.DATABASE_URL); // Log sanitized if possible, but for me checking I need to be sure.
        await prisma.$connect();
        console.log("✅ Connection Successful!");
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    }
    catch (e) {
        console.error("❌ Connection Failed:", e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
