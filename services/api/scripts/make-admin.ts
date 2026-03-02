import { PrismaClient, Role, OrganizerStatus } from '@prisma/client';
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
    const roleArg = process.argv[3]?.toUpperCase() || 'ADMIN';

    if (!phoneNumber) {
        console.error('Please provide a phone number. Usage: npx ts-node scripts/make-admin.ts <phone> [ADMIN|ORGANIZER]');
        console.error('Example: npx ts-node scripts/make-admin.ts +251912345678 ADMIN');
        process.exit(1);
    }

    if (roleArg !== 'ADMIN' && roleArg !== 'ORGANIZER') {
        console.error('Error: Role must be ADMIN or ORGANIZER');
        process.exit(1);
    }

    const user = await prisma.user.upsert({
        where: { phoneNumber },
        update: {
            role: roleArg as Role
        },
        create: {
            phoneNumber,
            role: roleArg as Role,
            profile: {
                create: {
                    fullName: roleArg === 'ADMIN' ? 'System ' + roleArg : 'Test ' + roleArg,
                    language: 'en'
                }
            }
        },
    });

    if (roleArg === 'ORGANIZER') {
        await prisma.organizerProfile.upsert({
            where: { userId: user.id },
            update: {
                status: OrganizerStatus.APPROVED
            },
            create: {
                userId: user.id,
                organizationName: 'Demo Organization',
                status: OrganizerStatus.APPROVED,
                contactEmail: 'demo@org.com',
                contactPhone: phoneNumber,
                address: '123 Demo St'
            }
        });
        console.log(`SUCCESS: User ${phoneNumber} is now an APPROVED ORGANIZER.`);
    } else {
        console.log(`SUCCESS: User ${phoneNumber} is now set as ADMIN.`);
    }

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
