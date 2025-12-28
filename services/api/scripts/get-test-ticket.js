const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ticket = await prisma.ticket.findFirst({
        where: { status: 'VALID' },
        include: { event: true, tier: true }
    });

    if (ticket) {
        console.log("\n=================================");
        console.log("🎟️ TEST TICKET FOUND");
        console.log("ID: " + ticket.id);
        console.log("Event: " + ticket.event.title);
        console.log("Tier: " + ticket.tier.name);
        console.log("=================================\n");
    } else {
        console.log("❌ No VALID tickets found. Please buy one first.");
    }
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
