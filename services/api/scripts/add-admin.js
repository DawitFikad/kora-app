const { PrismaClient, Role, AccountStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminPhone = '+251900000000';
    console.log(`Checking for admin user with phone: ${adminPhone}`);

    const admin = await prisma.user.upsert({
        where: { phoneNumber: adminPhone },
        update: {
            role: Role.ADMIN,
            status: AccountStatus.ACTIVE
        },
        create: {
            phoneNumber: adminPhone,
            role: Role.ADMIN,
            status: AccountStatus.ACTIVE,
            profile: {
                create: {
                    fullName: 'System Admin',
                }
            }
        }
    });

    console.log(`Admin user created/updated successfully: ID ${admin.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
