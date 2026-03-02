const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();
const fs = require('fs');
async function main() {
    const users = await prisma.user.findMany({
        where: { phoneNumber: { contains: "222222" } },
        include: { organizer: true }
    });
    fs.writeFileSync('dump.json', JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
