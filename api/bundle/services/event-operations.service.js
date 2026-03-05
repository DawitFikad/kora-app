"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventOperationsService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const redis_1 = __importDefault(require("../utils/redis"));
const analytics_service_1 = require("./analytics.service");
class EventOperationsService {
    /**
     * Gets a comprehensive operational snapshot for an organizer.
     */
    static async getEventOperationsSummary(eventId, organizerId) {
        // 1. Security Check: Ensure organizer owns the event
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            include: { tiers: true }
        });
        if (!event || event.organizerId !== organizerId) {
            throw new Error("Event not found or access denied.");
        }
        const cacheKey = `ops:dashboard:event:${eventId}`;
        const cachedData = await redis_1.default.get(cacheKey);
        if (cachedData)
            return JSON.parse(cachedData);
        // 2. Fetch Data
        const [sales, entries, financial] = await Promise.all([
            this.getSalesSnapshot(eventId),
            analytics_service_1.AnalyticsService.getLiveEventMetrics(eventId),
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
        await redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify(summary));
        return summary;
    }
    static async getSalesSnapshot(eventId) {
        const tierStats = await prisma_1.prisma.ticket.groupBy({
            by: ['tierId'],
            where: { eventId, status: { in: ["SOLD", "USED", "VALID"] } },
            _count: true
        });
        const tiers = await prisma_1.prisma.ticketTier.findMany({
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
    static async getFinancialSnapshot(eventId) {
        // Use Ticket financial snapshots for accurate reporting without payments (Point 7)
        const ticketStats = await prisma_1.prisma.ticket.aggregate({
            where: { eventId, status: { in: ["SOLD", "USED", "VALID"] } },
            _sum: {
                basePrice: true,
                organizerNet: true,
                platformNet: true
            }
        });
        const gross = Number(ticketStats._sum.basePrice || 0);
        const net = Number(ticketStats._sum.organizerNet || 0);
        const fees = Number(ticketStats._sum.platformNet || 0);
        // Check if event has a payout batch (Real bank status)
        const payout = await prisma_1.prisma.payoutBatch.findFirst({
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
    static async getOfflinePendingSyncCount(eventId) {
        // This would count scan logs that were recorded offline but might have discrepancies
        // In this simplified model, all logs in DB are 'synced'.
        // Real-world: Check for logs where deviceTime is significantly older than createdAt but recently pushed
        return 0; // Placeholder for sync logic
    }
    /**
     * Gets aggregated stats for an organizer across all their events.
     */
    static async getOrganizerSummary(organizerId) {
        const cacheKey = `ops:summary:organizer:${organizerId}`;
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        catch (e) {
            console.error("Redis error in getOrganizerSummary:", e);
        }
        const [events, wallet, recentSales, ticketsCount, ticketsForAnalytics] = await Promise.all([
            prisma_1.prisma.event.findMany({
                where: { organizerId },
                include: {
                    _count: {
                        select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } }
                    },
                    tiers: {
                        include: {
                            _count: {
                                select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } }
                            }
                        }
                    },
                    city: { select: { name: true } }
                }
            }),
            prisma_1.prisma.organizerWallet.findUnique({
                where: { organizerId }
            }),
            prisma_1.prisma.ticket.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    event: { organizerId },
                    status: { in: ["SOLD", "USED", "VALID"] },
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            }),
            prisma_1.prisma.ticket.count({
                where: {
                    event: { organizerId },
                    status: { in: ["SOLD", "USED", "VALID"] }
                }
            }),
            prisma_1.prisma.ticket.findMany({
                where: {
                    event: { organizerId },
                    status: { in: ["SOLD", "USED", "VALID"] }
                },
                select: {
                    createdAt: true,
                    userId: true,
                    eventId: true
                },
                take: 5000 // Sample for analytics to prevent memory issues
            })
        ]);
        const totalTicketsSold = ticketsCount;
        const totalCapacity = events.reduce((sum, event) => {
            return sum + event.tiers.reduce((tSum, tier) => tSum + tier.capacity, 0);
        }, 0);
        // Calculate total revenue snapshots from issued tickets (Point 7)
        const ticketMetrics = await prisma_1.prisma.ticket.aggregate({
            where: {
                event: { organizerId },
                status: { in: ["SOLD", "USED", "VALID"] }
            },
            _sum: {
                basePrice: true,
                organizerNet: true,
                platformNet: true
            }
        });
        const grossVolume = Number(ticketMetrics._sum.basePrice || 0);
        const netEarnings = Number(ticketMetrics._sum.organizerNet || 0);
        // Calculate daily sales for velocity chart (last 7 days)
        const salesVelocity = new Array(7).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateString = date.toISOString().split('T')[0];
            const count = recentSales
                .filter(s => new Date(s.createdAt).toISOString().split('T')[0] === dateString)
                .reduce((sum, s) => sum + (s._count?._all || s._count || 0), 0);
            return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), count };
        });
        const totalCheckIns = await prisma_1.prisma.ticket.count({
            where: {
                event: { organizerId },
                status: "USED"
            }
        });
        const activeEventsCount = events.filter(e => e.status === client_1.EventStatus.APPROVED && new Date(e.dateTime) > new Date()).length;
        // --- Advanced Analytics Calculations ---
        // 1. Performance Insights: Best Event & Peak Day
        const eventRevenues = events.map(e => ({
            title: e.title,
            revenue: e.tiers.reduce((acc, t) => acc + (Number(t.price) * (t._count?.tickets || 0)), 0)
        })).sort((a, b) => b.revenue - a.revenue);
        const bestEvent = eventRevenues[0] || { title: 'N/A', revenue: 0 };
        const dayCounts = {};
        recentSales.forEach(s => {
            const day = new Date(s.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[day] = (dayCounts[day] || 0) + (s._count?._all || s._count || 0);
        });
        const peakDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
        // 2. Revenue Breakdown (Top 3 Events)
        const revenueBreakdown = eventRevenues.slice(0, 3).map(e => ({
            label: e.title,
            value: e.revenue,
            color: '#1D90F5' // Colors will be handled in frontend cyclically
        }));
        // 3. Funnel Metrics (Real Data: Capacity -> Sold -> Used)
        const funnel = {
            capacity: totalCapacity,
            sold: totalTicketsSold,
            checkedIn: totalCheckIns
        };
        const conversionRate = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0;
        const ticketsSoldVsCapacity = {
            sold: totalTicketsSold,
            capacity: totalCapacity,
            percent: conversionRate
        };
        const hourBuckets = new Array(24).fill(0);
        ticketsForAnalytics.forEach((t) => {
            const hour = new Date(t.createdAt).getHours();
            hourBuckets[hour] += 1;
        });
        const peakHourIndex = hourBuckets.reduce((maxIdx, count, idx, arr) => count > arr[maxIdx] ? idx : maxIdx, 0);
        const peakBuyingTime = {
            hour: peakHourIndex,
            label: new Date(2020, 0, 1, peakHourIndex).toLocaleTimeString('en-US', { hour: 'numeric' }),
            count: hourBuckets[peakHourIndex] || 0
        };
        const userCounts = new Map();
        ticketsForAnalytics.forEach((t) => {
            userCounts.set(t.userId, (userCounts.get(t.userId) || 0) + 1);
        });
        const totalBuyers = userCounts.size;
        const returningBuyers = Array.from(userCounts.values()).filter(c => c > 1).length;
        const returningBuyersPercent = totalBuyers > 0 ? (returningBuyers / totalBuyers) * 100 : 0;
        const cityMap = new Map();
        events.forEach((e) => {
            const cityName = e.city?.name || 'Unknown';
            const sold = e._count?.tickets || 0;
            cityMap.set(cityName, (cityMap.get(cityName) || 0) + sold);
        });
        const locationHeatmap = Array.from(cityMap.entries())
            .map(([city, tickets]) => ({ city, tickets }))
            .sort((a, b) => b.tickets - a.tickets);
        const deviceBreakdown = {
            Mobile: 0,
            Web: 0,
            Unknown: totalTicketsSold
        };
        // 4. Alerts
        const alerts = [];
        // Alert: Pending Approval
        const pendingEvents = events.filter(e => e.status === client_1.EventStatus.PENDING).length;
        if (pendingEvents > 0) {
            alerts.push({
                type: 'warning',
                message: `${pendingEvents} event${pendingEvents > 1 ? 's are' : ' is'} pending approval`,
                action: 'Events'
            });
        }
        // Alert: Low Capacity (events with > 80% sold)
        events.forEach(e => {
            if (e.status === client_1.EventStatus.APPROVED && new Date(e.dateTime) > new Date()) {
                const totalCap = e.tiers.reduce((sum, t) => sum + t.capacity, 0);
                const sold = e._count.tickets;
                if (totalCap > 0 && (sold / totalCap) >= 0.8) {
                    alerts.push({
                        type: 'critical',
                        message: `Low capacity: ${e.title} is ${((sold / totalCap) * 100).toFixed(0)}% sold out`,
                        action: 'Events'
                    });
                }
            }
        });
        // 5. Upcoming Events (Next 7 Days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const now = new Date();
        const upcomingEvents = events
            .filter(e => {
            const eDate = new Date(e.dateTime);
            return e.status === client_1.EventStatus.APPROVED && eDate >= now && eDate <= nextWeek;
        })
            .map(e => ({
            id: e.id,
            title: e.title,
            date: e.dateTime,
            sold: e._count.tickets,
            capacity: e.tiers.reduce((sum, t) => sum + t.capacity, 0)
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const result = {
            totalRevenue: netEarnings,
            grossVolume: grossVolume,
            ticketsSold: totalTicketsSold,
            totalCapacity,
            conversionRate,
            ticketsSoldVsCapacity,
            nextPayout: Number(wallet?.availableBalance || 0),
            salesVelocity,
            totalCheckIns,
            activeEvents: activeEventsCount,
            upcomingEvents,
            alerts,
            advanced: {
                bestEvent: { title: bestEvent.title, revenue: bestEvent.revenue },
                peakDay: { day: peakDayEntry[0], count: peakDayEntry[1] },
                peakBuyingTime,
                deviceBreakdown,
                locationHeatmap,
                returningBuyers: {
                    percent: returningBuyersPercent,
                    total: totalBuyers,
                    returning: returningBuyers
                },
                revenueBreakdown,
                funnel
            }
        };
        try {
            await redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        }
        catch (e) {
            console.error("Redis set error:", e);
        }
        return result;
    }
    /**
     * Gets a detailed financial history for the organizer.
     */
    static async getOrganizerFinancials(organizerId) {
        const cacheKey = `ops:financials:organizer:${organizerId}`;
        try {
            const cached = await redis_1.default.get(cacheKey);
            if (cached)
                return JSON.parse(cached);
        }
        catch (e) {
            console.error("Redis error in getOrganizerFinancials:", e);
        }
        const [transactions, wallet, events, tickets, ticketingMetrics] = await Promise.all([
            prisma_1.prisma.financialTransaction.findMany({
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
            prisma_1.prisma.organizerWallet.findUnique({
                where: { organizerId }
            }),
            prisma_1.prisma.event.findMany({
                where: { organizerId },
                select: {
                    id: true,
                    title: true,
                    tiers: { select: { capacity: true } }
                }
            }),
            prisma_1.prisma.ticket.findMany({
                where: {
                    event: { organizerId },
                    status: { in: ["SOLD", "USED", "VALID"] }
                },
                select: {
                    basePrice: true,
                    createdAt: true,
                    tier: { select: { name: true } },
                    event: { select: { id: true, title: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 5000
            }),
            prisma_1.prisma.ticket.aggregate({
                where: {
                    event: { organizerId },
                    status: { in: ["SOLD", "USED", "VALID"] }
                },
                _sum: { basePrice: true },
                _count: true
            })
        ]);
        const totalRevenue = Number(ticketingMetrics._sum.basePrice || 0);
        const totalTicketsSold = ticketingMetrics._count || 0;
        const eventTitleMap = new Map(events.map((e) => [e.id, e.title]));
        const organizerEventIds = new Set(events.map((e) => e.id));
        // Calculate gross sales and fees
        const grossSales = await prisma_1.prisma.financialTransaction.aggregate({
            where: { event: { organizerId }, type: "TICKET_PURCHASE" },
            _sum: { amount: true }
        });
        const totalFees = await prisma_1.prisma.financialTransaction.aggregate({
            where: { event: { organizerId }, type: "PLATFORM_FEE" },
            _sum: { amount: true }
        });
        // Total revenue and sold counts calculated from ticketingMetrics aggregate above
        // Calculate sales trend (last 30 days by default)
        const salesTrendMap = new Map();
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 29);
        // Initialize all days with 0
        for (let i = 0; i < 30; i++) {
            const date = new Date(last30Days);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            salesTrendMap.set(dateKey, { revenue: 0, tickets: 0 });
        }
        // Fill in actual sales data
        tickets.forEach(ticket => {
            const dateKey = new Date(ticket.createdAt).toISOString().split('T')[0];
            if (salesTrendMap.has(dateKey)) {
                const existing = salesTrendMap.get(dateKey);
                existing.revenue += Number(ticket.basePrice);
                existing.tickets += 1;
            }
        });
        const salesTrend = Array.from(salesTrendMap.entries())
            .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: data.revenue,
            tickets: data.tickets
        }));
        // Calculate revenue by ticket type
        const revenueByTypeMap = new Map();
        tickets.forEach(ticket => {
            const tierName = ticket.tier.name;
            if (!revenueByTypeMap.has(tierName)) {
                revenueByTypeMap.set(tierName, { revenue: 0, count: 0 });
            }
            const existing = revenueByTypeMap.get(tierName);
            existing.revenue += Number(ticket.basePrice);
            existing.count += 1;
        });
        const revenueByTicketType = Array.from(revenueByTypeMap.entries())
            .map(([name, data]) => ({
            name,
            value: data.revenue,
            count: data.count
        }))
            .sort((a, b) => b.value - a.value);
        // Calculate top performing events
        const eventRevenueMap = new Map();
        tickets.forEach(ticket => {
            const eventId = ticket.event.id;
            if (!eventRevenueMap.has(eventId)) {
                eventRevenueMap.set(eventId, {
                    title: ticket.event.title,
                    revenue: 0,
                    tickets: 0
                });
            }
            const existing = eventRevenueMap.get(eventId);
            existing.revenue += Number(ticket.basePrice);
            existing.tickets += 1;
        });
        const topEvents = Array.from(eventRevenueMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(event => ({
            name: event.title,
            revenue: event.revenue,
            tickets: event.tickets
        }));
        // Calculate average ticket price
        const averageTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
        const salesTable = transactions
            .filter(t => t.type === "TICKET_PURCHASE")
            .map(t => {
            const metadata = (t.purchase?.metadata || {});
            const eventId = t.eventId || metadata.eventId || null;
            const eventTitle = t.event?.title || (eventId ? eventTitleMap.get(eventId) : undefined) || "Unknown Event";
            const customer = t.purchase?.user?.profile?.fullName || t.purchase?.user?.phoneNumber || "System";
            const paymentMethod = t.purchase?.paymentMethod || metadata.paymentMethod || "CHAPA";
            const channel = metadata?.promoCodeId
                ? "Promo"
                : (metadata?.referralCode || metadata?.referralId)
                    ? "Referral"
                    : "Direct";
            const status = t.purchase?.status === "SUCCESS"
                ? "Completed"
                : t.purchase?.status === "FAILED"
                    ? "Failed"
                    : t.status === "RELEASED"
                        ? "Completed"
                        : "Processing";
            return {
                id: `#ORD-${t.id}`,
                eventId,
                eventTitle,
                customer,
                date: t.createdAt,
                amount: Number(t.amount),
                paymentMethod,
                channel,
                status
            };
        });
        const channelMap = new Map();
        salesTable.forEach(row => {
            if (!channelMap.has(row.channel)) {
                channelMap.set(row.channel, { revenue: 0, count: 0 });
            }
            const entry = channelMap.get(row.channel);
            entry.revenue += row.amount;
            entry.count += 1;
        });
        const salesByChannel = Array.from(channelMap.entries()).map(([name, data]) => ({
            name,
            revenue: data.revenue,
            count: data.count
        }));
        const totalCapacity = events.reduce((sum, event) => {
            return sum + event.tiers.reduce((tSum, tier) => tSum + tier.capacity, 0);
        }, 0);
        const conversionRate = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0;
        const failedPurchases = await prisma_1.prisma.purchase.findMany({
            where: { status: { in: ["FAILED", "CANCELLED"] } },
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        const failedPayments = failedPurchases
            .map(p => {
            const metadata = (p.metadata || {});
            const eventId = metadata.eventId;
            const eventTitle = eventId ? eventTitleMap.get(eventId) : undefined;
            return {
                id: `#PAY-${p.id}`,
                eventId: eventId || null,
                eventTitle: eventTitle || "Unknown Event",
                customer: p.user?.profile?.fullName || p.user?.phoneNumber || "System",
                date: p.createdAt,
                amount: Number(p.totalAmount),
                paymentMethod: p.paymentMethod || "CHAPA",
                reason: p.failureReason || p.status,
                status: p.status
            };
        })
            .filter(p => (p.eventId ? organizerEventIds.has(p.eventId) : false));
        const result = {
            totalRevenue,
            grossSales: Number(grossSales._sum.amount || 0),
            totalPayouts: Number(wallet?.totalWithdrawn || 0),
            processingFees: Number(totalFees._sum.amount || 0),
            availableBalance: Number(wallet?.availableBalance || 0),
            ticketsSold: totalTicketsSold,
            conversionRate,
            averageTicketPrice,
            salesTrend,
            revenueByTicketType,
            topEvents,
            transactions: transactions.map(t => ({
                id: `#ORD-${t.id}`,
                name: t.purchase?.user?.profile?.fullName || t.purchase?.user?.phoneNumber || "System",
                date: t.createdAt,
                amount: Number(t.amount),
                status: t.status === "RELEASED" ? "Completed" : "Processing"
            })),
            salesTable,
            salesByChannel,
            failedPayments
        };
        try {
            await redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        }
        catch (e) {
            console.error("Redis set error:", e);
        }
        return result;
    }
    /**
     * Gets ticket tier performance across all events.
     */
    static async getOrganizerTicketStats(organizerId) {
        const events = await prisma_1.prisma.event.findMany({
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
        const allTiers = events.flatMap(e => e.tiers.map((t) => ({
            eventId: e.id,
            tierId: t.id,
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
            checkedIn: await prisma_1.prisma.ticket.count({
                where: { event: { organizerId }, status: "USED" }
            }),
            reserved: await prisma_1.prisma.ticket.count({
                where: { event: { organizerId }, status: "VALID" } // Valid but not used
            })
        };
    }
}
exports.EventOperationsService = EventOperationsService;
EventOperationsService.CACHE_TTL = 60; // 1 minute cache for dashboard metrics
