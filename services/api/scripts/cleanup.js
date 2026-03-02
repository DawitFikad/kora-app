const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();
async function main() {
    await prisma.organizerProfile.deleteMany({ where: { contactPhone: { contains: "222222" } } });
    await prisma.user.deleteMany({ where: { phoneNumber: { contains: "222222" } } });

    await prisma.organizerProfile.deleteMany({ where: { contactPhone: { contains: "910639875" } } });
    await prisma.user.deleteMany({ where: { phoneNumber: { contains: "910639875" } } });
    console.log("Deleted duplicates.");
}
main().finally(() => prisma.$disconnect());
