require("dotenv").config({ path: ".env" });

const {
  PrismaClient,
  Role,
  EventStatus,
  PaymentStatus,
  PayoutMethod,
  RiskLevel,
  FraudType,
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
  console.log(`Starting escrow settlement integration verification (runId=${runId})`);

  // Enforce strict trigger checks for this run.
  await prisma.systemConfig.upsert({
    where: { key: "financial.refund_window_hours" },
    update: { value: "0", description: "Test override for escrow settlement verification" },
    create: { key: "financial.refund_window_hours", value: "0", description: "Test override for escrow settlement verification" },
  });

  await prisma.systemConfig.upsert({
    where: { key: "financial.settlement.block_on_fraud" },
    update: { value: "true", description: "Keep fraud gate enabled" },
    create: { key: "financial.settlement.block_on_fraud", value: "true", description: "Keep fraud gate enabled" },
  });

  const customer = await prisma.user.create({
    data: {
      phoneNumber: `2519${String(runId).slice(-8)}`,
      role: Role.USER,
      status: "ACTIVE",
    },
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
      organizationName: `Escrow Test Org ${runId}`,
      contactPhone: organizerUser.phoneNumber,
      contactEmail: `escrow-org-${runId}@example.com`,
      city: "Addis Ababa",
      payoutDetails: "CBE:100000000001",
      status: "APPROVED",
    },
  });

  const city =
    (await prisma.city.findFirst({ where: { slug: "addis-ababa" } })) ||
    (await prisma.city.create({ data: { name: "Addis Ababa", slug: `addis-ababa-${runId}` } }));

  const mainCategory =
    (await prisma.mainCategory.findFirst({ where: { slug: "music" } })) ||
    (await prisma.mainCategory.create({ data: { name: "Music", slug: `music-${runId}` } }));

  const event = await prisma.event.create({
    data: {
      title: `Escrow Test Event ${runId}`,
      venue: "Millennium Hall",
      dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: EventStatus.APPROVED,
      organizerId: organizer.id,
      categoryId: mainCategory.id,
      cityId: city.id,
      feeType: "PERCENTAGE",
      feePercentage: 10,
      tiers: {
        create: {
          name: "Regular",
          price: 100,
          capacity: 100,
          maxPerUser: 5,
        },
      },
    },
    include: { tiers: true },
  });

  const priceBreakdown = {
    basePrice: 100,
    ticketPrice: 100,
    subtotal: 200,
    commission: 20,
    convenienceFee: 5,
    discount: 0,
    total: 225,
  };

  const purchase = await prisma.purchase.create({
    data: {
      userId: customer.id,
      totalAmount: 225,
      paymentRef: `ESCROW-${runId}`,
      paymentMethod: "CHAPA",
      status: PaymentStatus.SUCCESS,
      metadata: {
        eventId: event.id,
        tierId: event.tiers[0].id,
        quantity: 2,
        seatNumbers: [],
        priceBreakdown,
      },
    },
  });

  await FinancialService.recordTicketPurchase(purchase.id);

  const txs = await prisma.financialTransaction.findMany({
    where: { purchaseId: purchase.id },
    orderBy: { id: "asc" },
  });

  const purchaseTx = txs.find((t) => t.type === "TICKET_PURCHASE");
  const feeTx = txs.find((t) => t.type === "PLATFORM_FEE");

  assert(!!purchaseTx, "TICKET_PURCHASE transaction should exist");
  assert(!!feeTx, "PLATFORM_FEE transaction should exist");
  assert(purchaseTx.status === "CAPTURED", "TICKET_PURCHASE should be CAPTURED before release");
  assert(feeTx.status === "SETTLED", "PLATFORM_FEE should be SETTLED");

  let wallet = await prisma.organizerWallet.findUnique({ where: { organizerId: organizer.id } });
  assert(!!wallet, "Organizer wallet should exist");
  assert(Number(wallet.pendingBalance) === 180, "Pending balance should equal organizer net (180)");
  assert(Number(wallet.availableBalance) === 0, "Available balance should be 0 before settlement release");

  // Trigger check #1: event must be completed.
  const releaseBeforeCompletion = await FinancialService.releaseSettlementsForCompletedEvents(200);
  assert(releaseBeforeCompletion.processed === 0, "No settlement should release before event completion");

  await prisma.event.update({ where: { id: event.id }, data: { status: EventStatus.COMPLETED } });

  // Trigger check #3: fraud checks must pass.
  await prisma.fraudAlert.create({
    data: {
      type: FraudType.PAYMENT_FRAUD,
      riskLevel: RiskLevel.HIGH,
      message: `Blocking fraud alert ${runId}`,
      organizerId: organizer.id,
      eventId: event.id,
      isCleared: false,
    },
  });

  const blockedRelease = await FinancialService.releaseSettlementsForCompletedEvents(200);
  console.log("Blocked release result:", blockedRelease);
  const stillCapturedTx = await prisma.financialTransaction.findFirst({ where: { id: purchaseTx.id } });
  assert(stillCapturedTx.status === "CAPTURED", "Settlement should remain CAPTURED while fraud alert is unresolved");

  await prisma.fraudAlert.updateMany({
    where: { organizerId: organizer.id, isCleared: false },
    data: { isCleared: true, resolvedAt: new Date(), adminNote: "Cleared by integration test" },
  });

  const releaseAfterClear = await FinancialService.releaseSettlementsForCompletedEvents(200);
  assert(releaseAfterClear.processed >= 1, "Settlement should release after fraud is cleared");

  wallet = await prisma.organizerWallet.findUnique({ where: { organizerId: organizer.id } });
  assert(Number(wallet.pendingBalance) === 0, "Pending balance should be 0 after release");
  assert(Number(wallet.availableBalance) === 180, "Available balance should be 180 after release");

  const releasedTx = await prisma.financialTransaction.findFirst({ where: { id: purchaseTx.id } });
  assert(releasedTx.status === "RELEASED", "TICKET_PURCHASE should move to RELEASED after settlement");

  // Payout fraud gate verification.
  await prisma.fraudAlert.create({
    data: {
      type: FraudType.INSIDER_ABUSE,
      riskLevel: RiskLevel.CRITICAL,
      message: `Payout block alert ${runId}`,
      organizerId: organizer.id,
      isCleared: false,
    },
  });

  let payoutBlocked = false;
  try {
    await PayoutService.requestPayout(organizer.id, 50, PayoutMethod.BANK_TRANSFER, "CBE:100000000001");
  } catch (_e) {
    payoutBlocked = true;
  }
  assert(payoutBlocked, "Payout request should be blocked when blocking fraud alerts exist");

  await prisma.fraudAlert.updateMany({
    where: { organizerId: organizer.id, isCleared: false },
    data: { isCleared: true, resolvedAt: new Date(), adminNote: "Cleared for payout" },
  });

  const payout = await PayoutService.requestPayout(organizer.id, 50, PayoutMethod.BANK_TRANSFER, "CBE:100000000001");
  assert(!!payout, "Payout request should succeed after fraud clear");

  const admin = await prisma.user.create({
    data: {
      phoneNumber: `2518${String(runId).slice(-8)}`,
      role: Role.ADMIN,
      status: "ACTIVE",
    },
  });

  await PayoutService.approvePayout(payout.id, admin.id);

  wallet = await prisma.organizerWallet.findUnique({ where: { organizerId: organizer.id } });
  assert(Number(wallet.availableBalance) === 130, "Available balance should decrease after payout (180 -> 130)");
  assert(Number(wallet.totalWithdrawn) === 50, "Total withdrawn should increase by payout amount");

  console.log("PASS: Escrow capture, settlement triggers, and payout gates verified successfully.");
  console.log("Details:");
  console.log("- Event completion trigger enforced");
  console.log("- Refund window gate active (set to 0h for test)");
  console.log("- Fraud gate enforced for settlement and payout");
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
