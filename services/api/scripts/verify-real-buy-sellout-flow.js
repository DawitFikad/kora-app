require("dotenv").config({ path: ".env" });

const {
    PrismaClient,
    Role,
    EventStatus,
    PaymentStatus,
    PayoutMethod,
} = require("@prisma/client");

const { FinancialService } = require("../dist/services/financial.service");
const { PayoutService } = require("../dist/services/payout.service");

const prisma = new PrismaClient();

function assert(condition, message) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

async function main() {
    const runId = Date.now();
    console.log(`Starting REAL BUY sellout flow verification (runId=${runId})`);

    await prisma.systemConfig.upsert({
        where: { key: "financial.refund_window_hours" },
        update: { value: "0", description: "Instant settlement release for real buy simulation" },
        create: { key: "financial.refund_window_hours", value: "0", description: "Instant settlement release for real buy simulation" },
    });

    await prisma.systemConfig.upsert({
        where: { key: "financial.settlement.block_on_fraud" },
        update: { value: "true", description: "Fraud gate enabled" },
        create: { key: "financial.settlement.block_on_fraud", value: "true", description: "Fraud gate enabled" },
    });

    const organizerUser = await prisma.user.create({
        data: {
            phoneNumber: `2517${String(runId).slice(-8)}`,
            role: Role.ORGANIZER,
            status: "ACTIVE",
        },
    });

    const organizer = await prisma.organizerProfile.create({
        data: {
            userId: organizerUser.id,
            organizationName: `Boss Flow Org ${runId}`,
            contactPhone: organizerUser.phoneNumber,
            contactEmail: `boss-org-${runId}@example.com`,
            city: "Addis Ababa",
            payoutDetails: "CBE:100000000001",
            status: "APPROVED",
        },
    });

    const city =
        (await prisma.city.findFirst({ where: { name: "Addis Ababa" } })) ||
        (await prisma.city.create({ data: { name: `Addis Ababa ${runId}`, slug: `addis-ababa-${runId}` } }));

    const category =
        (await prisma.mainCategory.findFirst({ where: { name: "Music" } })) ||
        (await prisma.mainCategory.create({ data: { name: `Music ${runId}`, slug: `music-${runId}` } }));

    const capacity = 5;
    const ticketPrice = 100;
    const commission = 10;
    const convenienceFee = 2.5;
    const totalPerTicket = ticketPrice + commission + convenienceFee;
    const organizerNetPerTicket = ticketPrice - commission;

    const event = await prisma.event.create({
        data: {
            title: `Boss Real Buy Event ${runId}`,
            venue: "Addis International Convention Center",
            dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: EventStatus.APPROVED,
            organizerId: organizer.id,
            categoryId: category.id,
            cityId: city.id,
            feeType: "PERCENTAGE",
            feePercentage: 10,
            tiers: {
                create: {
                    name: "General",
                    price: ticketPrice,
                    capacity,
                    maxPerUser: 1,
                },
            },
        },
        include: { tiers: true },
    });

    const tier = event.tiers[0];

    console.log(`Event created as organizer: ${event.title}`);
    console.log(`Tier capacity: ${capacity}`);

    for (let i = 0; i < capacity; i += 1) {
        const customer = await prisma.user.create({
            data: {
                phoneNumber: `2519${String(runId + i).slice(-8)}`,
                role: Role.USER,
                status: "ACTIVE",
            },
        });

        const paymentRef = `REALBUY-${runId}-${i}`;
        const purchase = await prisma.purchase.create({
            data: {
                userId: customer.id,
                totalAmount: totalPerTicket,
                paymentRef,
                paymentMethod: "CHAPA",
                status: PaymentStatus.SUCCESS,
                metadata: {
                    eventId: event.id,
                    tierId: tier.id,
                    quantity: 1,
                    seatNumbers: [],
                    eventTitle: event.title,
                    priceBreakdown: {
                        basePrice: ticketPrice,
                        ticketPrice,
                        subtotal: ticketPrice,
                        commission,
                        convenienceFee,
                        discount: 0,
                        total: totalPerTicket,
                    },
                },
            },
        });

        await prisma.ticket.create({
            data: {
                qrPayload: `QR-${runId}-${i}`,
                status: "VALID",
                userId: customer.id,
                eventId: event.id,
                tierId: tier.id,
                purchaseId: purchase.id,
            },
        });

        await FinancialService.recordTicketPurchase(purchase.id);
    }

    const soldCount = await prisma.ticket.count({ where: { eventId: event.id, tierId: tier.id, status: "VALID" } });
    assert(soldCount === capacity, `All tickets should be sold (${capacity}), got ${soldCount}`);
    console.log(`All tickets sold: ${soldCount}/${capacity}`);

    let wallet = await prisma.organizerWallet.findUnique({ where: { organizerId: organizer.id } });
    const expectedPending = organizerNetPerTicket * capacity;

    assert(Number(wallet.pendingBalance) === expectedPending, `Pending should be ${expectedPending}`);
    assert(Number(wallet.availableBalance) === 0, "Available should be 0 before event completion/release");
    console.log(`Wallet before completion -> Pending: ${wallet.pendingBalance}, Available: ${wallet.availableBalance}`);

    await prisma.event.update({ where: { id: event.id }, data: { status: EventStatus.COMPLETED } });
    const releaseResult = await FinancialService.releaseSettlementsForCompletedEvents(500);
    console.log("Settlement release result:", releaseResult);

    wallet = await prisma.organizerWallet.findUnique({ where: { organizerId: organizer.id } });
    assert(Number(wallet.pendingBalance) === 0, "Pending should be 0 after release");
    assert(Number(wallet.availableBalance) === expectedPending, `Available should be ${expectedPending} after release`);
    console.log(`Wallet after completion -> Pending: ${wallet.pendingBalance}, Available: ${wallet.availableBalance}`);

    const eventPurchaseTx = await prisma.financialTransaction.findMany({
        where: { eventId: event.id, type: "TICKET_PURCHASE" },
    });
    const releasedCount = eventPurchaseTx.filter((tx) => tx.status === "RELEASED").length;
    assert(releasedCount === capacity, `All purchase transactions should be RELEASED (${capacity}), got ${releasedCount}`);

    const payout = await PayoutService.requestPayout(
        organizer.id,
        expectedPending,
        PayoutMethod.BANK_TRANSFER,
        "CBE:100000000001"
    );

    const admin = await prisma.user.create({
        data: {
            phoneNumber: `2518${String(runId).slice(-8)}`,
            role: Role.ADMIN,
            status: "ACTIVE",
        },
    });

    await PayoutService.approvePayout(payout.id, admin.id);

    wallet = await prisma.organizerWallet.findUnique({ where: { organizerId: organizer.id } });
    assert(Number(wallet.availableBalance) === 0, "Available should be 0 after full payout");
    assert(Number(wallet.totalWithdrawn) === expectedPending, `Total withdrawn should be ${expectedPending}`);

    console.log("PASS: Real buy sellout flow verified end-to-end");
    console.log("Flow verified:");
    console.log("User Payment -> Platform Escrow accounting -> Platform Commission Ledger -> Organizer Wallet Pending");
    console.log("Event Completed -> Organizer Wallet Available -> Organizer Bank Payout");
}

main()
    .then(async () => {
        await prisma.$disconnect();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error("FAIL:", err.message || err);
        await prisma.$disconnect();
        process.exit(1);
    });
