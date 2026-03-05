"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const prisma_1 = require("../lib/prisma");
class AnalyticsService {
    /**
     * Records an entry event for analytics.
     * Updates/Creates an EntryMetric record for the current time bucket.
     */
    static async recordEntryMetric(eventId, gateId, status) {
        // EntryMetric.eventId has a FK to Event; avoid writing metrics for unknown/invalid events.
        if (!eventId || eventId <= 0)
            return;
        const now = new Date();
        // Bucket by hour
        const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
        try {
            await prisma_1.prisma.entryMetric.upsert({
                where: {
                    eventId_gateId_timestamp: {
                        eventId,
                        gateId: gateId || "MAIN",
                        timestamp
                    }
                },
                update: {
                    entryCount: status === "SUCCESS" ? { increment: 1 } : undefined,
                    failedCount: status === "REJECTED" ? { increment: 1 } : undefined
                },
                create: {
                    eventId,
                    gateId: gateId || "MAIN",
                    timestamp,
                    entryCount: status === "SUCCESS" ? 1 : 0,
                    failedCount: status === "REJECTED" ? 1 : 0
                }
            });
        }
        catch (err) {
            // If the event was deleted or eventId is invalid, ignore the metric write.
            // Prisma FK violation code: P2003
            if (err?.code === 'P2003')
                return;
            throw err;
        }
    }
    /**
     * Gets real-time dashboard data for an organizer.
     */
    static async getLiveEventMetrics(eventId) {
        const [totalTickets, totalEntered, entryMetrics] = await Promise.all([
            prisma_1.prisma.ticket.count({ where: { eventId, status: "SOLD" } }), // Pending entry
            prisma_1.prisma.ticket.count({ where: { eventId, status: "USED" } }),
            prisma_1.prisma.entryMetric.findMany({
                where: { eventId },
                orderBy: { timestamp: 'asc' }
            })
        ]);
        const totalSold = totalTickets + totalEntered;
        const entryRate = totalSold > 0 ? (totalEntered / totalSold) * 100 : 0;
        // Group metrics by gate
        const gatePerformance = entryMetrics.reduce((acc, curr) => {
            const gate = curr.gateId || "MAIN";
            if (!acc[gate])
                acc[gate] = { entryCount: 0, failedCount: 0 };
            acc[gate].entryCount += curr.entryCount;
            acc[gate].failedCount += curr.failedCount;
            return acc;
        }, {});
        return {
            totalSold,
            totalEntered,
            entryRate: parseFloat(entryRate.toFixed(2)),
            gatePerformance,
            timeline: entryMetrics.map(m => ({
                time: m.timestamp,
                count: m.entryCount
            }))
        };
    }
    /**
     * Gets post-event summary for admin/organizer.
     */
    static async getPostEventAnalytics(eventId) {
        const stats = await prisma_1.prisma.ticket.groupBy({
            by: ['status'],
            where: { eventId },
            _count: true
        });
        const counts = stats.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {});
        const noShowCount = counts["SOLD"] || 0;
        const attendeeCount = counts["USED"] || 0;
        const totalSold = noShowCount + attendeeCount;
        return {
            totalSold,
            attendeeCount,
            noShowCount,
            noShowRate: totalSold > 0 ? parseFloat(((noShowCount / totalSold) * 100).toFixed(2)) : 0,
            peakEntry: await this.getPeakEntryTime(eventId)
        };
    }
    static async getPeakEntryTime(eventId) {
        const peak = await prisma_1.prisma.entryMetric.findFirst({
            where: { eventId },
            orderBy: { entryCount: 'desc' },
            select: { timestamp: true, entryCount: true }
        });
        return peak;
    }
}
exports.AnalyticsService = AnalyticsService;
