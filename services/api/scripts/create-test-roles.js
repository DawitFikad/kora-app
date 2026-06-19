
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRoles() {
    const roles = [
        { phone: "+251911111111", role: 'ADMIN', name: 'Admin User' },
        { phone: "+251922222222", role: 'ORGANIZER', name: 'Test Organizer' },
        { phone: "+251933333333", role: 'USER', name: 'Regular User' }
    ];

    for (const item of roles) {
        try {
            const user = await prisma.user.upsert({
                where: { phoneNumber: item.phone },
                update: { role: item.role, status: 'ACTIVE' },
                create: {
                    phoneNumber: item.phone,
                    role: item.role,
                    status: 'ACTIVE',
                    profile: {
                        create: {
                            fullName: item.name
                        }
                    }
                }
            });

            if (item.role === 'ORGANIZER') {
                await prisma.organizerProfile.upsert({
                    where: { userId: user.id },
                    update: { status: 'APPROVED' },
                    create: {
                        userId: user.id,
                        organizationName: item.name,
                        contactPhone: item.phone,
                        contactEmail: "test@organizer.com",
                        city: "Addis Ababa",
                        payoutDetails: "Telebirr: " + item.phone,
                        status: 'APPROVED'
                    }
                });
            }
            console.log(`✅ ${item.role} created with phone: ${item.phone}`);
        } catch (e) {
            console.error(`❌ Failed for ${item.role}:`, e.message);
        }
    }
    await prisma.$disconnect();
}

createRoles();
