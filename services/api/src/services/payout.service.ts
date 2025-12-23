import { prisma } from "../lib/prisma";
import { FinancialStatus, TransactionType, PayoutMethod, Prisma } from "@prisma/client";

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
}
