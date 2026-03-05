"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialController = void 0;
const financial_service_1 = require("../services/financial.service");
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class FinancialController {
    /**
     * Admin: Financial Dashboard Overview
     */
    static async getAdminDashboard(req, res) {
        try {
            const metrics = await financial_service_1.FinancialService.getFinancialMetrics();
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Organizer: Wallet Overview
     */
    static async getOrganizerWallet(req, res) {
        try {
            const organizerId = req.user.organizerId;
            if (!organizerId)
                return res.status(403).json({ success: false, message: "Organizer profile not found" });
            const wallet = await financial_service_1.FinancialService.getOrganizerWallet(organizerId);
            res.json({ success: true, data: wallet });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: List Financial Transactions
     */
    static async listTransactions(req, res) {
        try {
            const transactions = await prisma_1.prisma.financialTransaction.findMany({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // GMV grouped by date (simple aggregation)
    static async getGMV(req, res) {
        try {
            const { range = '30d' } = req.query;
            // For MVP: fetch purchases in range and aggregate by date
            const since = new Date();
            if (range === '30d')
                since.setDate(since.getDate() - 30);
            else if (range === '7d')
                since.setDate(since.getDate() - 7);
            else
                since.setMonth(since.getMonth() - 1);
            const purchases = await prisma_1.prisma.purchase.findMany({
                where: { status: 'SUCCESS', createdAt: { gte: since } },
                include: { tickets: { include: { event: { select: { city: true, organizerId: true, category: true, organizer: { select: { organizationName: true } } } } } } }
            });
            const map = {};
            purchases.forEach(p => {
                const d = p.createdAt.toISOString().slice(0, 10);
                const tickets = p.tickets || [];
                const perTicket = tickets.length > 0 ? Number(p.totalAmount || 0) / tickets.length : Number(p.totalAmount || 0);
                if (tickets.length === 0) {
                    const key = `${d}||Unknown||Unknown||Uncategorized`;
                    if (!map[key])
                        map[key] = { date: d, city: 'Unknown', organizer: 'Unknown', category: 'Uncategorized', gmv: 0 };
                    map[key].gmv += Number(p.totalAmount || 0);
                }
                else {
                    tickets.forEach((t) => {
                        const rawCity = t.event?.city;
                        const city = typeof rawCity === 'string' ? rawCity : (rawCity?.name || rawCity?.city || 'Unknown');
                        const rawOrg = t.event?.organizer;
                        const organizer = rawOrg?.organizationName || rawOrg?.name || (typeof rawOrg === 'string' ? rawOrg : 'Unknown');
                        const rawCategory = t.event?.category;
                        const category = typeof rawCategory === 'string' ? rawCategory : (rawCategory?.name || rawCategory || 'Uncategorized');
                        const key = `${d}||${city}||${organizer}||${category}`;
                        if (!map[key])
                            map[key] = { date: d, city, organizer, category, gmv: 0 };
                        map[key].gmv += perTicket;
                    });
                }
            });
            const rows = Object.values(map);
            res.json({ success: true, data: rows });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getGMVByCity(req, res) {
        try {
            const since = new Date();
            since.setMonth(since.getMonth() - 1);
            const purchases = await prisma_1.prisma.purchase.findMany({
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
            const agg = {};
            purchases.forEach(p => {
                const tickets = p.tickets || [];
                if (tickets.length === 0) {
                    const city = 'Unknown';
                    agg[city] = agg[city] || { city, gmv: 0 };
                    agg[city].gmv += Number(p.totalAmount || 0);
                }
                else {
                    const perTicket = Number(p.totalAmount || 0) / tickets.length;
                    tickets.forEach((t) => {
                        const rawCity = t.event?.city;
                        const city = typeof rawCity === 'string' ? rawCity : (rawCity?.name || rawCity?.city || 'Unknown');
                        agg[city] = agg[city] || { city, gmv: 0 };
                        agg[city].gmv += perTicket;
                    });
                }
            });
            res.json({ success: true, data: Object.values(agg) });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getGMVByOrganizer(req, res) {
        try {
            const since = new Date();
            since.setMonth(since.getMonth() - 1);
            const purchases = await prisma_1.prisma.purchase.findMany({
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
            const agg = {};
            purchases.forEach(p => {
                const tickets = p.tickets || [];
                if (tickets.length === 0) {
                    agg[0] = agg[0] || { organizer: 'Unknown', gmv: 0 };
                    agg[0].gmv += Number(p.totalAmount || 0);
                }
                else {
                    const perTicket = Number(p.totalAmount || 0) / tickets.length;
                    tickets.forEach((t) => {
                        const rawOrg = t.event?.organizer;
                        const id = rawOrg?.id || rawOrg?.organizerId || 0;
                        const name = rawOrg?.organizationName || rawOrg?.name || (typeof rawOrg === 'string' ? rawOrg : 'Unknown');
                        agg[id] = agg[id] || { organizer: name, gmv: 0 };
                        agg[id].gmv += perTicket;
                    });
                }
            });
            res.json({ success: true, data: Object.values(agg) });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPlatformRevenue(req, res) {
        try {
            const { range = '30d' } = req.query;
            const since = new Date();
            if (range === '7d')
                since.setDate(since.getDate() - 7);
            else if (range === '90d')
                since.setDate(since.getDate() - 90);
            else
                since.setDate(since.getDate() - 30);
            const transactions = await prisma_1.prisma.financialTransaction.findMany({
                where: { createdAt: { gte: since } }
            });
            const summary = { commission: 0, convenience: 0, adjustments: 0 };
            transactions.forEach(t => {
                if (t.type === 'TICKET_PURCHASE') {
                    // Try to parse metadata for breakdown, otherwise use feeAmount as commission
                    const meta = t.metadata || {};
                    const commission = meta.priceBreakdown?.commission ?? Number(t.feeAmount || 0);
                    const convenience = meta.priceBreakdown?.convenienceFee ?? 0;
                    summary.commission += Number(commission);
                    summary.convenience += Number(convenience);
                }
                else if (t.type === 'PLATFORM_FEE') {
                    summary.commission += Number(t.amount || 0);
                }
                else if (t.type === 'CONVENIENCE_FEE') {
                    summary.convenience += Number(t.amount || 0);
                }
                else if (t.type === 'ADJUSTMENT' || t.type === 'REFUND') {
                    summary.adjustments += Number(t.amount || 0);
                }
            });
            res.json({
                success: true,
                data: {
                    commissionTotal: summary.commission,
                    convenienceTotal: summary.convenience,
                    adjustmentsTotal: summary.adjustments,
                    totalPlatformRevenue: summary.commission + summary.convenience + summary.adjustments
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async listPayouts(req, res) {
        try {
            const [batches, wallets] = await Promise.all([
                prisma_1.prisma.payoutBatch.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: { wallet: { include: { organizer: { select: { organizationName: true } } } } }
                }),
                prisma_1.prisma.organizerWallet.findMany({
                    where: { availableBalance: { gt: 0 } },
                    include: { organizer: { select: { organizationName: true } } }
                })
            ]);
            const available = wallets.map(w => ({
                organizerId: w.organizerId,
                organizerName: w.organizer.organizationName,
                available: Number(w.availableBalance)
            }));
            const pending = [];
            const paid = [];
            batches.forEach(b => {
                const item = {
                    batchId: b.id,
                    organizerName: b.wallet?.organizer?.organizationName || 'Unknown',
                    amount: Number(b.amount),
                    status: b.status,
                    createdAt: b.createdAt,
                    settledAt: b.processedAt
                };
                if (b.status === client_1.FinancialStatus.PAID_OUT) {
                    paid.push(item);
                }
                else if (b.status === client_1.FinancialStatus.INITIATED) {
                    pending.push(item);
                }
            });
            res.json({
                success: true,
                data: {
                    available,
                    pending,
                    paid,
                    availableTotal: available.reduce((s, x) => s + x.available, 0),
                    pendingTotal: pending.reduce((s, x) => s + x.amount, 0),
                    paidTotal: paid.reduce((s, x) => s + x.amount, 0)
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getSettlementLedger(req, res) {
        try {
            const rows = await prisma_1.prisma.financialTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
            const mapped = rows.map(r => {
                const meta = r.metadata || null;
                const notesRaw = meta?.notes ?? (meta && Object.keys(meta).length ? JSON.stringify(meta) : null);
                const notes = notesRaw ? notesRaw : '-';
                return { refId: r.id, timestamp: r.createdAt, type: r.type, amount: r.amount, notes };
            });
            res.json({ success: true, data: mapped });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async exportLedgerCSV(req, res) {
        try {
            const rows = await prisma_1.prisma.financialTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
            const header = ['refId', 'timestamp', 'type', 'amount', 'notes'];
            const csvRows = rows.map(r => {
                const meta = r.metadata || null;
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.FinancialController = FinancialController;
