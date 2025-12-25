import { prisma } from "../lib/prisma";
import redis from "../utils/redis";
import { AnalyticsService } from "./analytics.service";

export class EventOperationsService {
    private static CACHE_TTL = 60; // 1 minute cache for dashboard metrics

    /**
     * Gets a comprehensive operational snapshot for an organizer.
     */
    static async getEventOperationsSummary(eventId: number, organizerId: number) {
        // 1. Security Check: Ensure organizer owns the event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { tiers: true }
        });

        if (!event || event.organizerId !== organizerId) {
            throw new Error("Event not found or access denied.");
        }

        const cacheKey = `ops:dashboard:event:${eventId}`;
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return JSON.parse(cachedData);

        // 2. Fetch Data
        const [sales, entries, financial] = await Promise.all([
            this.getSalesSnapshot(eventId),
            AnalyticsService.getLiveEventMetrics(eventId),
            this.getFinancialSnapshot(eventId)
        ]);

        const summary = {
            event: {
                id: event.id,
                title: event.title,
                status: event.status,
                dateTime: event.dateTime,
                venue: event.venue
            },
            sales,
            liveOperations: {
                totalEntered: entries.totalEntered,
                entryRate: entries.entryRate,
                gatePerformance: entries.gatePerformance,
                timeline: entries.timeline,
                offlinePending: await this.getOfflinePendingSyncCount(eventId)
            },
            financial: {
                grossVolume: financial.gross,
                netRevenue: financial.net,
                platformFees: financial.fees,
                payoutStatus: financial.payoutStatus
            }
        };

        // 3. Cache and Return
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(summary));
        return summary;
    }

    private static async getSalesSnapshot(eventId: number) {
        const tierStats = await prisma.ticket.groupBy({
            by: ['tierId'],
            where: { eventId, status: { in: ["SOLD", "USED", "VALID"] } },
            _count: true
        });

        const tiers = await prisma.ticketTier.findMany({
            where: { eventId }
        });

        const performance = tiers.map(tier => {
            const soldCount = tierStats.find(s => s.tierId === tier.id)?._count || 0;
            return {
                id: tier.id,
                name: tier.name,
                sold: soldCount,
                capacity: tier.capacity,
                remaining: tier.capacity - soldCount,
                occupancy: tier.capacity > 0 ? (soldCount / tier.capacity) * 100 : 0
            };
        });

        return {
            totalTicketsSold: performance.reduce((sum, p) => sum + p.sold, 0),
            totalCapacity: performance.reduce((sum, p) => sum + p.capacity, 0),
            tierPerformance: performance
        };
    }

    private static async getFinancialSnapshot(eventId: number) {
        const transactions = await prisma.financialTransaction.findMany({
            where: { eventId, status: "RELEASED" } // Only released funds contribute to net
        });

        const gross = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const fees = transactions.reduce((sum, t) => sum + Number(t.feeAmount), 0);
        const net = transactions.reduce((sum, t) => sum + Number(t.netAmount), 0);

        // Check if event has a payout batch
        const payout = await prisma.payoutBatch.findFirst({
            where: { wallet: { organizer: { events: { some: { id: eventId } } } } },
            orderBy: { createdAt: 'desc' }
        });

        return {
            gross,
            fees,
            net,
            payoutStatus: payout ? payout.status : "NONE"
        };
    }

    private static async getOfflinePendingSyncCount(eventId: number) {
        // This would count scan logs that were recorded offline but might have discrepancies
        // In this simplified model, all logs in DB are 'synced'.
        // Real-world: Check for logs where deviceTime is significantly older than createdAt but recently pushed
        return 0; // Placeholder for sync logic
    }

    /**
     * Gets aggregated stats for an organizer across all their events.
     */
    static async getOrganizerSummary(organizerId: number) {
        const [events, wallet, recentSales] = await Promise.all([
            prisma.event.findMany({
                where: { organizerId },
                include: {
                    _count: {
                        select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } }
                    },
                    tiers: true
                }
            }),
            prisma.organizerWallet.findUnique({
                where: { organizerId }
            }),
            prisma.ticket.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    event: { organizerId },
                    status: { in: ["SOLD", "USED", "VALID"] },
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                }
            })
        ]);

        const totalTicketsSold = events.reduce((sum, event) => sum + event._count.tickets, 0);
        const totalCapacity = events.reduce((sum, event) => {
            return sum + event.tiers.reduce((tSum, tier) => tSum + tier.capacity, 0);
        }, 0);

        // Calculate total revenue from released transactions
        const totalRevenue = await prisma.financialTransaction.aggregate({
            where: {
                event: { organizerId },
                status: "RELEASED"
            },
            _sum: { netAmount: true }
        });

        // Calculate daily sales for velocity chart
        const salesVelocity = new Array(7).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateString = date.toISOString().split('T')[0];

            const count = recentSales
                .filter(s => s.createdAt.toISOString().split('T')[0] === dateString)
                .reduce((sum, s) => sum + s._count, 0);

            return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), count };
        });

        return {
            totalRevenue: Number(totalRevenue._sum.netAmount || 0),
            ticketsSold: totalTicketsSold,
            totalCapacity,
            nextPayout: Number(wallet?.availableBalance || 0),
            salesVelocity
        };
    }

    /**
     * Gets a detailed financial history for the organizer.
     */
    static async getOrganizerFinancials(organizerId: number) {
        const [transactions, wallet] = await Promise.all([
            prisma.financialTransaction.findMany({
                where: { event: { organizerId } },
                include: {
                    purchase: {
                        include: { user: { include: { profile: true } } }
                    },
                    event: { select: { title: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            }),
            prisma.organizerWallet.findUnique({
                where: { organizerId }
            })
        ]);

        const grossSales = await prisma.financialTransaction.aggregate({
            where: { event: { organizerId }, type: "TICKET_PURCHASE" },
            _sum: { amount: true }
        });

        const totalFees = await prisma.financialTransaction.aggregate({
            where: { event: { organizerId }, type: "PLATFORM_FEE" },
            _sum: { amount: true }
        });

        return {
            grossSales: Number(grossSales._sum.amount || 0),
            totalPayouts: Number(wallet?.totalWithdrawn || 0),
            processingFees: Number(totalFees._sum.amount || 0),
            availableBalance: Number(wallet?.availableBalance || 0),
            transactions: transactions.map(t => ({
                id: `#ORD-${t.id}`,
                name: t.purchase?.user.profile?.fullName || t.purchase?.user.phoneNumber || "System",
                date: t.createdAt,
                amount: Number(t.amount),
                status: t.status === "RELEASED" ? "Completed" : "Processing"
            }))
        };
    }

    /**
     * Gets ticket tier performance across all events.
     */
    static async getOrganizerTicketStats(organizerId: number) {
        const events = await prisma.event.findMany({
            where: { organizerId },
            include: {
                tiers: {
                    include: {
                        _count: {
                            select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } }
                        }
                    }
                }
            }
        });

        const allTiers = events.flatMap(e => e.tiers.map(t => ({
            name: t.name,
            eventName: e.title,
            price: Number(t.price),
            sold: t._count.tickets,
            capacity: t.capacity,
            status: t._count.tickets >= t.capacity ? 'Sold Out' : (t._count.tickets > t.capacity * 0.8 ? 'Few Left' : 'Active')
        })));

        const totalCapacity = allTiers.reduce((sum, t) => sum + t.capacity, 0);
        const totalSold = allTiers.reduce((sum, t) => sum + t.sold, 0);

        return {
            tiers: allTiers,
            totalCapacity,
            totalSold,
            checkedIn: await prisma.ticket.count({
                where: { event: { organizerId }, status: "USED" }
            }),
            reserved: await prisma.ticket.count({
                where: { event: { organizerId }, status: "VALID" } // Valid but not used
            })
        };
    }
}
