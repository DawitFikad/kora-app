import { prisma } from "../src/lib/prisma";
import { TicketService } from "../src/services/ticket.service";
import { ValidationService } from "../src/services/validation.service";
import { PaymentStatus, TicketStatus } from "@prisma/client";

async function main() {
    console.log("Starting Production QR Validation Verification...");

    const event = await prisma.event.findFirst({ where: { status: "APPROVED" }, include: { tiers: true } });
    const user = await prisma.user.findFirst();

    if (!event || !user) {
        console.error("Missing event or user for test.");
        process.exit(1);
    }

    const tier = event.tiers[0];

    // 1. Issue a Fresh Ticket
    console.log("\n1. Issuing a fresh ticket...");
    const purchase = await prisma.purchase.create({
        data: {
            userId: user.id,
            status: PaymentStatus.SUCCESS,
            totalAmount: tier.price.toNumber(),
            paymentRef: `QR-PROD-TX-${Date.now()}`,
            paymentMethod: "TEST",
            metadata: {
                eventId: event.id,
                tierId: tier.id,
                quantity: 1,
                seatNumbers: []
            }
        }
    });

    await TicketService.completePurchase(purchase.id);
    const ticket = await prisma.ticket.findFirst({ where: { purchaseId: purchase.id } });

    if (!ticket) throw new Error("Ticket was not created");
    console.log(`- Ticket Issued: ${ticket.id}`);
    console.log(`- Ticket Status in DB: ${ticket.status}`);
    console.log(`- QR Payload (Signed JWT) length: ${ticket.qrPayload.length}`);

    // 2. Online Validation - Success
    console.log("\n2. Testing REAL-TIME (Online) Validation...");
    const scan1 = await ValidationService.validateOnline(ticket.qrPayload, "GATE-A1", "SCANNER-MOBILE-001");
    if (!scan1.success) {
        console.error(`- ❌ REJECTED: ${scan1.message}`);
        const currentTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
        console.log(`- Current status in DB: ${currentTicket?.status}`);
        process.exit(1);
    }
    console.log(`- First Scan Result: ✅ GRANTED`);

    // 3. Online Validation - Replay Attack (Duplicate)
    console.log("\n3. Testing REPLAY ATTACK (Scanning same ticket again)...");
    const scan2 = await ValidationService.validateOnline(ticket.qrPayload, "GATE-A1", "SCANNER-MOBILE-001");
    console.log(`- Second Scan Result: ${scan2.success ? "✅ GRANTED" : "❌ REJECTED"}`);
    console.log(`- Message: ${scan2.message}`);
    console.log(`- Fraud Detected: ${scan2.fraudDetected ? "🚩 YES" : "NO"}`);

    // 4. Offline Sync Simulation
    console.log("\n4. Testing OFFLINE SYNC RECONCILIATION...");
    // Issue another ticket for offline test
    const purchase2 = await prisma.purchase.create({
        data: {
            userId: user.id,
            status: PaymentStatus.SUCCESS,
            totalAmount: tier.price.toNumber(),
            paymentRef: `QR-OFFLINE-TX-${Date.now()}`,
            paymentMethod: "TEST",
            metadata: {
                eventId: event.id,
                tierId: tier.id,
                quantity: 1,
                seatNumbers: []
            }
        }
    });
    await TicketService.completePurchase(purchase2.id);
    const ticket2 = await prisma.ticket.findFirst({ where: { purchaseId: purchase2.id } });
    if (!ticket2) throw new Error("Ticket 2 failed");

    console.log(`- Created second ticket for offline test: ${ticket2.id}`);

    const syncLogs = [
        {
            qrPayload: ticket2.qrPayload,
            gateId: "OFFLINE-GATE",
            deviceId: "OFFLINE-DEV",
            deviceTime: new Date().toISOString()
        }
    ];

    const syncResult = await ValidationService.syncOfflineLogs(syncLogs);
    console.log(`- Sync Status for Ticket ${ticket2.id}: ${syncResult[0].status}`);

    // 5. Check Audit Logs
    console.log("\n5. Checking Audit Logs (ScanLog)...");
    const logs = await prisma.scanLog.findMany({
        where: { eventId: event.id },
        orderBy: { timestamp: 'desc' },
        take: 5
    });
    console.log(`- Found ${logs.length} logs for this event.`);
    logs.forEach(l => {
        console.log(`  [${l.mode}] ${l.status} - Ticket: ${l.ticketId.substring(0, 8)}... Reason: ${l.reason || "None"}`);
    });

    console.log("\nQR Validation Module Verified Successfully.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
