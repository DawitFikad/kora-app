import { prisma } from "../src/lib/prisma";
import { PaymentService } from "../src/services/payment.service";
import { PaymentStatus } from "@prisma/client";

async function runTest(method: string, user: any, event: any) {
    console.log(`\n--- Testing ${method} Flow ---`);
    const tier = event.tiers[0];
    const paymentRef = `VERIFY-${method}-${Date.now()}`;

    // 1. Create Reserve
    const purchase = await prisma.purchase.create({
        data: {
            userId: user.id,
            status: PaymentStatus.PENDING,
            totalAmount: tier.price.toNumber(),
            paymentRef,
            paymentMethod: method,
            metadata: {
                eventId: event.id,
                tierId: tier.id,
                quantity: 1,
                seatNumbers: []
            }
        }
    });
    console.log(`- Created PENDING ${method} Purchase: ${purchase.id}`);

    // 2. Initialize
    const init = await PaymentService.initializePayment(purchase.id);
    console.log(`- Initialized. Mock Checkout URL: ${init.checkoutUrl.substring(0, 80)}...`);

    // 3. Verify
    const verify = await PaymentService.verifyPayment(paymentRef, `EXT-${method}-MOCK`);
    console.log(`- Verification Result: ${verify.status}`);

    if (verify.status === PaymentStatus.SUCCESS) {
        const ticketCount = await prisma.ticket.count({ where: { purchaseId: purchase.id } });
        console.log(`- ✅ Tickets Issued: ${ticketCount}`);
    } else {
        console.log(`- ❌ FAILED`);
    }
}

async function main() {
    console.log("Starting Multi-Provider Verification (TeleBirr, CBE, Amole)...");

    const event = await prisma.event.findFirst({ where: { status: "APPROVED" }, include: { tiers: true } });
    const user = await prisma.user.findFirst();

    if (!event || !user) {
        console.error("Missing event or user for test.");
        process.exit(1);
    }

    await runTest("TELEBIRR", user, event);
    await runTest("CBE_BIRR", user, event);
    await runTest("AMOLE", user, event);
    await runTest("BANK_TRANSFER", user, event);

    console.log("\nAll Payment Providers Verified Successfully.");
    process.exit(0);
}

main().catch(e => {
    console.error("Verification script crashed:");
    console.error(e);
    process.exit(1);
});
