import { prisma } from "../lib/prisma";
import { EventStatus, EventType, Role, TicketTierType } from "@prisma/client";
import { EmailService } from "./email.service";

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

        const { NotificationService } = require("./notification.service");
        const { NotificationChannel } = require("@prisma/client");
        const prismaAny = prisma as any;

        for (const event of events) {
            const [ticketUsers, reminderSubscribers] = await Promise.all([
                prisma.ticket.findMany({
                    where: { eventId: event.id, status: "VALID" },
                    select: { userId: true },
                    distinct: ["userId"],
                }),
                prismaAny.eventReminderSubscription.findMany({
                    where: { eventId: event.id },
                    select: { userId: true },
                    distinct: ["userId"],
                }),
            ]);

            const userIds = new Set<number>([
                ...ticketUsers.map((t: { userId: number }) => t.userId),
                ...reminderSubscribers.map((s: { userId: number }) => s.userId),
            ]);

            for (const userId of userIds) {
                await NotificationService.notifyUser(userId, {
                    title: "Event Reminder",
                    content: `Reminder: ${event.title} is happening tomorrow at ${event.venue}!`,
                    channels: [NotificationChannel.SMS],
                    metadata: { eventId: event.id, type: "EVENT_REMINDER" },
                });
            }
        }
    }

    static async preRegisterForEvent(eventId: number, userId: number) {
        const prismaAny = prisma as any;
        const now = new Date();
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, dateTime: true, status: true, isPublic: true },
        });

        if (!event || event.status !== EventStatus.APPROVED || !event.isPublic) {
            throw new Error("Event not available for pre-registration");
        }

        if (+new Date(event.dateTime) <= +now) {
            throw new Error("Cannot pre-register for past events");
        }

        await prismaAny.eventPreRegistration.createMany({
            data: [{ eventId, userId }],
            skipDuplicates: true,
        });

        return { success: true, eventId, userId };
    }

    static async subscribeEventReminder(eventId: number, userId: number) {
        const prismaAny = prisma as any;
        const now = new Date();
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, dateTime: true, status: true, isPublic: true },
        });

        if (!event || event.status !== EventStatus.APPROVED || !event.isPublic) {
            throw new Error("Event not available for reminders");
        }

        if (+new Date(event.dateTime) <= +now) {
            throw new Error("Cannot subscribe reminder for past events");
        }

        await prismaAny.eventReminderSubscription.createMany({
            data: [{ eventId, userId }],
            skipDuplicates: true,
        });

        return { success: true, eventId, userId };
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

        const whereBase: any = {
            status: EventStatus.APPROVED,
            isPublic: true,
            dateTime: { gte: now },
            OR: [
                { isMovie: true },
                movieCategory ? { categoryId: movieCategory.id } : undefined,
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
                if (categoryIds.includes(event.categoryId)) score += 12;

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

        const eventIds = trendingEvents.map((e) => e.id);

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: eventIds },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        const likeCounts = await prisma.eventLike.groupBy({
            by: ['eventId'],
            where: { eventId: { in: eventIds } },
            _count: { eventId: true },
        });
        const likesByEventId = new Map<number, number>(
            likeCounts.map((row) => [row.eventId, row._count.eventId])
        );

        const ratingAgg = await prisma.eventRating.groupBy({
            by: ['eventId'],
            where: { eventId: { in: eventIds } },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const ratingsByEventId = new Map<number, { avg: number; count: number }>(
            ratingAgg.map((row) => [
                row.eventId,
                {
                    avg: row._avg.rating ? Number(row._avg.rating) : 0,
                    count: row._count.rating,
                },
            ])
        );

        const ranked = trendingEvents
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const likes = likesByEventId.get(event.id) || 0;
                const rating = ratingsByEventId.get(event.id) || { avg: 0, count: 0 };
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                let score = 0;
                score += event.featured ? 25 : 0;
                score += Math.min(sold, 50);
                score += Math.min(likes * 2, 30);
                score += Math.min(rating.count, 25);
                score += Math.round(rating.avg * 3);

                return {
                    ...event,
                    popularityScore: score,
                    ticketsAvailable,
                    likesCount: likes,
                    averageRating: Number(rating.avg.toFixed(2)),
                    ratingsCount: rating.count,
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
                categoryId: awardCategoryIds.length ? { in: awardCategoryIds } : undefined,
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

                return {
                    ...event,
                    ticketsAvailable,
                };
            })
            .sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async listWorkshopsShortCourses(params: {
        cityId?: number;
        limit?: number;
    }) {
        const { cityId, limit = 12 } = params;
        const now = new Date();
        const next60Days = new Date(now);
        next60Days.setDate(now.getDate() + 60);
        next60Days.setHours(23, 59, 59, 999);

        const workshopSlugs = ['workshops-classes', 'education-learning'];

        const workshopCategories = await prisma.mainCategory.findMany({
            where: { slug: { in: workshopSlugs } },
            select: { id: true }
        });
        const workshopCategoryIds = workshopCategories.map((c) => c.id);

        const workshops = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                dateTime: { gte: now, lte: next60Days },
                cityId: cityId || undefined,
                categoryId: workshopCategoryIds.length ? { in: workshopCategoryIds } : undefined,
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

        if (!workshops.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: workshops.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        return workshops
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                const text = `${event.title} ${event.description || ''}`.toLowerCase();
                let score = 0;
                score += event.featured ? 18 : 0;
                score += Math.min(sold, 20);
                if (workshopCategoryIds.includes(event.categoryId)) score += 16;
                if (ticketsAvailable != null && ticketsAvailable > 0 && ticketsAvailable <= 30) score += 8;

                return {
                    ...event,
                    ticketsAvailable,
                    popularityScore: score,
                };
            })
            .sort((a, b) => b.popularityScore - a.popularityScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async listCitySpotlight(params: {
        cityId?: number;
        limit?: number;
    }) {
        const { cityId, limit = 12 } = params;
        const now = new Date();
        const next45Days = new Date(now);
        next45Days.setDate(now.getDate() + 45);
        next45Days.setHours(23, 59, 59, 999);

        const spotlightCategorySlugs = ['music', 'cultural', 'workshops-classes', 'nightlife'];
        const spotlightCategories = await prisma.mainCategory.findMany({
            where: { slug: { in: spotlightCategorySlugs } },
            select: { id: true }
        });
        const spotlightCategoryIds = spotlightCategories.map((c) => c.id);

        let resolvedCityId = cityId;
        if (!resolvedCityId) {
            const priorityCities = ['addis-ababa', 'bahir-dar', 'hawassa', 'mekelle'];
            for (const slug of priorityCities) {
                const city = await prisma.city.findFirst({ where: { slug }, select: { id: true } });
                if (!city) continue;
                const count = await prisma.event.count({
                    where: {
                        status: EventStatus.APPROVED,
                        isPublic: true,
                        cityId: city.id,
                        dateTime: { gte: now, lte: next45Days }
                    }
                });
                if (count > 0) {
                    resolvedCityId = city.id;
                    break;
                }
            }
        }

        const spotlight = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                cityId: resolvedCityId || undefined,
                dateTime: { gte: now, lte: next45Days },
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

        if (!spotlight.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: spotlight.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        return spotlight
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;
                return {
                    ...event,
                    ticketsAvailable,
                    popularityScore: (event.featured ? 18 : 0) + (spotlightCategoryIds.includes(event.categoryId) ? 10 : 0) + Math.min(sold, 30),
                };
            })
            .sort((a, b) => b.popularityScore - a.popularityScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async listLastMinuteTodayEvents(params: {
        cityId?: number;
        limit?: number;
    }) {
        const { cityId, limit = 12 } = params;
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const events = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                cityId: cityId || undefined,
                dateTime: { gte: now, lte: next24Hours },
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

        return events
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;
                const hoursLeft = Math.max(0, Math.round((+new Date(event.dateTime) - now.getTime()) / (60 * 60 * 1000)));

                let urgencyScore = event.featured ? 20 : 0;
                urgencyScore += Math.max(0, 24 - hoursLeft);
                if (ticketsAvailable != null && ticketsAvailable > 0 && ticketsAvailable <= 50) urgencyScore += 10;

                return {
                    ...event,
                    ticketsAvailable,
                    hoursLeft,
                    urgencyScore,
                };
            })
            .sort((a, b) => b.urgencyScore - a.urgencyScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async listOffersDeals(params: {
        cityId?: number;
        limit?: number;
    }) {
        const { cityId, limit = 12 } = params;
        const now = new Date();
        const next60Days = new Date(now);
        next60Days.setDate(now.getDate() + 60);
        next60Days.setHours(23, 59, 59, 999);

        const activePromos = await prisma.promoCode.findMany({
            where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
            },
            select: {
                eventId: true,
                type: true,
                discount: true,
                codeType: true,
            },
        });

        if (!activePromos.length) return [];

        const promoByEventId = new Map<number, { type: string; discount: number; codeType: string }>();
        for (const promo of activePromos) {
            if (!promoByEventId.has(promo.eventId)) {
                promoByEventId.set(promo.eventId, {
                    type: promo.type,
                    discount: Number(promo.discount || 0),
                    codeType: promo.codeType || 'STANDARD',
                });
            }
        }

        const deals = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                cityId: cityId || undefined,
                dateTime: { gte: now, lte: next60Days },
                id: { in: Array.from(promoByEventId.keys()) },
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
            take: 120
        });

        if (!deals.length) return [];

        const soldCounts = await prisma.ticket.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: deals.map((e) => e.id) },
                status: 'VALID'
            },
            _count: { eventId: true }
        });
        const soldByEventId = new Map<number, number>(
            soldCounts.map((row) => [row.eventId, row._count.eventId])
        );

        return deals
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                const promo = promoByEventId.get(event.id);
                const hasBundle = promo?.codeType?.toUpperCase() === 'INFLUENCER';
                const hasPartner = promo?.codeType?.toUpperCase() === 'REFERRAL';
                const hasLimitedTime = event.dateTime.getTime() - now.getTime() <= (7 * 24 * 60 * 60 * 1000);

                let dealTag = 'Special Offer';
                if (promo?.discount) {
                    const discountLabel = promo.type === 'PERCENTAGE'
                        ? `${promo.discount}% OFF`
                        : `${promo.discount} ETB OFF`;
                    dealTag = discountLabel;
                } else if (hasBundle) {
                    dealTag = 'Bundle Deal';
                } else if (hasPartner) {
                    dealTag = 'Partner Exclusive';
                } else if (hasLimitedTime) {
                    dealTag = 'Limited Time';
                }

                let dealScore = event.featured ? 18 : 0;
                dealScore += hasBundle ? 12 : 0;
                dealScore += hasPartner ? 12 : 0;
                dealScore += hasLimitedTime ? 10 : 0;
                dealScore += Math.min(sold, 20);

                return {
                    ...event,
                    ticketsAvailable,
                    dealTag,
                    hasBundle,
                    hasPartner,
                    hasLimitedTime,
                    dealScore,
                };
            })
            .sort((a, b) => b.dealScore - a.dealScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async listNewUpcomingExperiences(params: {
        cityId?: number;
        userId?: number;
        limit?: number;
    }) {
        const { cityId, userId, limit = 12 } = params;
        const prismaAny = prisma as any;
        const now = new Date();
        const upcomingFrom = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const next120Days = new Date(now);
        next120Days.setDate(now.getDate() + 120);
        next120Days.setHours(23, 59, 59, 999);
        const createdSince = new Date(now);
        createdSince.setDate(now.getDate() - 45);

        const focusCategorySlugs = [
            'music',
            'cultural',
            'workshops-classes',
            'awards-recognition',
            'film-tv-awards',
            'music-arts-awards',
        ];

        const categories = await prisma.mainCategory.findMany({
            where: { slug: { in: focusCategorySlugs } },
            select: { id: true }
        });
        const categoryIds = categories.map((c) => c.id);

        const experiences = await prisma.event.findMany({
            where: {
                status: EventStatus.APPROVED,
                isPublic: true,
                cityId: cityId || undefined,
                dateTime: { gte: upcomingFrom, lte: next120Days },
                createdAt: { gte: createdSince },
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
            take: 140
        });

        if (!experiences.length) return [];

        const [soldCounts, tierSoldCounts, preRegistrationCounts, userPreRegs, userReminderSubs] = await Promise.all([
            prisma.ticket.groupBy({
                by: ['eventId'],
                where: {
                    eventId: { in: experiences.map((e) => e.id) },
                    status: 'VALID'
                },
                _count: { eventId: true }
            }),
            prisma.ticket.groupBy({
                by: ['tierId'],
                where: {
                    eventId: { in: experiences.map((e) => e.id) },
                    status: 'VALID',
                },
                _count: { tierId: true }
            }),
            prismaAny.eventPreRegistration.groupBy({
                by: ['eventId'],
                where: {
                    eventId: { in: experiences.map((e) => e.id) },
                },
                _count: { eventId: true }
            }),
            userId
                ? prismaAny.eventPreRegistration.findMany({
                    where: { userId, eventId: { in: experiences.map((e) => e.id) } },
                    select: { eventId: true },
                })
                : Promise.resolve([]),
            userId
                ? prismaAny.eventReminderSubscription.findMany({
                    where: { userId, eventId: { in: experiences.map((e) => e.id) } },
                    select: { eventId: true },
                })
                : Promise.resolve([]),
        ]);

        const soldByEventId = new Map<number, number>(
            soldCounts.map((row: any) => [row.eventId, row._count.eventId])
        );
        const soldByTierId = new Map<number, number>(
            tierSoldCounts
                .filter((row: any) => row.tierId != null)
                .map((row: any) => [Number(row.tierId), row._count.tierId])
        );
        const preRegsByEventId = new Map<number, number>(
            preRegistrationCounts.map((row: any) => [row.eventId, row._count.eventId])
        );
        const userPreRegSet = new Set<number>(userPreRegs.map((row: { eventId: number }) => row.eventId));
        const userReminderSet = new Set<number>(userReminderSubs.map((row: { eventId: number }) => row.eventId));

        return experiences
            .map((event) => {
                const sold = soldByEventId.get(event.id) || 0;
                const capacity = event.totalCapacity || 0;
                const ticketsAvailable = event.totalCapacity != null
                    ? Math.max(capacity - sold, 0)
                    : null;

                const earlyBirdTier = event.tiers.find((tier: any) => tier.type === TicketTierType.EARLY_BIRD);
                const earlyBirdSold = earlyBirdTier ? (soldByTierId.get(earlyBirdTier.id) || 0) : 0;
                const earlyBirdSlotsLeft = earlyBirdTier ? Math.max((earlyBirdTier.capacity || 0) - earlyBirdSold, 0) : 0;

                const preRegCount = preRegsByEventId.get(event.id) || 0;
                const hasPreRegCapacity = event.totalCapacity == null || preRegCount < event.totalCapacity;

                const earlyBirdAvailable = !!earlyBirdTier && earlyBirdSlotsLeft > 0;
                const preRegistrationAvailable = hasPreRegCapacity;
                const reminderAvailable = (+new Date(event.dateTime) - now.getTime()) > 24 * 60 * 60 * 1000;
                const userPreRegistered = userPreRegSet.has(event.id);
                const userReminderSubscribed = userReminderSet.has(event.id);

                let score = 0;
                score += event.featured ? 18 : 0;
                score += earlyBirdAvailable ? 12 : 0;
                score += preRegistrationAvailable ? 10 : 0;
                score += reminderAvailable ? 8 : 0;
                score += Math.min(sold, 20);
                if (categoryIds.includes(event.categoryId)) score += 10;

                return {
                    ...event,
                    ticketsAvailable,
                    earlyBirdAvailable,
                    preRegistrationAvailable,
                    reminderAvailable,
                    userPreRegistered,
                    userReminderSubscribed,
                    popularityScore: score,
                };
            })
            .sort((a, b) => b.popularityScore - a.popularityScore || +new Date(a.dateTime) - +new Date(b.dateTime))
            .slice(0, limit);
    }

    static async getEventEngagement(eventId: number, userId?: number) {
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
        if (!event) throw new Error("Event not found");

        const [likesCount, ratingsAgg, userLike, userRating] = await Promise.all([
            prisma.eventLike.count({ where: { eventId } }),
            prisma.eventRating.aggregate({
                where: { eventId },
                _avg: { rating: true },
                _count: { rating: true },
            }),
            userId ? prisma.eventLike.findUnique({ where: { userId_eventId: { userId, eventId } } }) : null,
            userId ? prisma.eventRating.findUnique({ where: { userId_eventId: { userId, eventId } } }) : null,
        ]);

        return {
            likesCount,
            averageRating: ratingsAgg._avg.rating ? Number(ratingsAgg._avg.rating.toFixed(2)) : 0,
            ratingsCount: ratingsAgg._count.rating,
            userLiked: !!userLike,
            userRating: userRating?.rating ?? null,
            userComment: userRating?.comment ?? null,
        };
    }

    static async toggleLikeEvent(eventId: number, userId: number) {
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
        if (!event) throw new Error("Event not found");

        const existing = await prisma.eventLike.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });

        if (existing) {
            await prisma.eventLike.delete({ where: { id: existing.id } });
        } else {
            await prisma.eventLike.create({ data: { userId, eventId } });
        }

        const likesCount = await prisma.eventLike.count({ where: { eventId } });

        return {
            liked: !existing,
            likesCount,
        };
    }

    static async rateEvent(params: {
        eventId: number;
        userId: number;
        rating: number;
        comment?: string;
    }) {
        const { eventId, userId, rating, comment } = params;

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                dateTime: true,
                venue: true,
            }
        });
        if (!event) throw new Error("Event not found");

        const [upsertedRating] = await prisma.$transaction([
            prisma.eventRating.upsert({
                where: { userId_eventId: { userId, eventId } },
                update: {
                    rating,
                    comment: comment || null,
                },
                create: {
                    userId,
                    eventId,
                    rating,
                    comment: comment || null,
                }
            }),
        ]);

        const agg = await prisma.eventRating.aggregate({
            where: { eventId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0;
        const ratingsCount = agg._count.rating;

        await prisma.event.update({
            where: { id: eventId },
            data: {
                rating: ratingsCount > 0 ? avgRating.toFixed(2) : null,
            }
        });

        // Thank-you email is best effort and should never fail rating flow.
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    email: true,
                    profile: { select: { fullName: true } },
                }
            });

            if (user?.email) {
                const fullName = user.profile?.fullName || "there";
                const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
                const when = new Date(event.dateTime).toLocaleString();

                const subject = `Thank you for rating ${event.title}`;
                const html = `
                    <h2 style="margin-bottom:12px;">Thanks for your rating, ${fullName}!</h2>
                    <p style="margin:0 0 10px 0;">Your feedback helps the ET-Ticket community.</p>
                    <p style="margin:0 0 10px 0;"><strong>Event:</strong> ${event.title}</p>
                    <p style="margin:0 0 10px 0;"><strong>Your Rating:</strong> ${stars} (${rating}/5)</p>
                    <p style="margin:0 0 10px 0;"><strong>When:</strong> ${when}</p>
                    <p style="margin:0;"><strong>Venue:</strong> ${event.venue}</p>
                `;

                await EmailService.sendEmail(
                    user.email,
                    subject,
                    `Thank you for rating ${event.title}. You rated it ${rating}/5.`,
                    html
                );
            }
        } catch (e) {
            console.error("Failed to send thank-you rating email:", e);
        }

        return {
            rating: upsertedRating.rating,
            comment: upsertedRating.comment,
            averageRating: avgRating,
            ratingsCount,
        };
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
