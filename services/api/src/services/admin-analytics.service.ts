import { prisma } from "../lib/prisma";
import { EventStatus, OrganizerStatus, PaymentStatus } from "@prisma/client";
import * as os from "os";

export class AdminAnalyticsService {
    static async getPlatformStats() {
        const [salesAgg, platformFeeAgg] = await Promise.all([
            prisma.financialTransaction.aggregate({
                where: { type: 'TICKET_PURCHASE' },
                _sum: {
                    amount: true,
                    netAmount: true,
                },
            }),
            prisma.financialTransaction.aggregate({
                where: { type: 'PLATFORM_FEE' },
                _sum: { amount: true },
            }),
        ]);

        const totalGMV = Number(salesAgg._sum.amount || 0);
        const platformCommission = Number(platformFeeAgg._sum.amount || 0);
        const organizerEarnings = Number(salesAgg._sum.netAmount || 0);

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

        // 5. Organizer Liabilities (What we owe them)
        const organizerLiabilities = Number(salesAgg._sum.netAmount || 0);

        // 6. Revenue Projections (Simple linear projection based on last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentTickets = await prisma.ticket.count({
            where: {
                status: { in: ['SOLD', 'VALID', 'USED'] },
                createdAt: { gte: sevenDaysAgo }
            }
        });

        const dailyVelocity = recentTickets / 7;
        const monthlyProjection = dailyVelocity * 30;

        // 7. System Health (Real checks)
        const systemHealth: any = {
            api: 'healthy',
            database: 'healthy',
            redis: 'healthy',
            metrics: {
                cpu: os.loadavg()[0] * 10, // Scale to 100 roughly
                memory: (1 - os.freemem() / os.totalmem()) * 100,
                uptime: os.uptime(),
                activeConnections: await prisma.user.count({ where: { status: 'ACTIVE' } }) // Proxy for active sessions
            }
        };

        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            systemHealth.database = 'unhealthy';
        }

        try {
            const redis = (await import("../utils/redis")).default;
            const pong = await redis.ping();
            if (pong !== 'PONG') systemHealth.redis = 'unhealthy';
        } catch (e) {
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
                status: { in: ['CAPTURED', 'RELEASED', 'SETTLED'] },
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
        const categorySales: any[] = await prisma.mainCategory.findMany({
            include: {
                events: {
                    include: {
                        transactions: {
                            where: { type: 'TICKET_PURCHASE', status: { in: ['CAPTURED', 'RELEASED', 'SETTLED'] } },
                            select: { amount: true }
                        }
                    }
                }
            }
        });

        let totalCategoryRevenue = 0;
        const categoryDistribution = categorySales.map((cat: any) => {
            const total = cat.events.reduce((sum: number, evt: any) => {
                return sum + evt.transactions.reduce((s: number, tx: any) => s + Number(tx.amount), 0);
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
        const citySales: any[] = await prisma.city.findMany({
            include: {
                events: {
                    include: {
                        transactions: {
                            where: { type: 'TICKET_PURCHASE', status: { in: ['CAPTURED', 'RELEASED', 'SETTLED'] } },
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

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyTx = await prisma.financialTransaction.findMany({
            where: {
                type: 'TICKET_PURCHASE',
                status: { in: ['CAPTURED', 'RELEASED', 'SETTLED'] },
                createdAt: { gte: sevenDaysAgo },
            },
            select: {
                amount: true,
                event: {
                    select: {
                        organizer: { select: { organizationName: true } },
                        category: { select: { name: true } },
                    },
                },
                createdAt: true,
            },
        });

        const dayMap = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(sevenDaysAgo.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            dayMap.set(key, 0);
        }

        const organizerRevenue = new Map<string, number>();
        const categoryRevenue = new Map<string, number>();

        dailyTx.forEach((tx) => {
            const dayKey = tx.createdAt.toISOString().slice(0, 10);
            dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + Number(tx.amount || 0));

            const organizerName = tx.event?.organizer?.organizationName || 'Unknown';
            organizerRevenue.set(organizerName, (organizerRevenue.get(organizerName) || 0) + Number(tx.amount || 0));

            const categoryName = tx.event?.category?.name || 'Uncategorized';
            categoryRevenue.set(categoryName, (categoryRevenue.get(categoryName) || 0) + Number(tx.amount || 0));
        });

        const dailySales = Array.from(dayMap.entries()).map(([date, amount]) => {
            const d = new Date(date);
            return {
                date,
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                amount,
            };
        });

        const organizerTotal = Array.from(organizerRevenue.values()).reduce((sum, v) => sum + v, 0);
        const organizerDistribution = Array.from(organizerRevenue.entries())
            .map(([name, revenue]) => ({
                name,
                revenue,
                value: organizerTotal > 0 ? Math.round((revenue / organizerTotal) * 100) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);

        const categoryTotal = Array.from(categoryRevenue.values()).reduce((sum, v) => sum + v, 0);
        const categoryDistributionLive = Array.from(categoryRevenue.entries())
            .map(([name, revenue]) => ({
                name,
                revenue,
                value: categoryTotal > 0 ? Math.round((revenue / categoryTotal) * 100) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);

        return {
            monthlySales: sortedMonths,
            categories: categoriesWithPercentage, // Return as 'categories' for frontend
            categoryRevenueDistribution: categoryDistribution,
            cityDistribution,
            dailySales,
            organizerDistribution,
            categoryDistribution: categoryDistributionLive,
        };
    }
}
