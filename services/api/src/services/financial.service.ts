import { prisma } from "../lib/prisma";
import { FinancialStatus, RiskLevel, TransactionType } from "@prisma/client";
import { SystemConfigService } from "./system-config.service";

export class FinancialService {
    private static round2(value: number): number {
        return Math.round(value * 100) / 100;
    }

    static async getRecentTransactions() {
        return prisma.financialTransaction.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                purchase: true,
                event: {
                    include: {
                        organizer: { select: { organizationName: true } }
                    }
                }
            }
        });
    }

    static async getFinancialMetrics() {
        const totalCommission = await prisma.financialTransaction.aggregate({
            where: { type: TransactionType.PLATFORM_FEE, status: FinancialStatus.SETTLED },
            _sum: { amount: true }
        });

        const pendingPayouts = await prisma.payoutBatch.aggregate({
            where: { status: FinancialStatus.INITIATED },
            _sum: { amount: true },
            _count: { _all: true }
        });

        const monthlyGMV = await prisma.purchase.aggregate({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            },
            _sum: { totalAmount: true }
        });

        return {
            platformCommission: totalCommission._sum.amount?.toNumber() || 0,
            pendingPayouts: {
                amount: pendingPayouts._sum.amount?.toNumber() || 0,
                count: pendingPayouts._count._all
            },
            monthlyGMV: monthlyGMV._sum.totalAmount?.toNumber() || 0
        };
    }

    static async getOrganizerWallet(organizerId: number) {
        return prisma.organizerWallet.findUnique({
            where: { organizerId },
            include: {
                ledgerEntries: {
                    take: 20,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    static async recordTicketPurchase(purchaseId: number) {
        const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
        if (!purchase) throw new Error("Purchase not found");

        const metadata = purchase.metadata as any;
        if (!metadata || !metadata.eventId || !metadata.priceBreakdown) {
            // Fallback if metadata missing (e.g. old data)
            return;
        }

        // Idempotency guard: if this purchase was already posted, skip.
        const existingMainTx = await prisma.financialTransaction.findFirst({
            where: {
                purchaseId: purchase.id,
                type: TransactionType.TICKET_PURCHASE,
            },
            select: { id: true },
        });
        if (existingMainTx) return;

        const breakdown = metadata.priceBreakdown;
        const event = await prisma.event.findUnique({
            where: { id: metadata.eventId },
            select: { organizerId: true }
        });

        if (!event) return;

        const subtotal = Number(breakdown.subtotal || 0);
        const commission = Number(breakdown.commission || 0);
        const convenienceFee = Number(breakdown.convenienceFee || 0);
        const discount = Number(breakdown.discount || 0);
        const totalCaptured = Number(purchase.totalAmount);

        // Escrow-first split:
        // - platformFee is recognized at platform level
        // - organizerNet becomes platform liability and is credited to organizer pending wallet
        const platformFee = this.round2(commission + convenienceFee);
        const organizerNet = this.round2(
            Number.isFinite(Number(breakdown.organizerEarnings))
                ? Number(breakdown.organizerEarnings)
                : (subtotal - commission - convenienceFee - discount)
        );
        const feeAmount = this.round2(platformFee);

        if (organizerNet < 0) {
            throw new Error("Calculated organizer net amount cannot be negative");
        }

        await prisma.$transaction(async (tx) => {
            await tx.financialTransaction.create({
                data: {
                    status: FinancialStatus.CAPTURED,
                    type: TransactionType.TICKET_PURCHASE,
                    amount: totalCaptured,
                    feeAmount,
                    netAmount: organizerNet,
                    purchaseId: purchase.id,
                    eventId: metadata.eventId,
                    metadata: {
                        escrowFlow: {
                            stage: "CAPTURED_TO_ESCROW",
                            platformFee,
                            organizerLiability: organizerNet,
                        },
                        priceBreakdown: breakdown,
                    },
                }
            });

            if (platformFee > 0) {
                await tx.financialTransaction.create({
                    data: {
                        status: FinancialStatus.SETTLED,
                        type: TransactionType.PLATFORM_FEE,
                        amount: platformFee,
                        feeAmount: 0,
                        netAmount: platformFee,
                        purchaseId: purchase.id,
                        eventId: metadata.eventId,
                        metadata: {
                            escrowFlow: {
                                stage: "PLATFORM_COMMISSION_RECOGNIZED",
                                commission,
                                convenienceFee,
                            },
                        },
                    },
                });
            }

            const existingWallet = await tx.organizerWallet.findUnique({
                where: { organizerId: event.organizerId },
                select: { id: true, pendingBalance: true },
            });

            let walletId: number;
            let balanceBefore = 0;
            let balanceAfter = organizerNet;

            if (!existingWallet) {
                const createdWallet = await tx.organizerWallet.create({
                    data: {
                        organizerId: event.organizerId,
                        pendingBalance: organizerNet,
                        availableBalance: 0,
                        totalWithdrawn: 0,
                    },
                });
                walletId = createdWallet.id;
            } else {
                balanceBefore = Number(existingWallet.pendingBalance);
                balanceAfter = this.round2(balanceBefore + organizerNet);

                await tx.organizerWallet.update({
                    where: { id: existingWallet.id },
                    data: {
                        pendingBalance: { increment: organizerNet },
                    }
                });
                walletId = existingWallet.id;
            }

            await tx.walletLedger.create({
                data: {
                    walletId,
                    amount: organizerNet,
                    type: TransactionType.TICKET_PURCHASE,
                    description: `Escrow release pending credit for purchase #${purchase.id}`,
                    referenceId: `PUR-${purchase.id}`,
                    balanceBefore,
                    balanceAfter,
                }
            });
        });
    }

    /**
     * Releases organizer funds from pending -> available once the linked event is completed.
     * This enforces escrow-first settlement and prevents direct instant organizer access.
     */
    static async releaseSettlementsForCompletedEvents(limit = 200) {
        const now = new Date();
        const refundWindowHours = await SystemConfigService.getNumber("financial.refund_window_hours", 48);
        const blockOnFraud = await SystemConfigService.getBoolean("financial.settlement.block_on_fraud", true);

        const candidates = await prisma.financialTransaction.findMany({
            where: {
                type: TransactionType.TICKET_PURCHASE,
                status: FinancialStatus.CAPTURED,
                event: {
                    status: "COMPLETED"
                },
                purchase: {
                    status: "SUCCESS"
                }
            },
            take: Math.max(1, Math.min(limit, 1000)),
            orderBy: { createdAt: "asc" },
            include: {
                event: {
                    select: {
                        id: true,
                        organizerId: true,
                        title: true,
                        dateTime: true,
                    }
                }
            }
        });

        let processed = 0;
        let releasedAmount = 0;
        let skipped = 0;
        let blockedByRefundWindow = 0;
        let blockedByFraudChecks = 0;

        for (const txn of candidates) {
            const event = txn.event;
            if (!event) {
                skipped += 1;
                continue;
            }

            const organizerId = txn.event?.organizerId;
            if (!organizerId) {
                skipped += 1;
                continue;
            }

            // Trigger 1: refund window must be closed before release.
            const eventTime = new Date(event.dateTime);
            const releaseAt = new Date(eventTime.getTime() + Math.max(0, refundWindowHours) * 60 * 60 * 1000);
            if (now < releaseAt) {
                blockedByRefundWindow += 1;
                skipped += 1;
                continue;
            }

            // Trigger 2: fraud checks must pass before release.
            if (blockOnFraud) {
                const unresolvedFraudCount = await prisma.fraudAlert.count({
                    where: {
                        isCleared: false,
                        riskLevel: {
                            in: [RiskLevel.HIGH, RiskLevel.CRITICAL],
                        },
                        OR: [
                            { eventId: event.id },
                            { organizerId },
                        ],
                    },
                });

                if (unresolvedFraudCount > 0) {
                    blockedByFraudChecks += 1;
                    skipped += 1;
                    continue;
                }
            }

            const net = Number(txn.netAmount || 0);
            if (net <= 0) {
                skipped += 1;
                continue;
            }

            const didRelease = await prisma.$transaction(async (tx) => {
                const current = await tx.financialTransaction.findUnique({
                    where: { id: txn.id },
                    select: { status: true, metadata: true },
                });

                if (!current || current.status !== FinancialStatus.CAPTURED) {
                    return false;
                }

                const wallet = await tx.organizerWallet.findUnique({
                    where: { organizerId },
                    select: { id: true, pendingBalance: true, availableBalance: true },
                });

                if (!wallet) {
                    return false;
                }

                const pendingBefore = Number(wallet.pendingBalance);
                const availableBefore = Number(wallet.availableBalance);

                if (pendingBefore < net) {
                    return false;
                }

                const pendingAfter = this.round2(pendingBefore - net);
                const availableAfter = this.round2(availableBefore + net);

                await tx.organizerWallet.update({
                    where: { id: wallet.id },
                    data: {
                        pendingBalance: { decrement: net },
                        availableBalance: { increment: net },
                    },
                });

                await tx.walletLedger.create({
                    data: {
                        walletId: wallet.id,
                        amount: net,
                        type: TransactionType.ADJUSTMENT,
                        description: `Settlement release for completed event ${txn.event?.title || ""}`.trim(),
                        referenceId: `SETTLE-${txn.id}`,
                        balanceBefore: availableBefore,
                        balanceAfter: availableAfter,
                    },
                });

                const existingMeta = (current.metadata as any) || {};
                await tx.financialTransaction.update({
                    where: { id: txn.id },
                    data: {
                        status: FinancialStatus.RELEASED,
                        metadata: {
                            ...existingMeta,
                            settlement: {
                                releasedAt: new Date().toISOString(),
                                releasedAmount: net,
                                policy: {
                                    refundWindowHours,
                                    blockOnFraud,
                                },
                                pendingBefore,
                                pendingAfter,
                                availableBefore,
                                availableAfter,
                            },
                        },
                    },
                });

                return true;
            });

            if (didRelease) {
                processed += 1;
                releasedAmount = this.round2(releasedAmount + net);
            } else {
                skipped += 1;
            }
        }

        return {
            policy: {
                refundWindowHours,
                blockOnFraud,
            },
            candidates: candidates.length,
            processed,
            skipped,
            blockedByRefundWindow,
            blockedByFraudChecks,
            releasedAmount,
        };
    }
}
