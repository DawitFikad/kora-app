"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class FinancialService {
    static async getRecentTransactions() {
        return prisma_1.prisma.financialTransaction.findMany({
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
        const totalCommission = await prisma_1.prisma.financialTransaction.aggregate({
            where: { type: client_1.TransactionType.PLATFORM_FEE, status: client_1.FinancialStatus.SETTLED },
            _sum: { amount: true }
        });
        const pendingPayouts = await prisma_1.prisma.payoutBatch.aggregate({
            where: { status: client_1.FinancialStatus.INITIATED },
            _sum: { amount: true },
            _count: { _all: true }
        });
        const monthlyGMV = await prisma_1.prisma.purchase.aggregate({
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
    static async getOrganizerWallet(organizerId) {
        return prisma_1.prisma.organizerWallet.findUnique({
            where: { organizerId },
            include: {
                ledgerEntries: {
                    take: 20,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    static async recordTicketPurchase(purchaseId) {
        const purchase = await prisma_1.prisma.purchase.findUnique({ where: { id: purchaseId } });
        if (!purchase)
            throw new Error("Purchase not found");
        const metadata = purchase.metadata;
        if (!metadata || !metadata.eventId || !metadata.priceBreakdown) {
            // Fallback if metadata missing (e.g. old data)
            return;
        }
        const breakdown = metadata.priceBreakdown;
        const totalAmount = new Number(purchase.totalAmount).valueOf(); // Decimal to number
        const feeAmount = breakdown.commission + breakdown.convenienceFee;
        const netAmount = breakdown.subtotal - breakdown.commission;
        // 1. Create Financial Record
        await prisma_1.prisma.financialTransaction.create({
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
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: metadata.eventId },
            select: { organizerId: true }
        });
        if (event) {
            const wallet = await prisma_1.prisma.organizerWallet.upsert({
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
            await prisma_1.prisma.walletLedger.create({
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
exports.FinancialService = FinancialService;
