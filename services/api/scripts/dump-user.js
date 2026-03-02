const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();
async function main() {
    console.log("--- USERS ---");
    const users = await prisma.user.findMany({
        where: { phoneNumber: { contains: "222222" } },
        include: { organizer: true }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log("\n--- ORGANIZERS ---");
    const orgs = await prisma.organizerProfile.findMany({
        where: { contactPhone: { contains: "222222" } }
    });
    console.log(JSON.stringify(orgs, null, 2));
}
main().finally(() => prisma.$disconnect());
