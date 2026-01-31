import { Request, Response } from "express";
import { FinancialService } from "../services/financial.service";
import { prisma } from "../lib/prisma";
import { Prisma, FinancialStatus } from "@prisma/client";

export class FinancialController {
    /**
     * Admin: Financial Dashboard Overview
     */
    static async getAdminDashboard(req: Request, res: Response) {
        try {
            const metrics = await FinancialService.getFinancialMetrics();
            res.json({
                success: true,
                data: metrics
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

    // GMV grouped by date (simple aggregation)
    static async getGMV(req: Request, res: Response) {
        try {
            const { range = '30d' } = req.query as any;
            // For MVP: fetch purchases in range and aggregate by date
            const since = new Date();
            if (range === '30d') since.setDate(since.getDate() - 30);
            else if (range === '7d') since.setDate(since.getDate() - 7);
            else since.setMonth(since.getMonth() - 1);

            const purchases = await prisma.purchase.findMany({
                where: { status: 'SUCCESS', createdAt: { gte: since } },
                include: { tickets: { include: { event: { select: { city: true, organizerId: true, category: true, organizer: { select: { organizationName: true } } } } } } }
            });

            const map: Record<string, any> = {};
            purchases.forEach(p => {
                const d = p.createdAt.toISOString().slice(0, 10);
                const tickets = (p as any).tickets || [];
                const perTicket = tickets.length > 0 ? Number(p.totalAmount || 0) / tickets.length : Number(p.totalAmount || 0);
                if (tickets.length === 0) {
                    const key = `${d}||Unknown||Unknown||Uncategorized`;
                    if (!map[key]) map[key] = { date: d, city: 'Unknown', organizer: 'Unknown', category: 'Uncategorized', gmv: 0 };
                    map[key].gmv += Number(p.totalAmount || 0);
                } else {
                    tickets.forEach((t: any) => {
                        const rawCity = t.event?.city;
                        const city = typeof rawCity === 'string' ? rawCity : (rawCity?.name || rawCity?.city || 'Unknown');
                        const rawOrg = t.event?.organizer;
                        const organizer = rawOrg?.organizationName || rawOrg?.name || (typeof rawOrg === 'string' ? rawOrg : 'Unknown');
                        const rawCategory = t.event?.category;
                        const category = typeof rawCategory === 'string' ? rawCategory : (rawCategory?.name || rawCategory || 'Uncategorized');
                        const key = `${d}||${city}||${organizer}||${category}`;
                        if (!map[key]) map[key] = { date: d, city, organizer, category, gmv: 0 };
                        map[key].gmv += perTicket;
                    });
                }
            });

            const rows = Object.values(map);
            res.json({ success: true, data: rows });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getGMVByCity(req: Request, res: Response) {
        try {
            const since = new Date(); since.setMonth(since.getMonth() - 1);
            const purchases = await prisma.purchase.findMany({
                where: { status: 'SUCCESS', createdAt: { gte: since } },
                include: {
                    tickets: {
                        include: {
                            event: {
                                select: {
                                    city: true,
                                    organizerId: true,
                                    category: true,
                                    organizer: { select: { organizationName: true } }
                                }
                            }
                        }
                    }
                }
            });
            const agg: Record<string, { city: string; gmv: number }> = {};
            purchases.forEach(p => {
                const tickets = (p as any).tickets || [];
                if (tickets.length === 0) {
                    const city = 'Unknown';
                    agg[city] = agg[city] || { city, gmv: 0 };
                    agg[city].gmv += Number(p.totalAmount || 0);
                } else {
                    const perTicket = Number(p.totalAmount || 0) / tickets.length;
                    tickets.forEach((t: any) => {
                        const rawCity = t.event?.city;
                        const city = typeof rawCity === 'string' ? rawCity : (rawCity?.name || rawCity?.city || 'Unknown');
                        agg[city] = agg[city] || { city, gmv: 0 };
                        agg[city].gmv += perTicket;
                    });
                }
            });
            res.json({ success: true, data: Object.values(agg) });
        } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async getGMVByOrganizer(req: Request, res: Response) {
        try {
            const since = new Date(); since.setMonth(since.getMonth() - 1);
            const purchases = await prisma.purchase.findMany({
                where: { status: 'SUCCESS', createdAt: { gte: since } },
                include: {
                    tickets: {
                        include: {
                            event: {
                                select: {
                                    organizer: { select: { id: true, organizationName: true } },
                                    category: true,
                                    city: true
                                }
                            }
                        }
                    }
                }
            });
            const agg: Record<number, { organizer: string; gmv: number }> = {};
            purchases.forEach(p => {
                const tickets = (p as any).tickets || [];
                if (tickets.length === 0) {
                    agg[0] = agg[0] || { organizer: 'Unknown', gmv: 0 };
                    agg[0].gmv += Number(p.totalAmount || 0);
                } else {
                    const perTicket = Number(p.totalAmount || 0) / tickets.length;
                    tickets.forEach((t: any) => {
                        const rawOrg = t.event?.organizer;
                        const id = rawOrg?.id || rawOrg?.organizerId || 0;
                        const name = rawOrg?.organizationName || rawOrg?.name || (typeof rawOrg === 'string' ? rawOrg : 'Unknown');
                        agg[id] = agg[id] || { organizer: name, gmv: 0 };
                        agg[id].gmv += perTicket;
                    });
                }
            });
            res.json({ success: true, data: Object.values(agg) });
        } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async getPlatformRevenue(req: Request, res: Response) {
        try {
            const since = new Date(); since.setMonth(since.getMonth() - 1);
            const fees = await prisma.financialTransaction.findMany({ where: { createdAt: { gte: since } } });
            const summary: Record<string, number> = { commission: 0, convenience: 0, adjustments: 0 };
            fees.forEach(f => {
                if ((f as any).type === 'PLATFORM_FEE') summary.commission += Number(f.amount || 0);
                else if ((f as any).type === 'CONVENIENCE_FEE') summary.convenience += Number(f.amount || 0);
                else summary.adjustments += Number(f.amount || 0);
            });
            res.json({ success: true, data: { commissionTotal: summary.commission, convenienceTotal: summary.convenience, adjustmentsTotal: summary.adjustments } });
        } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async listPayouts(req: Request, res: Response) {
        try {
            const batches = await prisma.payoutBatch.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
            // Map into available/pending/paid for admin preview
            const available: any[] = [];
            const pending: any[] = [];
            const paid: any[] = [];
            batches.forEach(b => {
                if (b.status === FinancialStatus.PAID_OUT) paid.push(b);
                else if (b.status === FinancialStatus.INITIATED) pending.push(b);
                else available.push(b);
            });
            res.json({ success: true, data: { available, pending, paid } });
        } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async getSettlementLedger(req: Request, res: Response) {
        try {
            const rows = await prisma.financialTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
            const mapped = rows.map(r => {
                const meta = (r.metadata as any) || null;
                const notesRaw = meta?.notes ?? (meta && Object.keys(meta).length ? JSON.stringify(meta) : null);
                const notes = notesRaw ? notesRaw : '-';
                return { refId: r.id, timestamp: r.createdAt, type: r.type, amount: r.amount, notes };
            });
            res.json({ success: true, data: mapped });
        } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async exportLedgerCSV(req: Request, res: Response) {
        try {
            const rows = await prisma.financialTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
            const header = ['refId', 'timestamp', 'type', 'amount', 'notes'];
            const csvRows = rows.map(r => {
                const meta = (r.metadata as any) || null;
                const notesRaw = meta?.notes ?? (meta && Object.keys(meta).length ? JSON.stringify(meta) : null);
                const notes = notesRaw ? String(notesRaw) : '-';
                // Escape double quotes in notes
                const safeNotes = `"${String(notes).replace(/"/g, '""')}"`;
                return [r.id, r.createdAt.toISOString(), r.type, r.amount, safeNotes].join(',');
            });
            const csv = [header.join(',')].concat(csvRows).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="settlement_ledger.csv"');
            res.send(csv);
        } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
    }
}
