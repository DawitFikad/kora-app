import { prisma } from "../lib/prisma";
import { EventStatus, OrganizerStatus, PaymentStatus } from "@prisma/client";

export class AdminAnalyticsService {
    static async getPlatformStats() {
        // 1. GMT and Commissions from successful purchases
        const financialStats = await prisma.purchase.aggregate({
            where: { status: PaymentStatus.SUCCESS },
            _sum: {
                totalAmount: true
            }
        });

        const totalGMV = financialStats._sum.totalAmount?.toNumber() || 0;

        // Commission is calculated from netAmount in FinancialTransaction
        const commissionStats = await prisma.financialTransaction.aggregate({
            where: {
                status: 'SETTLED',
                type: 'PLATFORM_FEE'
            },
            _sum: {
                amount: true
            }
        });
        const platformCommission = commissionStats._sum.amount?.toNumber() || 0;

        // 2. Active Counts
        const activeEvents = await prisma.event.count({
            where: { status: EventStatus.APPROVED, dateTime: { gt: new Date() } }
        });

        const activeOrganizers = await prisma.organizerProfile.count({
            where: { status: OrganizerStatus.APPROVED }
        });

        const pendingOrganizers = await prisma.organizerProfile.count({
            where: { status: OrganizerStatus.PENDING }
        });

        const pendingEvents = await prisma.event.count({
            where: { status: EventStatus.PENDING }
        });

        const activeUsers = await prisma.user.count({
            where: { status: 'ACTIVE' }
        });

        // 3. Ticket Sales
        const totalTicketsSold = await prisma.ticket.count({
            where: { status: { in: ['SOLD', 'VALID', 'USED'] } }
        });

        // 4. Recent Activity
        const recentPurchases = await prisma.purchase.findMany({
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

        // 5. System Health (Simplified for now)
        const systemHealth = {
            api: 'healthy',
            database: 'healthy',
            redis: 'healthy'
        };

        return {
            kpis: {
                totalGMV,
                platformCommission,
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
        const organizers = await prisma.organizerProfile.findMany({
            include: {
                _count: {
                    select: { events: true }
                },
                user: {
                    select: {
                        purchases: {
                            where: { status: PaymentStatus.SUCCESS },
                            select: { totalAmount: true }
                        }
                    }
                }
            }
        });

        return organizers.map((org: any) => ({
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
        const sales: any[] = await prisma.financialTransaction.findMany({
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
        const monthlyStats: Record<string, number> = {};
        sales.forEach((s: any) => {
            const month = s.createdAt.toLocaleString('default', { month: 'short' });
            monthlyStats[month] = (monthlyStats[month] || 0) + Number(s.amount);
        });

        // 2. Sales by Category
        const categorySales: any[] = await prisma.category.findMany({
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

        const categoryDistribution = categorySales.map((cat: any) => {
            const total = cat.events.reduce((sum: number, evt: any) => {
                return sum + evt.transactions.reduce((s: number, tx: any) => s + Number(tx.amount), 0);
            }, 0);
            return { name: cat.name, value: total };
        });

        // 3. Sales by City
        const citySales: any[] = await prisma.city.findMany({
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

        const cityDistribution = citySales.map((city: any) => {
            const total = city.events.reduce((sum: number, evt: any) => {
                return sum + evt.transactions.reduce((s: number, tx: any) => s + Number(tx.amount), 0);
            }, 0);
            return { name: city.name, value: total };
        });

        return {
            monthlySales: Object.entries(monthlyStats).map(([name, amount]) => ({ name, amount })),
            categoryDistribution,
            cityDistribution
        };
    }
}
