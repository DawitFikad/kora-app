"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class EventService {
    // --- Organizers: Event Management ---
    static async createEvent(organizerId, data) {
        // Enforce Organizer Approval
        const organizer = await prisma_1.prisma.organizerProfile.findUnique({
            where: { id: organizerId }
        });
        if (!organizer || organizer.status !== "APPROVED") {
            throw new Error("Organizer is not approved to create events.");
        }
        const { tiers, ...eventData } = data;
        const event = await prisma_1.prisma.event.create({
            data: {
                ...eventData,
                organizerId,
                status: client_1.EventStatus.APPROVED, // Auto-approve for development (change to PENDING for production)
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
    static async updateEvent(id, organizerId, data) {
        const event = await prisma_1.prisma.event.findUnique({
            where: { id },
            include: { organizer: true }
        });
        if (!event || event.organizerId !== organizerId) {
            throw new Error("Event not found or unauthorized");
        }
        const oldStatus = event.status;
        const reReview = event.status === client_1.EventStatus.APPROVED;
        const updatedEvent = await prisma_1.prisma.event.update({
            where: { id },
            data: {
                ...data,
                status: reReview ? client_1.EventStatus.PENDING : event.status
            }
        });
        // Notify Ticket Holders if Critical Details changed or Cancelled
        // Note: For 'reReview', we might not notify yet until approved/rejected. 
        // But if organizer explicitly CANCELS (if we allowed that transition via update), we should notify.
        // Check if critical info changed while it was APPROVED or if event was CANCELLED
        if (oldStatus === client_1.EventStatus.APPROVED || data.status === client_1.EventStatus.CANCELLED) {
            const dateChanged = data.dateTime && new Date(data.dateTime).getTime() !== new Date(event.dateTime).getTime();
            const venueChanged = data.venue && data.venue !== event.venue;
            const cancelled = data.status === client_1.EventStatus.CANCELLED && oldStatus !== client_1.EventStatus.CANCELLED;
            if (cancelled) {
                const { TicketStatus } = await Promise.resolve().then(() => __importStar(require("@prisma/client")));
                await prisma_1.prisma.ticket.updateMany({
                    where: { eventId: id, status: TicketStatus.VALID },
                    data: { status: TicketStatus.CANCELLED }
                });
                await EventService.notifyTicketHolders(id, "Event Cancelled", `We regret to inform you that "${event.title}" has been cancelled. Please check the app for refund details.`);
            }
            else if (dateChanged || venueChanged) {
                await EventService.notifyTicketHolders(id, "Event Update", `Important update for ${event.title}: The event ` +
                    (dateChanged ? `date has been moved to ${new Date(data.dateTime).toDateString()} ` : "") +
                    (venueChanged ? `venue has changed to ${data.venue}` : ""));
            }
        }
        return updatedEvent;
    }
    static async notifyTicketHolders(eventId, title, content) {
        try {
            const { NotificationService } = require("./notification.service");
            const { NotificationChannel } = require("@prisma/client");
            // Find all users with valid tickets for this event
            const tickets = await prisma_1.prisma.ticket.findMany({
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
        }
        catch (error) {
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
        const events = await prisma_1.prisma.event.findMany({
            where: {
                dateTime: {
                    gte: now,
                    lte: next24Hours
                },
                status: client_1.EventStatus.APPROVED
            }
        });
        for (const event of events) {
            // Check if we already sent reminder (Optimization: Use a flag or Redis)
            // For now, simple logic: just send
            await EventService.notifyTicketHolders(event.id, "Event Reminder", `Reminder: ${event.title} is happening tomorrow at ${event.venue}!`);
        }
    }
    // --- Users: Discovery ---
    static async listEvents(filters) {
        const { categoryId, cityId, search, featured } = filters;
        return prisma_1.prisma.event.findMany({
            where: {
                status: client_1.EventStatus.APPROVED,
                categoryId: categoryId ? parseInt(categoryId) : undefined,
                cityId: cityId ? parseInt(cityId) : undefined,
                featured: featured ? true : undefined,
                OR: search ? [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { venue: { contains: search, mode: "insensitive" } }
                ] : undefined
            },
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
    static async getEventDetails(id) {
        const event = await prisma_1.prisma.event.findUnique({
            where: { id },
            include: {
                category: true,
                subCategory: true,
                city: true,
                tiers: true,
                organizer: true
            }
        });
        if (!event || (event.status !== client_1.EventStatus.APPROVED)) {
            // Organizer can still view their own PENDING event (controller logic handles this)
            return event;
        }
        return event;
    }
    // --- Admin: Moderation ---
    static async adminListEvents() {
        return prisma_1.prisma.event.findMany({
            include: {
                category: true,
                city: true,
                organizer: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async reviewEvent(eventId, status, feeType, feeFixed, feePercentage, adminNote) {
        const event = await prisma_1.prisma.event.update({
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
                const title = status === client_1.EventStatus.APPROVED ? "Event Approved! 🎉" :
                    status === client_1.EventStatus.REJECTED ? "Event Rejected ⚠️" : "Event Status Updated";
                const content = status === client_1.EventStatus.APPROVED
                    ? `Your event "${event.title}" has been approved and is now live!${adminNote ? ' Note: ' + adminNote : ''}`
                    : `Your event "${event.title}" has been rejected.${adminNote ? ' Reason: ' + adminNote : ' Please contact support for details.'}`;
                await NotificationService.notifyOrganizer(event.organizerId, {
                    title,
                    content,
                    channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                    metadata: { type: 'EVENT_STATUS', eventId, status, adminNote }
                });
            }
            catch (e) {
                console.error("Failed to notify organizer of event review:", e);
            }
        })();
        return event;
    }
    // --- Meta Data ---
    static async getCategories() {
        return prisma_1.prisma.mainCategory.findMany({ include: { subCategories: true } });
    }
    static async getCities() {
        return prisma_1.prisma.city.findMany();
    }
}
exports.EventService = EventService;
