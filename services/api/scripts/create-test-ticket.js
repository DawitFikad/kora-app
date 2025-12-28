const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    // Find an event (preferably one with tiers)
    const event = await prisma.event.findFirst({
        include: { tiers: true }
    });

    if (!user) {
        console.log("❌ No users found in database.");
        return;
    }
    if (!event) {
        console.log("❌ No events found in database.");
        return;
    }
    if (event.tiers.length === 0) {
        console.log("❌ Event has no tiers, cannot create ticket.");
        return;
    }

    const tier = event.tiers[0];

    // Create Mock Purchase
    const quantity = 5;
    const purchase = await prisma.purchase.create({
        data: {
            userId: user.id,
            totalAmount: tier.price * quantity,
            paymentRef: "TEST-REF-" + crypto.randomUUID(),
            paymentMethod: 'TEST',
            status: 'SUCCESS',
            metadata: { eventId: event.id, tierId: tier.id, quantity }
        }
    });

    console.log("\n=================================");
    console.log("✅ GENERATED 5 TEST TICKETS (GROUP)");
    console.log("Event: " + event.title);
    console.log("---------------------------------");

    const secret = process.env.JWT_SECRET || "et-ticket-qr-secret";

    for (let i = 0; i < quantity; i++) {
        const ticketId = crypto.randomUUID();
        const payload = { tid: ticketId, eid: event.id, iat: Math.floor(Date.now() / 1000) };
        const qrPayload = jwt.sign(payload, secret);

        await prisma.ticket.create({
            data: {
                id: ticketId,
                qrPayload,
                status: 'VALID',
                userId: user.id,
                eventId: event.id,
                tierId: tier.id,
                purchaseId: purchase.id
            }
        });
        console.log(`Ticket #${i + 1}: ${ticketId}`);
    }
    console.log("=================================\n");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
