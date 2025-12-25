import { PrismaClient, Role } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    const phoneNumber = process.argv[2];
    if (!phoneNumber) {
        console.error('Please provide a phone number: npx ts-node scripts/make-admin.ts +251912345678');
        process.exit(1);
    }

    const user = await prisma.user.upsert({
        where: { phoneNumber },
        update: {
            role: Role.ADMIN
        },
        create: {
            phoneNumber,
            role: Role.ADMIN,
            profile: {
                create: {
                    fullName: 'System Admin',
                    language: 'en'
                }
            }
        },
    });

    console.log(`SUCCESS: User ${phoneNumber} is now set as ADMIN.`);
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
