import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
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
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        try {
            console.log("Testing Event query...");
            const eventCount = await prisma.event.count();
            console.log(`Event count: ${eventCount}`);
        } catch (e: any) {
            console.error("❌ Event query failed:", e.message);
        }

        try {
            console.log("Testing HomepageBanner query...");
            const bannerCount = await prisma.homepageBanner.count();
            console.log(`HomepageBanner count: ${bannerCount}`);
        } catch (e: any) {
            console.error("❌ HomepageBanner query failed:", e.message);
        }

    } catch (e) {
        console.error("❌ Connection Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
