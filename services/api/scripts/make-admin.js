const { PrismaClient, Role, AccountStatus } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const phoneNumber = process.argv[2];
    if (!phoneNumber) {
        console.log('\n❌ Error: Please provide a phone number.');
        console.log('Usage: node scripts/make-admin.js <phone_number>');
        console.log('Example: node scripts/make-admin.js 0911223344\n');
        process.exit(1);
    }

    try {
        console.log(`\n🔍 Checking user with phone: ${phoneNumber}...`);

        const user = await prisma.user.upsert({
            where: { phoneNumber },
            update: {
                role: Role.ADMIN,
                status: AccountStatus.ACTIVE
            },
            create: {
                phoneNumber,
                role: Role.ADMIN,
                status: AccountStatus.ACTIVE,
                profile: {
                    create: {
                        fullName: 'System Admin',
                        language: 'en'
                    }
                }
            },
        });

        console.log('✅ SUCCESS!');
        console.log('-----------------------------------');
        console.log(`User ID:   ${user.id}`);
        console.log(`Phone:     ${user.phoneNumber}`);
        console.log(`Role:      ${user.role}`);
        console.log(`Status:    ${user.status}`);
        console.log('-----------------------------------\n');

    } catch (error) {
        console.error('\n❌ FAILED to update user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
