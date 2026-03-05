"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
class PayoutService {
    /**
     * Organizer requests a payout.
     * Validates that the requested amount is available in their wallet.
     */
    static async requestPayout(organizerId, amount, method, details) {
        const payoutAmount = new client_1.Prisma.Decimal(amount);
        return await prisma_1.prisma.$transaction(async (tx) => {
            const wallet = await tx.organizerWallet.findUnique({
                where: { organizerId }
            });
            if (!wallet)
                throw new Error("Wallet not found for organizer");
            if (wallet.availableBalance.lessThan(payoutAmount)) {
                throw new Error("Insufficient available balance for payout");
            }
            // Create Payout Batch
            const batch = await tx.payoutBatch.create({
                data: {
                    status: client_1.FinancialStatus.INITIATED,
                    amount: payoutAmount,
                    method,
                    payoutDetails: details,
                    walletId: wallet.id
                }
            });
            // Note: We don't deduct from availableBalance yet. 
            // We'll do it on approval, or we could "lock" it by moving to a 'payoutLock' field.
            // For now, simple implementation: deduct on approval.
            return batch;
        });
    }
    /**
     * Admin approves and processes a payout.
     * Deducts funds from wallet and records ledger entry.
     */
    static async approvePayout(batchId, adminId) {
        return await prisma_1.prisma.$transaction(async (tx) => {
            const batch = await tx.payoutBatch.findUnique({
                where: { id: batchId },
                include: { wallet: true }
            });
            if (!batch || batch.status !== client_1.FinancialStatus.INITIATED) {
                throw new Error("Payout batch not found or already processed");
            }
            const wallet = batch.wallet;
            if (wallet.availableBalance.lessThan(batch.amount)) {
                throw new Error("Insufficient funds in wallet at time of approval");
            }
            const balanceBefore = wallet.availableBalance;
            const balanceAfter = balanceBefore.minus(batch.amount);
            const totalWithdrawnAfter = wallet.totalWithdrawn.add(batch.amount);
            // 1. Update Wallet
            await tx.organizerWallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: balanceAfter,
                    totalWithdrawn: totalWithdrawnAfter
                }
            });
            // 2. Update Batch Status
            await tx.payoutBatch.update({
                where: { id: batchId },
                data: {
                    status: client_1.FinancialStatus.PAID_OUT,
                    processedAt: new Date(),
                    adminId
                }
            });
            // 3. Trigger Real Payout (B2B/B2C)
            // If the payout method allows automatic transfer (e.g., TeleBirr), we execute it here.
            // For MANUAL, we just record it.
            if (batch.method === client_1.PayoutMethod.MOBILE_MONEY) {
                try {
                    // Example: TeleBirr B2C / B2B Transfer
                    const payload = {
                        appid: env_1.env.teleBirrMerchantAppId,
                        shortCode: env_1.env.teleBirrShortCode, // The Payer ShortCode
                        outTradeNo: `PAYOUT-${batch.id}`,
                        receiverShortCode: batch.payoutDetails, // Organizer's ShortCode/Phone
                        amount: batch.amount.toString(),
                        nonce: crypto_1.default.randomBytes(16).toString("hex"),
                        timestamp: Date.now().toString()
                    };
                    // In production: Sign payload with env.teleBirrPrivateKey
                    // const signed = sign(payload, env.teleBirrPrivateKey);
                    logger_1.default.info({ batchId, payload }, "Initiating TeleBirr B2B Payout");
                    // await axios.post('https://app.tty.ethio/ ... /b2c', payload); 
                    // If call fails, we should probably revert or mark as FAILED.
                    // For now, we assume admin has manually triggered or we log the "API" success.
                }
                catch (e) {
                    logger_1.default.error({ batchId, error: e.message }, "TeleBirr B2B Payout API Failed");
                    // Important: Decide if transaction should rollback. 
                    // Throwing here rolls back the Prisma transaction.
                    throw new Error(`TeleBirr Payout Failed: ${e.message}`);
                }
            }
            // 3. Create Ledger Entry
            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: batch.amount.neg(),
                    type: client_1.TransactionType.ORGANIZER_PAYOUT,
                    description: `Payout via ${batch.method}`,
                    referenceId: batch.id.toString(),
                    balanceBefore,
                    balanceAfter
                }
            });
            // 4. Send Notification (Async)
            (async () => {
                try {
                    const { NotificationService } = require("./notification.service");
                    const { NotificationChannel } = require("@prisma/client");
                    await NotificationService.notifyOrganizer(wallet.organizerId, {
                        title: "Payout Approved 💰",
                        content: `Your payout of ETB ${batch.amount} has been processed via ${batch.method}.`,
                        channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                        metadata: { type: 'PAYOUT_SUCCESS', amount: batch.amount, batchId: batch.id }
                    });
                }
                catch (e) {
                    console.error("Failed to notify organizer of payout:", e);
                }
            })();
            return batch;
        });
    }
    static async getOrganizerPayouts(organizerId) {
        return prisma_1.prisma.payoutBatch.findMany({
            where: {
                wallet: { organizerId }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async adminListPendingPayouts() {
        return prisma_1.prisma.payoutBatch.findMany({
            where: { status: client_1.FinancialStatus.INITIATED },
            include: {
                wallet: {
                    include: {
                        organizer: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    static async rejectPayout(batchId, adminId, reason) {
        const batch = await prisma_1.prisma.payoutBatch.update({
            where: { id: batchId },
            data: {
                status: client_1.FinancialStatus.FAILED,
                processedAt: new Date(),
                adminId,
                payoutDetails: `REJECTED: ${reason}`
            },
            include: { wallet: true }
        });
        // Notify Organizer (Async)
        (async () => {
            try {
                const { NotificationService } = require("./notification.service");
                const { NotificationChannel } = require("@prisma/client");
                await NotificationService.notifyOrganizer(batch.wallet.organizerId, {
                    title: "Payout Rejected ❌",
                    content: `Your payout request of ETB ${batch.amount} was rejected. Reason: ${reason}`,
                    channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                    metadata: { type: 'PAYOUT_FAILED', reason, batchId: batch.id }
                });
            }
            catch (e) {
                console.error("Failed to notify organizer of payout rejection:", e);
            }
        })();
        return batch;
    }
    static async adminListProcessedPayouts() {
        return prisma_1.prisma.payoutBatch.findMany({
            where: {
                status: { in: [client_1.FinancialStatus.PAID_OUT, client_1.FinancialStatus.FAILED] }
            },
            include: {
                wallet: {
                    include: {
                        organizer: true
                    }
                }
            },
            orderBy: { processedAt: 'desc' },
            take: 50
        });
    }
}
exports.PayoutService = PayoutService;
