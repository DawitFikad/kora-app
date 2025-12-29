import { prisma } from "../lib/prisma";
import { FinancialStatus, TransactionType, PayoutMethod, Prisma } from "@prisma/client";
import axios from "axios";
import { env } from "../config/env";
import logger from "../utils/logger";
import crypto from "crypto";

export class PayoutService {
    /**
     * Organizer requests a payout.
     * Validates that the requested amount is available in their wallet.
     */
    static async requestPayout(organizerId: number, amount: number, method: PayoutMethod, details: string) {
        const payoutAmount = new Prisma.Decimal(amount);

        return await prisma.$transaction(async (tx) => {
            const wallet = await tx.organizerWallet.findUnique({
                where: { organizerId }
            });

            if (!wallet) throw new Error("Wallet not found for organizer");

            if (wallet.availableBalance.lessThan(payoutAmount)) {
                throw new Error("Insufficient available balance for payout");
            }

            // Create Payout Batch
            const batch = await tx.payoutBatch.create({
                data: {
                    status: FinancialStatus.INITIATED,
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
    static async approvePayout(batchId: number, adminId: number) {
        return await prisma.$transaction(async (tx) => {
            const batch = await tx.payoutBatch.findUnique({
                where: { id: batchId },
                include: { wallet: true }
            });

            if (!batch || batch.status !== FinancialStatus.INITIATED) {
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
                    status: FinancialStatus.PAID_OUT,
                    processedAt: new Date(),
                    adminId
                }
            });

            // 3. Trigger Real Payout (B2B/B2C)
            // If the payout method allows automatic transfer (e.g., TeleBirr), we execute it here.
            // For MANUAL, we just record it.

            if (batch.method === PayoutMethod.MOBILE_MONEY) {
                try {
                    // Example: TeleBirr B2C / B2B Transfer
                    const payload = {
                        appid: env.teleBirrMerchantAppId,
                        shortCode: env.teleBirrShortCode, // The Payer ShortCode
                        outTradeNo: `PAYOUT-${batch.id}`,
                        receiverShortCode: batch.payoutDetails, // Organizer's ShortCode/Phone
                        amount: batch.amount.toString(),
                        nonce: crypto.randomBytes(16).toString("hex"),
                        timestamp: Date.now().toString()
                    };

                    // In production: Sign payload with env.teleBirrPrivateKey
                    // const signed = sign(payload, env.teleBirrPrivateKey);

                    logger.info({ batchId, payload }, "Initiating TeleBirr B2B Payout");

                    // await axios.post('https://app.tty.ethio/ ... /b2c', payload); 

                    // If call fails, we should probably revert or mark as FAILED.
                    // For now, we assume admin has manually triggered or we log the "API" success.
                } catch (e: any) {
                    logger.error({ batchId, error: e.message }, "TeleBirr B2B Payout API Failed");
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
                    type: TransactionType.ORGANIZER_PAYOUT,
                    description: `Payout via ${batch.method}`,
                    referenceId: batch.id.toString(),
                    balanceBefore,
                    balanceAfter
                }
            });

            return batch;
        });
    }

    static async getOrganizerPayouts(organizerId: number) {
        return prisma.payoutBatch.findMany({
            where: {
                wallet: { organizerId }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async adminListPendingPayouts() {
        return prisma.payoutBatch.findMany({
            where: { status: FinancialStatus.INITIATED },
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

    static async rejectPayout(batchId: number, adminId: number, reason: string) {
        return prisma.payoutBatch.update({
            where: { id: batchId },
            data: {
                status: FinancialStatus.FAILED,
                processedAt: new Date(),
                adminId,
                payoutDetails: `REJECTED: ${reason}`
            }
        });
    }

    static async adminListProcessedPayouts() {
        return prisma.payoutBatch.findMany({
            where: {
                status: { in: [FinancialStatus.PAID_OUT, FinancialStatus.FAILED] }
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
