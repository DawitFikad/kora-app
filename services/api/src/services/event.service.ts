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
                city: true,
                tiers: true,
                organizer: {
                    select: { organizationName: true }
                }
            },
            orderBy: { dateTime: 'asc' }
        });
    }

    static async getEventDetails(id: number) {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                category: true,
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

    static async reviewEvent(eventId: number, status: EventStatus, feeType: string, feeFixed: number, feePercentage: number) {
        const event = await prisma.event.update({
            where: { id: eventId },
            data: {
                status,
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
                    ? `Your event "${event.title}" has been approved and is now live!`
                    : `Your event "${event.title}" has been rejected. Please contact support for details.`;

                await NotificationService.notifyOrganizer(event.organizerId, {
                    title,
                    content,
                    channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                    metadata: { type: 'EVENT_STATUS', eventId, status }
                });
            } catch (e) {
                console.error("Failed to notify organizer of event review:", e);
            }
        })();

        return event;
    }

    // --- Meta Data ---

    static async getCategories() {
        return prisma.category.findMany();
    }

    static async getCities() {
        return prisma.city.findMany();
    }
}
