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
}
