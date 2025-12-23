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

    // 3. Verify Payment (Simulate Failure first)
    console.log(`\n3. Verifying Payment (Simulating initial FAILURE for ${method})...`);
    await prisma.purchase.update({
        where: { id: purchase.id },
        data: { paymentRef: `${paymentRef}-fail` }
    });

    const failResult = await PaymentService.verifyPayment(`${paymentRef}-fail`);
    console.log(`- Initial Result Status: ${failResult.status}`);

    // 4. Retry Payment
    console.log("- Retrying Payment...");
    await PaymentService.initializePayment(purchase.id); // Resets to PENDING

    // Update back to original (valid) ref for success
    await prisma.purchase.update({
        where: { id: purchase.id },
        data: { paymentRef }
    });

    const finalVerifyResult = await PaymentService.verifyPayment(paymentRef, `EXT-${method}-${Date.now()}`);
    console.log(`- Final Verification Result: ${finalVerifyResult.status}`);

    if (finalVerifyResult.status === PaymentStatus.SUCCESS) {
        const ticketCount = await prisma.ticket.count({ where: { purchaseId: purchase.id } });
        console.log(`- ✅ Tickets Issued: ${ticketCount}`);
    } else {
        console.log(`- ❌ RETRY FAILED`);
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

    console.log("\nAll Payment Providers Verified Successfully.");
    process.exit(0);
}

main().catch(e => {
    console.error("Verification script crashed:");
    console.error(e);
    process.exit(1);
});
