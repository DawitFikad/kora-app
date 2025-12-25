const { PrismaClient, Role } = require('@prisma/client');
require('dotenv').config();


const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function main() {
    const phoneNumber = process.argv[2];
    if (!phoneNumber) {
        console.error('Please provide a phone number: node scripts/make-admin.js +251912345678');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        const user = await prisma.user.upsert({
            where: { phoneNumber },
            update: {
                role: 'ADMIN'
            },
            create: {
                phoneNumber,
                role: 'ADMIN',
                profile: {
                    create: {
                        fullName: 'System Admin',
                        language: 'en'
                    }
                }
            },
        });

        console.log(`SUCCESS: User ${phoneNumber} is now set as ADMIN.`);
    } catch (error) {
        console.error('FAILED to update user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
