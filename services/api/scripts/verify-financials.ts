import { prisma } from "../src/lib/prisma";
import { FinancialService } from "../src/services/financial.service";
import { PayoutService } from "../src/services/payout.service";
import { PaymentStatus, EventStatus, Role, PayoutMethod, Prisma } from "@prisma/client";

async function verifyFinancials() {
    console.log("🚀 Starting Financial Module Verification...");

    try {
        // 1. Setup Mock User & Organizer
        const user = await prisma.user.upsert({
            where: { phoneNumber: "251900000000" },
            update: {},
            create: { phoneNumber: "251900000000", role: Role.USER }
        });

        const organizerUser = await prisma.user.upsert({
            where: { phoneNumber: "251911111111" },
            update: {},
            create: { phoneNumber: "251911111111", role: Role.ORGANIZER }
        });

        const organizer = await prisma.organizerProfile.upsert({
            where: { userId: organizerUser.id },
            update: { status: "APPROVED" },
            create: {
                userId: organizerUser.id,
                organizationName: "Test Events Ltd",
                contactPhone: "251911111111",
                city: "Addis Ababa",
                payoutDetails: "CBE: 1000123456789",
                status: "APPROVED"
            }
        });

        // 2. Setup Mock Event with Fee Config
        const category = await prisma.category.findFirst() || await prisma.category.create({ data: { name: "Music", slug: "music" } });
        const city = await prisma.city.findFirst() || await prisma.city.create({ data: { name: "Addis Ababa", slug: "addis" } });

        const event = await (prisma.event as any).create({
            data: {
                title: "Financial Test Event",
                venue: "Millennium Hall",
                dateTime: new Date(Date.now() + 86400000),
                status: "APPROVED",
                organizerId: organizer.id,
                categoryId: category.id,
                cityId: city.id,
                feeType: "HYBRID",
                feeFixed: 10,
                feePercentage: 5,
                tiers: {
                    create: { name: "Regular", price: 100, capacity: 100 }
                }
            },
            include: { tiers: true }
        });

        console.log(`✅ Event created: ${event.title} (Fee: 10 ETB + 5%)`);

        // 3. Simulate Purchase
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                totalAmount: 200, // 2 tickets
                paymentRef: `TEST-REF-${Date.now()}`,
                paymentMethod: "CHAPA",
                status: PaymentStatus.SUCCESS,
                tickets: {
                    create: [
                        { qrPayload: `QR1-${Date.now()}`, eventId: event.id, tierId: event.tiers[0].id, userId: user.id },
                        { qrPayload: `QR2-${Date.now()}`, eventId: event.id, tierId: event.tiers[0].id, userId: user.id }
                    ]
                }
            }
        });

        console.log(`✅ Purchase created: ${purchase.paymentRef}, Amount: ${purchase.totalAmount} ETB`);

        // 4. Record Financial Transaction (triggers wallet pending balance)
        const transaction = await FinancialService.recordTicketPurchase(purchase.id);
        console.log(`✅ Transaction recorded: Net Amount: ${transaction.netAmount} ETB, Fee: ${transaction.feeAmount} ETB`);

        let wallet = await FinancialService.getOrganizerWallet(organizer.id);
        console.log(`💰 Organizer Wallet: Pending: ${wallet.pendingBalance}, Available: ${wallet.availableBalance}`);

        // 5. Complete Event & Release Funds
        await prisma.event.update({
            where: { id: event.id },
            data: { status: EventStatus.COMPLETED }
        });

        await FinancialService.releaseEventFunds(event.id);
        console.log("✅ Event COMPLETED and funds RELEASED.");

        wallet = await FinancialService.getOrganizerWallet(organizer.id);
        console.log(`💰 Organizer Wallet: Pending: ${wallet.pendingBalance}, Available: ${wallet.availableBalance}`);

        // 6. Request Payout
        const payout = await PayoutService.requestPayout(organizer.id, 100, PayoutMethod.BANK_TRANSFER, "CBE: 1000123456789");
        console.log(`✅ Payout REQUESTED: ${payout.amount} ETB`);

        // 7. Approve Payout
        const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } }) || await prisma.user.create({ data: { phoneNumber: "251922222222", role: Role.ADMIN } });
        await PayoutService.approvePayout(payout.id, admin.id);
        console.log("✅ Payout APPROVED by Admin.");

        wallet = await FinancialService.getOrganizerWallet(organizer.id);
        console.log(`💰 Organizer Wallet: Available: ${wallet.availableBalance}, Total Withdrawn: ${wallet.totalWithdrawn}`);

        console.log("\n✨ Verification Completed Successfully!");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFinancials();
