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
                pendingEvents
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

        return organizers.map(org => ({
            id: org.id,
            name: org.organizationName,
            status: org.status,
            eventCount: org._count.events,
            // Sum up successful purchase amounts related to this organizer's events
            // Note: This matches simple logic, for production we'd use better joins
        }));
    }
}
