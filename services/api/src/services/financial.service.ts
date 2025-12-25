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
}
