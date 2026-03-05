"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAnalyticsService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const os = __importStar(require("os"));
class AdminAnalyticsService {
    static async getPlatformStats() {
        // 1. GMT and Commissions from issued tickets (Point 7: Accurate without payment gateway)
        const ticketStats = await prisma_1.prisma.ticket.aggregate({
            where: { status: { in: ['SOLD', 'VALID', 'USED'] } },
            _sum: {
                basePrice: true,
                commissionAmt: true,
                convenienceFee: true,
                platformNet: true,
                organizerNet: true
            }
        });
        const totalGMV = Number(ticketStats._sum.basePrice || 0) + Number(ticketStats._sum.convenienceFee || 0);
        const platformCommission = Number(ticketStats._sum.platformNet || 0);
        const organizerEarnings = Number(ticketStats._sum.organizerNet || 0);
        // 2. Active Counts
        const activeEvents = await prisma_1.prisma.event.count({
            where: { status: client_1.EventStatus.APPROVED, dateTime: { gt: new Date() } }
        });
        const activeOrganizers = await prisma_1.prisma.organizerProfile.count({
            where: { status: client_1.OrganizerStatus.APPROVED }
        });
        const pendingOrganizers = await prisma_1.prisma.organizerProfile.count({
            where: { status: client_1.OrganizerStatus.PENDING }
        });
        const pendingEvents = await prisma_1.prisma.event.count({
            where: { status: client_1.EventStatus.PENDING }
        });
        const activeUsers = await prisma_1.prisma.user.count({
            where: { status: 'ACTIVE' }
        });
        // 3. Ticket Sales
        const totalTicketsSold = await prisma_1.prisma.ticket.count({
            where: { status: { in: ['SOLD', 'VALID', 'USED'] } }
        });
        // 4. Recent Activity
        const recentPurchases = await prisma_1.prisma.purchase.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        phoneNumber: true,
                        profile: { select: { fullName: true } }
                    }
                }
            }
        });
        // 5. Organizer Liabilities (What we owe them)
        const organizerLiabilities = Number(ticketStats._sum.organizerNet || 0);
        // 6. Revenue Projections (Simple linear projection based on last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTickets = await prisma_1.prisma.ticket.count({
            where: {
                status: { in: ['SOLD', 'VALID', 'USED'] },
                createdAt: { gte: sevenDaysAgo }
            }
        });
        const dailyVelocity = recentTickets / 7;
        const monthlyProjection = dailyVelocity * 30;
        // 7. System Health (Real checks)
        const systemHealth = {
            api: 'healthy',
            database: 'healthy',
            redis: 'healthy',
            metrics: {
                cpu: os.loadavg()[0] * 10, // Scale to 100 roughly
                memory: (1 - os.freemem() / os.totalmem()) * 100,
                uptime: os.uptime(),
                activeConnections: await prisma_1.prisma.user.count({ where: { status: 'ACTIVE' } }) // Proxy for active sessions
            }
        };
        try {
            await prisma_1.prisma.$queryRaw `SELECT 1`;
        }
        catch (e) {
            systemHealth.database = 'unhealthy';
        }
        try {
            const redis = (await Promise.resolve().then(() => __importStar(require("../utils/redis")))).default;
            const pong = await redis.ping();
            if (pong !== 'PONG')
                systemHealth.redis = 'unhealthy';
        }
        catch (e) {
            systemHealth.redis = 'unhealthy';
        }
        return {
            kpis: {
                totalGMV,
                platformCommission,
                organizerEarnings,
                organizerLiabilities,
                dailyVelocity: Math.round(dailyVelocity),
                monthlyProjection: Math.round(monthlyProjection),
                activeEvents,
                activeOrganizers,
                totalTicketsSold,
                pendingOrganizers,
                pendingEvents,
                activeUsers
            },
            recentPurchases,
            systemHealth
        };
    }
    static async getOrganizerPerformance() {
        const organizers = await prisma_1.prisma.organizerProfile.findMany({
            include: {
                _count: {
                    select: { events: true }
                },
                user: {
                    select: {
                        purchases: {
                            where: { status: client_1.PaymentStatus.SUCCESS },
                            select: { totalAmount: true }
                        }
                    }
                }
            }
        });
        return organizers.map((org) => ({
            id: org.id,
            name: org.organizationName,
            status: org.status,
            eventCount: org._count.events,
            // Sum up successful purchase amounts related to this organizer's events
            // Note: This matches simple logic, for production we'd use better joins
        }));
    }
    static async getDetailedAnalytics() {
        // 1. Sales by month (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        // Simple aggregation for now
        const sales = await prisma_1.prisma.financialTransaction.findMany({
            where: {
                type: 'TICKET_PURCHASE',
                status: 'SETTLED',
                createdAt: { gte: sixMonthsAgo }
            },
            select: {
                amount: true,
                createdAt: true
            }
        });
        // Group by month name (simple version)
        const monthlyStats = {};
        sales.forEach((s) => {
            const month = s.createdAt.toLocaleString('default', { month: 'short' });
            monthlyStats[month] = (monthlyStats[month] || 0) + Number(s.amount);
        });
        // 2. Sales by Category
        const categorySales = await prisma_1.prisma.mainCategory.findMany({
            include: {
                events: {
                    include: {
                        transactions: {
                            where: { type: 'TICKET_PURCHASE', status: 'SETTLED' },
                            select: { amount: true }
                        }
                    }
                }
            }
        });
        let totalCategoryRevenue = 0;
        const categoryDistribution = categorySales.map((cat) => {
            const total = cat.events.reduce((sum, evt) => {
                return sum + evt.transactions.reduce((s, tx) => s + Number(tx.amount), 0);
            }, 0);
            totalCategoryRevenue += total;
            return { name: cat.name, value: total };
        })
            .filter(c => c.value > 0)
            .sort((a, b) => b.value - a.value);
        // Calculate percentages
        const categoriesWithPercentage = categoryDistribution.map(cat => ({
            name: cat.name,
            value: cat.value,
            percentage: totalCategoryRevenue > 0 ? Math.round((cat.value / totalCategoryRevenue) * 100) : 0
        }));
        // 3. Sales by City
        const citySales = await prisma_1.prisma.city.findMany({
            include: {
                events: {
                    include: {
                        transactions: {
                            where: { type: 'TICKET_PURCHASE', status: 'SETTLED' },
                            select: { amount: true }
                        }
                    }
                }
            }
        });
        const cityDistribution = citySales.map((city) => {
            const total = city.events.reduce((sum, evt) => {
                return sum + evt.transactions.reduce((s, tx) => s + Number(tx.amount), 0);
            }, 0);
            return { name: city.name, value: total };
        });
        const sortedMonths = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mName = d.toLocaleString('default', { month: 'short' });
            sortedMonths.push({
                name: mName,
                amount: monthlyStats[mName] || 0
            });
        }
        return {
            monthlySales: sortedMonths,
            categories: categoriesWithPercentage, // Return as 'categories' for frontend
            categoryDistribution, // Keep original for reference
            cityDistribution
        };
    }
}
exports.AdminAnalyticsService = AdminAnalyticsService;
