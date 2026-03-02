const { PrismaClient, Role, AccountStatus, OrganizerStatus } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { phoneNumber: "0922222222" },
        include: { organizer: true }
    });
    console.log(JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
