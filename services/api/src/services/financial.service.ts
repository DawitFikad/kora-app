import { prisma } from "../lib/prisma";
import { FinancialStatus, TransactionType } from "@prisma/client";

export class FinancialService {
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

        const breakdown = metadata.priceBreakdown;
        const totalAmount = new Number(purchase.totalAmount).valueOf(); // Decimal to number
        const feeAmount = breakdown.commission + breakdown.convenienceFee;
        const netAmount = breakdown.subtotal - breakdown.commission;

        // 1. Create Financial Record
        await prisma.financialTransaction.create({
            data: {
                status: 'CAPTURED',
                type: 'TICKET_PURCHASE',
                amount: purchase.totalAmount, // Decimal compatible
                feeAmount: feeAmount,
                netAmount: netAmount,
                purchaseId: purchase.id,
                eventId: metadata.eventId
            }
        });

        // 2. Update Organizer Wallet
        const event = await prisma.event.findUnique({
            where: { id: metadata.eventId },
            select: { organizerId: true }
        });

        if (event) {
            const wallet = await prisma.organizerWallet.upsert({
                where: { organizerId: event.organizerId },
                create: {
                    organizerId: event.organizerId,
                    pendingBalance: netAmount,
                    availableBalance: 0,
                    totalWithdrawn: 0
                },
                update: {
                    pendingBalance: { increment: netAmount }
                }
            });

            // Optional: Add Ledger Entry (Simplified)
            await prisma.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: netAmount,
                    type: 'TICKET_PURCHASE',
                    description: `Ticket Sale #${purchase.id}`,
                    referenceId: `PUR-${purchase.id}`,
                    balanceBefore: wallet.pendingBalance.toNumber() - netAmount, // Approx
                    balanceAfter: wallet.pendingBalance.toNumber()
                }
            });
        }
    }
}
