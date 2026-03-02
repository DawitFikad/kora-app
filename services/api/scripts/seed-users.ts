
import { PrismaClient, Role, AccountStatus, OrganizerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Admin and Organizer users...');

    // 1. ADMIN USER
    const adminPhone = '+251910639875';
    const admin = await prisma.user.upsert({
        where: { phoneNumber: adminPhone },
        update: {
            role: Role.ADMIN,
            status: AccountStatus.ACTIVE,
        },
        create: {
            phoneNumber: adminPhone,
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
    console.log(`✅ Admin user created/updated: ${admin.phoneNumber}`);

    // 2. ORGANIZER USER
    const orgPhone = '+251922222222';
    const organizer = await prisma.user.upsert({
        where: { phoneNumber: orgPhone },
        update: {
            role: Role.ORGANIZER,
            status: AccountStatus.ACTIVE,
        },
        create: {
            phoneNumber: orgPhone,
            role: Role.ORGANIZER,
            status: AccountStatus.ACTIVE,
            profile: {
                create: {
                    fullName: 'Master Organizer',
                    language: 'en'
                }
            }
        },
        include: { organizer: true }
    });

    if (!organizer.organizer) {
        await prisma.organizerProfile.create({
            data: {
                userId: organizer.id,
                organizationName: 'Master Events Org',
                contactPhone: orgPhone,
                contactEmail: 'org@example.com',
                city: 'Addis Ababa',
                payoutDetails: 'Bank Account: 123456789',
                status: OrganizerStatus.ACTIVE,
                operatingCities: ['Addis Ababa'],
                categoryFocus: ['Music', 'Comedy']
            }
        });
        console.log(`✅ Organizer profile created for: ${organizer.phoneNumber}`);
    } else {
        await prisma.organizerProfile.update({
            where: { id: organizer.organizer.id },
            data: { status: OrganizerStatus.ACTIVE }
        });
        console.log(`✅ Organizer profile status updated to ACTIVE for: ${organizer.phoneNumber}`);
    }

    console.log('🎉 Done seeding users!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding users:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
