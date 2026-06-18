
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeOrganizer() {
    const phoneNumber = "+251954948027";
    try {
        const user = await prisma.user.update({
            where: { phoneNumber },
            data: {
                role: 'ORGANIZER',
                status: 'ACTIVE'
            }
        });

        await prisma.organizerProfile.upsert({
            where: { userId: user.id },
            update: {
                organizationName: "Main Organizer",
                status: 'APPROVED'
            },
            create: {
                userId: user.id,
                organizationName: "Main Organizer",
                contactPhone: phoneNumber,
                contactEmail: "organizer@et-ticket.com",
                city: "Addis Ababa",
                payoutDetails: "Telebirr: 0954948027",
                status: 'APPROVED'
            }
        });

        console.log(`✅ User ${phoneNumber} is now an APPROVED ORGANIZER`);
    } catch (error) {
        console.error("❌ Failed to promote user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

makeOrganizer();
