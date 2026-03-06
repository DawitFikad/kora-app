import { prisma } from "../lib/prisma";
import { EventStatus, EventType, Role } from "@prisma/client";

export class EventService {
    // --- Organizers: Event Management ---

    static async createEvent(organizerId: number, data: {
        title: string;
        description?: string;
        venue: string;
        dateTime: Date;
        eventType: EventType;
        totalCapacity?: number;
        categoryId: number;
        subCategoryId?: number;
        cityId: number;
        coverImage?: string;
        gallery?: string[];
        tiers: { name: string; price: number; capacity: number }[];
    }) {
        // Enforce Organizer Approval
        const organizer = await prisma.organizerProfile.findUnique({
            where: { id: organizerId }
        });

        if (!organizer || organizer.status !== "APPROVED") {
            throw new Error("Organizer is not approved to create events.");
        }

        const { tiers, ...eventData } = data;

        const event = await prisma.event.create({
            data: {
                ...eventData,
                organizerId,
                status: EventStatus.APPROVED, // Auto-approve for development (change to PENDING for production)
                tiers: {
                    create: tiers
                }
            },
            include: {
                tiers: true,
                category: true,
                subCategory: true,
                city: true
            }
        });

        return event;
    }

    static async updateEvent(id: number, organizerId: number, data: any) {
        const event = await prisma.event.findUnique({
            where: { id },
            include: { organizer: true }
        });

        if (!event || event.organizerId !== organizerId) {
            throw new Error("Event not found or unauthorized");
        }

        const oldStatus = event.status;
        const reReview = event.status === EventStatus.APPROVED;

        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                ...data,
                status: reReview ? EventStatus.PENDING : event.status
            }
        });

        // Notify Ticket Holders if Critical Details changed or Cancelled
        // Note: For 'reReview', we might not notify yet until approved/rejected. 
        // But if organizer explicitly CANCELS (if we allowed that transition via update), we should notify.

        // Check if critical info changed while it was APPROVED or if event was CANCELLED
        if (oldStatus === EventStatus.APPROVED || data.status === EventStatus.CANCELLED) {
            const dateChanged = data.dateTime && new Date(data.dateTime).getTime() !== new Date(event.dateTime).getTime();
            const venueChanged = data.venue && data.venue !== event.venue;
            const cancelled = data.status === EventStatus.CANCELLED && oldStatus !== EventStatus.CANCELLED;

            if (cancelled) {
                const { TicketStatus } = await import("@prisma/client");
                await prisma.ticket.updateMany({
                    where: { eventId: id, status: TicketStatus.VALID },
                    data: { status: TicketStatus.CANCELLED }
                });

                await EventService.notifyTicketHolders(id, "Event Cancelled",
                    `We regret to inform you that "${event.title}" has been cancelled. Please check the app for refund details.`
                );
            } else if (dateChanged || venueChanged) {
                await EventService.notifyTicketHolders(id, "Event Update",
                    `Important update for ${event.title}: The event ` +
                    (dateChanged ? `date has been moved to ${new Date(data.dateTime).toDateString()} ` : "") +
                    (venueChanged ? `venue has changed to ${data.venue}` : "")
                );
            }
        }

        return updatedEvent;
    }

    static async notifyTicketHolders(eventId: number, title: string, content: string) {
        try {
            const { NotificationService } = require("./notification.service");
            const { NotificationChannel } = require("@prisma/client");

            // Find all users with valid tickets for this event
            const tickets = await prisma.ticket.findMany({
                where: { eventId, status: "VALID" },
                select: { userId: true },
                distinct: ['userId']
            });

            for (const ticket of tickets) {
                await NotificationService.notifyUser(ticket.userId, {
                    title,
                    content,
                    channels: [NotificationChannel.SMS] // In real app, prefer Push/Email
                });
            }
        } catch (error) {
            console.error(`Failed to notify ticket holders for event ${eventId}:`, error);
        }
    }

    /**
     * Called by Cron Job every hour
     */
    static async sendReminders() {
        // Find events starting in the next 24 hours
        const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const now = new Date();

        const events = await prisma.event.findMany({
            where: {
                dateTime: {
                    gte: now,
                    lte: next24Hours
                },
                status: EventStatus.APPROVED
            }
        });

        for (const event of events) {
            // Check if we already sent reminder (Optimization: Use a flag or Redis)
            // For now, simple logic: just send
            await EventService.notifyTicketHolders(
                event.id,
                "Event Reminder",
                `Reminder: ${event.title} is happening tomorrow at ${event.venue}!`
            );
        }
    }

    // --- Users: Discovery ---

    static async listEvents(filters: {
        categoryId?: number;
        cityId?: number;
        search?: string;
        featured?: boolean;
    }) {
        const { categoryId, cityId, search, featured } = filters;

        return prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                categoryId: categoryId ? parseInt(categoryId as any) : undefined,
                cityId: cityId ? parseInt(cityId as any) : undefined,
                featured: featured ? true : undefined,
                OR: search ? [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { venue: { contains: search, mode: "insensitive" } }
                ] : undefined
            } as any,
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: {
                    select: { organizationName: true }
                }
            },
            orderBy: { dateTime: 'asc' }
        });
    }

    static async listRecommendedMovies(params: {
        userId?: number;
        cityId?: number;
        limit?: number;
    }) {
        const { userId, cityId, limit = 12 } = params;
        const now = new Date();

        const movieCategory = await prisma.mainCategory.findFirst({
            where: { slug: 'movies' },
            select: { id: true }
        });

        const bookingHistory = userId
            ? await prisma.ticket.findMany({
                where: { userId },
                select: {
                    event: {
                        select: {
                            id: true,
                            categoryId: true,
                            cityId: true,
                            isMovie: true,
                            category: { select: { slug: true, name: true } }
                        }
                    }
                }
            })
            : [];

        const preferredCityFromHistory = bookingHistory
            .map((t) => t.event?.cityId)
            .filter((id): id is number => typeof id === 'number')
            .reduce<Record<number, number>>((acc, id) => {
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {});

        const preferredCityId = cityId || Number(
            Object.entries(preferredCityFromHistory)
                .sort((a, b) => b[1] - a[1])[0]?.[0]
        ) || undefined;

        const preferredMovieCategoryIds = new Set<number>();
        for (const ticket of bookingHistory) {
            const e = ticket.event;
            if (!e) continue;
            if (e.isMovie || e.category?.slug === 'movies' || e.category?.name?.toLowerCase() === 'movies') {
                preferredMovieCategoryIds.add(e.categoryId);
            }
        }

        const keywordFilter = {
            OR: [
                { title: { contains: 'premiere', mode: 'insensitive' as const } },
                { title: { contains: 'festival', mode: 'insensitive' as const } },
                { description: { contains: 'premiere', mode: 'insensitive' as const } },
                { description: { contains: 'festival', mode: 'insensitive' as const } }
            ]
        };

        const whereBase: any = {
            status: EventStatus.APPROVED,
            isPublic: true,
            dateTime: { gte: now },
            OR: [
                { isMovie: true },
                movieCategory ? { categoryId: movieCategory.id } : undefined,
                keywordFilter
            ].filter(Boolean)
        };

        if (preferredCityId) {
            whereBase.cityId = preferredCityId;
        }

        const upcomingMovies = await prisma.event.findMany({
            where: whereBase,
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: {
                    select: { organizationName: true }
                }
            },
            orderBy: [
                { featured: 'desc' },
                { dateTime: 'asc' },
                { createdAt: 'desc' }
            ],
            take: 50
        });

        const ranked = upcomingMovies
            .map((event) => {
                let score = 0;

                if (event.featured) score += 20;
                if (event.rating) score += 15;
                if (preferredCityId && event.cityId === preferredCityId) score += 25;
                if (preferredMovieCategoryIds.has(event.categoryId)) score += 20;

                const lowerTitle = event.title.toLowerCase();
                const lowerDesc = (event.description || '').toLowerCase();
                if (lowerTitle.includes('premiere') || lowerDesc.includes('premiere')) score += 10;
                if (lowerTitle.includes('festival') || lowerDesc.includes('festival')) score += 10;

                const daysAway = (new Date(event.dateTime).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                if (daysAway <= 14) score += 8; // prioritize near-term new releases

                return { event, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((x) => x.event);

        return ranked;
    }

    static async listBestEventsThisWeek(params: {
        cityId?: number;
        limit?: number;
    }) {
        const { cityId, limit = 12 } = params;
        const now = new Date();
        const next7Days = new Date(now);
        next7Days.setDate(now.getDate() + 7);
        next7Days.setHours(23, 59, 59, 999);

        const targetCategorySlugs = ['music', 'comedy', 'workshops-classes', 'cultural'];
        const targetCategories = await prisma.mainCategory.findMany({
            where: { slug: { in: targetCategorySlugs } },
            select: { id: true }
        });
        const categoryIds = targetCategories.map((c) => c.id);

        const weeklyEvents = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                dateTime: { gte: now, lte: next7Days },
                cityId: cityId || undefined,
                OR: [
                    categoryIds.length ? { categoryId: { in: categoryIds } } : undefined,
                    { title: { contains: 'concert', mode: 'insensitive' } },
                    { title: { contains: 'comedy', mode: 'insensitive' } },
                    { title: { contains: 'festival', mode: 'insensitive' } },
                    { title: { contains: 'workshop', mode: 'insensitive' } },
                    { description: { contains: 'concert', mode: 'insensitive' } },
                    { description: { contains: 'comedy', mode: 'insensitive' } },
                    { description: { contains: 'festival', mode: 'insensitive' } },
                    { description: { contains: 'workshop', mode: 'insensitive' } }
                ].filter(Boolean) as any
            },
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: { select: { organizationName: true } }
            },
            orderBy: [
                { featured: 'desc' },
                { dateTime: 'asc' }
            ],
            take: 80
        });

        if (!weeklyEvents.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: weeklyEvents.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        const ranked = weeklyEvents
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                let score = 0;
                score += event.featured ? 25 : 0;
                score += Math.min(sold, 40);

                const title = event.title.toLowerCase();
                const desc = (event.description || '').toLowerCase();
                if (title.includes('concert') || desc.includes('concert')) score += 8;
                if (title.includes('comedy') || desc.includes('comedy')) score += 8;
                if (title.includes('festival') || desc.includes('festival')) score += 8;
                if (title.includes('workshop') || desc.includes('workshop')) score += 8;

                return {
                    ...event,
                    popularityScore: score,
                    ticketsAvailable
                };
            })
            .sort((a, b) => b.popularityScore - a.popularityScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);

        return ranked;
    }

    static async listTrendingNow(params: {
        limit?: number;
    }) {
        const { limit = 12 } = params;
        const now = new Date();
        const next30Days = new Date(now);
        next30Days.setDate(now.getDate() + 30);
        next30Days.setHours(23, 59, 59, 999);

        const trendingEvents = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                dateTime: { gte: now, lte: next30Days },
                OR: [
                    { featured: true },
                    { title: { contains: 'tiktok', mode: 'insensitive' } },
                    { title: { contains: 'leza', mode: 'insensitive' } },
                    { title: { contains: 'influencer', mode: 'insensitive' } },
                    { title: { contains: 'awards', mode: 'insensitive' } },
                    { title: { contains: 'concert', mode: 'insensitive' } },
                    { title: { contains: 'meetup', mode: 'insensitive' } },
                    { title: { contains: 'livestream', mode: 'insensitive' } },
                    { description: { contains: 'viral', mode: 'insensitive' } },
                    { description: { contains: 'hot', mode: 'insensitive' } },
                    { description: { contains: 'trending', mode: 'insensitive' } },
                    { description: { contains: 'popular', mode: 'insensitive' } },
                ]
            },
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: { select: { organizationName: true } }
            },
            orderBy: [
                { featured: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 100
        });

        if (!trendingEvents.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: trendingEvents.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        const ranked = trendingEvents
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                const title = event.title.toLowerCase();
                const desc = (event.description || '').toLowerCase();
                let score = 0;

                score += event.featured ? 25 : 0;
                score += Math.min(sold, 50);

                if (title.includes('tiktok') || desc.includes('tiktok')) score += 14;
                if (title.includes('leza') || desc.includes('leza')) score += 14;
                if (title.includes('influencer') || desc.includes('influencer')) score += 12;
                if (title.includes('awards') || desc.includes('awards')) score += 10;
                if (title.includes('concert') || desc.includes('concert')) score += 10;
                if (title.includes('livestream') || desc.includes('livestream')) score += 9;
                if (title.includes('viral') || desc.includes('viral')) score += 8;
                if (title.includes('trending') || desc.includes('trending')) score += 8;

                return {
                    ...event,
                    popularityScore: score,
                    ticketsAvailable,
                };
            })
            .sort((a, b) => b.popularityScore - a.popularityScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);

        return ranked;
    }

    static async listPersonalizedPicks(params: {
        userId?: number;
        cityId?: number;
        limit?: number;
    }) {
        const { userId, cityId, limit = 12 } = params;
        const now = new Date();
        const next45Days = new Date(now);
        next45Days.setDate(now.getDate() + 45);
        next45Days.setHours(23, 59, 59, 999);

        const preferredSlugs = ['music', 'comedy', 'movies', 'workshops-classes', 'tours-travel'];
        const preferredCategories = await prisma.mainCategory.findMany({
            where: { slug: { in: preferredSlugs } },
            select: { id: true, slug: true }
        });

        const bookingHistory = userId
            ? await prisma.ticket.findMany({
                where: { userId },
                select: {
                    event: {
                        select: { id: true, categoryId: true, cityId: true }
                    }
                }
            })
            : [];

        const preferredCategoryCount = bookingHistory.reduce<Record<number, number>>((acc, t) => {
            const cid = t.event?.categoryId;
            if (typeof cid === 'number') acc[cid] = (acc[cid] || 0) + 1;
            return acc;
        }, {});

        const preferredCityId = cityId || Number(
            Object.entries(
                bookingHistory.reduce<Record<number, number>>((acc, t) => {
                    const c = t.event?.cityId;
                    if (typeof c === 'number') acc[c] = (acc[c] || 0) + 1;
                    return acc;
                }, {})
            ).sort((a, b) => b[1] - a[1])[0]?.[0]
        ) || undefined;

        const preferredCategoryIds = new Set<number>([
            ...preferredCategories.map((c) => c.id),
            ...Object.keys(preferredCategoryCount).map((k) => Number(k))
        ]);

        const events = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                dateTime: { gte: now, lte: next45Days },
                cityId: preferredCityId || undefined,
            },
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: { select: { organizationName: true } }
            },
            orderBy: [
                { featured: 'desc' },
                { dateTime: 'asc' }
            ],
            take: 120
        });

        if (!events.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: events.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        const ranked = events
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                const isPreferredCategory = preferredCategoryIds.has(event.categoryId);
                const isExplorationPick = !isPreferredCategory;

                let score = 0;
                score += event.featured ? 16 : 0;
                score += Math.min(sold, 25);
                if (isPreferredCategory) score += 28;
                if (preferredCityId && event.cityId === preferredCityId) score += 10;
                if (event.isMovie) score += 8;

                return {
                    ...event,
                    ticketsAvailable,
                    isExplorationPick,
                    personalizedTag: isPreferredCategory ? 'Based on your interests' : 'Explore something new',
                    popularityScore: score,
                };
            })
            .sort((a, b) => b.popularityScore - a.popularityScore || +new Date(a.dateTime) - +new Date(b.dateTime));

        // Ensure at least some exploration items are present
        const preferred = ranked.filter((e) => !e.isExplorationPick).slice(0, Math.ceil(limit * 0.7));
        const explore = ranked.filter((e) => e.isExplorationPick).slice(0, Math.max(1, limit - preferred.length));
        return [...preferred, ...explore].slice(0, limit);
    }

    static async listUpcomingAwards(params: {
        cityId?: number;
        limit?: number;
    }) {
        const { cityId, limit = 12 } = params;
        const now = new Date();
        const next90Days = new Date(now);
        next90Days.setDate(now.getDate() + 90);
        next90Days.setHours(23, 59, 59, 999);

        const awardCategorySlugs = [
            'awards-recognition',
            'film-tv-awards',
            'music-arts-awards',
            'social-media-digital-awards',
            'sports-recognition-awards',
            'business-innovation-awards',
        ];

        const awardCategories = await prisma.mainCategory.findMany({
            where: { slug: { in: awardCategorySlugs } },
            select: { id: true }
        });
        const awardCategoryIds = awardCategories.map((c) => c.id);

        const awards = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                dateTime: { gte: now, lte: next90Days },
                cityId: cityId || undefined,
                OR: [
                    awardCategoryIds.length ? { categoryId: { in: awardCategoryIds } } : undefined,
                    { title: { contains: 'award', mode: 'insensitive' } },
                    { title: { contains: 'nominee', mode: 'insensitive' } },
                    { title: { contains: 'winner', mode: 'insensitive' } },
                    { title: { contains: 'livestream', mode: 'insensitive' } },
                    { description: { contains: 'award', mode: 'insensitive' } },
                    { description: { contains: 'nominee', mode: 'insensitive' } },
                    { description: { contains: 'winner', mode: 'insensitive' } },
                    { description: { contains: 'livestream', mode: 'insensitive' } },
                ].filter(Boolean) as any
            },
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: { select: { organizationName: true } }
            },
            orderBy: [
                { featured: 'desc' },
                { dateTime: 'asc' }
            ],
            take: 120
        });

        if (!awards.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: awards.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        return awards
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                const text = `${event.title} ${event.description || ''}`.toLowerCase();
                const livestreamAvailable = text.includes('livestream') || text.includes('live stream') || text.includes('virtual') || text.includes('online');
                const nomineesInfoAvailable = text.includes('nominee') || text.includes('shortlist') || text.includes('finalist');
                const winnersInfoAvailable = text.includes('winner') || text.includes('winners') || text.includes('results');

                return {
                    ...event,
                    ticketsAvailable,
                    livestreamAvailable,
                    nomineesInfoAvailable,
                    winnersInfoAvailable,
                };
            })
            .sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async getEventDetails(id: number) {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: true
            }
        });

        if (!event || (event.status !== EventStatus.APPROVED)) {
            // Organizer can still view their own PENDING event (controller logic handles this)
            return event;
        }

        return event;
    }

    // --- Admin: Moderation ---

    static async adminListEvents() {
        return prisma.event.findMany({
            include: {
                category: true,
                city: true,
                organizer: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async reviewEvent(eventId: number, status: EventStatus, feeType: string, feeFixed: number, feePercentage: number, adminNote?: string) {
        const event = await prisma.event.update({
            where: { id: eventId },
            data: {
                status,
                adminNote: adminNote || null,
                feeType: feeType || null,
                feeFixed: feeFixed !== undefined ? feeFixed : null,
                feePercentage: feePercentage !== undefined ? feePercentage : null
            },
            include: { organizer: true }
        });

        // Notify Organizer (Async)
        (async () => {
            try {
                const { NotificationService } = require("./notification.service");
                const { NotificationChannel } = require("@prisma/client");

                const title = status === EventStatus.APPROVED ? "Event Approved! 🎉" :
                    status === EventStatus.REJECTED ? "Event Rejected ⚠️" : "Event Status Updated";

                const content = status === EventStatus.APPROVED
                    ? `Your event "${event.title}" has been approved and is now live!${adminNote ? ' Note: ' + adminNote : ''}`
                    : `Your event "${event.title}" has been rejected.${adminNote ? ' Reason: ' + adminNote : ' Please contact support for details.'}`;

                await NotificationService.notifyOrganizer(event.organizerId, {
                    title,
                    content,
                    channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                    metadata: { type: 'EVENT_STATUS', eventId, status, adminNote }
                });
            } catch (e) {
                console.error("Failed to notify organizer of event review:", e);
            }
        })();

        return event;
    }

    // --- Meta Data ---

    static async getCategories() {
        return prisma.mainCategory.findMany({ include: { subCategories: true } });
    }

    static async getCities() {
        return prisma.city.findMany();
    }
}
