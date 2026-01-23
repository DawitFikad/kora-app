const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCounts() {
    try {
        const users = await prisma.user.count();
        const events = await prisma.event.count();
        const organizers = await prisma.organizerProfile.count();
        const tickets = await prisma.ticket.count();
        const categories = await prisma.category.count();
        const cities = await prisma.city.count();

        console.log({
            users,
            events,
            organizers,
            tickets,
            categories,
            cities
        });
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
