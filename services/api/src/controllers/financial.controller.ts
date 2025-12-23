import { Request, Response } from "express";
import { FinancialService } from "../services/financial.service";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class FinancialController {
    /**
     * Admin: Financial Dashboard Overview
     */
    static async getAdminDashboard(req: Request, res: Response) {
        try {
            // GMV (Total Sales)
            const gmv = await prisma.financialTransaction.aggregate({
                where: { type: "TICKET_PURCHASE", status: { in: ["SETTLED", "RELEASED", "PAID_OUT"] } },
                _sum: { amount: true }
            });

            // Platform Revenue (Total Fees)
            const revenue = await prisma.financialTransaction.aggregate({
                where: { type: "TICKET_PURCHASE", status: { in: ["SETTLED", "RELEASED", "PAID_OUT"] } },
                _sum: { feeAmount: true }
            });

            // Organizer Liabilities (Pending + Available in wallets)
            const liabilities = await prisma.organizerWallet.aggregate({
                _sum: { pendingBalance: true, availableBalance: true }
            });

            // Payout Statistics
            const payouts = await prisma.payoutBatch.aggregate({
                where: { status: "PAID_OUT" },
                _sum: { amount: true }
            });

            res.json({
                success: true,
                data: {
                    totalGMV: gmv._sum.amount || 0,
                    platformRevenue: revenue._sum.feeAmount || 0,
                    totalLiabilities: (liabilities._sum.pendingBalance || new Prisma.Decimal(0)).add(liabilities._sum.availableBalance || new Prisma.Decimal(0)),
                    totalPaidOut: payouts._sum.amount || 0
                }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Organizer: Wallet Overview
     */
    static async getOrganizerWallet(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Organizer profile not found" });

            const wallet = await FinancialService.getOrganizerWallet(organizerId);
            res.json({ success: true, data: wallet });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Admin: List Financial Transactions
     */
    static async listTransactions(req: Request, res: Response) {
        try {
            const transactions = await prisma.financialTransaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
                include: {
                    purchase: {
                        select: { paymentMethod: true, user: { select: { phoneNumber: true } } }
                    },
                    event: {
                        select: { title: true }
                    }
                }
            });
            res.json({ success: true, data: transactions });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
