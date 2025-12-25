
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Users:");
    const users = await prisma.user.findMany({ include: { profile: true } });
    console.table(users.map(u => ({ id: u.id, phone: u.phoneNumber, name: u.profile?.fullName })));

    console.log("\nChecking Purchases:");
    const purchases = await prisma.purchase.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    console.table(purchases.map(p => ({ id: p.id, status: p.status, userId: p.userId, amount: p.totalAmount })));

    console.log("\nChecking Tickets:");
    const tickets = await prisma.ticket.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' }, take: 5 });
    console.table(tickets.map(t => ({ id: t.id, code: t.ticketCode, status: t.status, userId: t.userId, event: t.event.title })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
