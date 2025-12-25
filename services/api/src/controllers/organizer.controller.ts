import { Request, Response } from "express";
import { EventOperationsService } from "../services/event-operations.service";

export class OrganizerController {
    /**
     * GET /api/organizer/events/:id/dashboard
     */
    static async getDashboard(req: Request, res: Response) {
        try {
            const eventId = parseInt(req.params.id);
            const organizerId = (req as any).user.organizerId;

            if (!organizerId) {
                return res.status(403).json({ success: false, message: "Only organizers can access this dashboard." });
            }

            const dashboard = await EventOperationsService.getEventOperationsSummary(eventId, organizerId);
            res.json({ success: true, data: dashboard });
        } catch (error: any) {
            res.status(error.message.includes("access denied") ? 403 : 500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/organizer/overview
     * Aggregated stats for the organizer dashboard.
     */
    static async getOverview(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;

            if (!organizerId) {
                return res.status(403).json({ success: false, message: "Only organizers can access this dashboard." });
            }

            const summary = await EventOperationsService.getOrganizerSummary(organizerId);
            res.json({ success: true, data: summary });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/events
     * List events for the logged-in organizer.
     */
    static async getMyEvents(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            const prisma = (await import("../lib/prisma")).prisma;

            const events = await prisma.event.findMany({
                where: { organizerId },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    dateTime: true,
                    venue: true,
                    coverImage: true,
                    _count: {
                        select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } }
                    },
                    tiers: {
                        select: { capacity: true }
                    }
                }
            });

            // Calculate total capacity for each event
            const formattedEvents = events.map(event => ({
                ...event,
                totalCapacity: event.tiers.reduce((sum, tier) => sum + tier.capacity, 0)
            }));

            res.json({ success: true, data: formattedEvents });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/attendees
     * List all attendees (ticket holders) for the organizer's events.
     */
    static async getAttendees(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            const prisma = (await import("../lib/prisma")).prisma;

            const tickets = await prisma.ticket.findMany({
                where: {
                    event: { organizerId }
                },
                include: {
                    user: {
                        include: { profile: true }
                    },
                    event: {
                        select: { title: true }
                    },
                    tier: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50 // Limit for now
            });

            const formattedAttendees = tickets.map(t => ({
                id: t.id,
                name: t.user.profile?.fullName || t.user.phoneNumber,
                event: t.event.title,
                type: t.tier.name,
                date: t.createdAt,
                status: t.status === "USED" ? "Checked In" : "Valid"
            }));

            res.json({ success: true, data: formattedAttendees });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/financials
     */
    static async getFinancials(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const financials = await EventOperationsService.getOrganizerFinancials(organizerId);
            res.json({ success: true, data: financials });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/ticket-stats
     */
    static async getTicketStats(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const stats = await EventOperationsService.getOrganizerTicketStats(organizerId);
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/settings
     */
    static async getSettings(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;
            const profile = await prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                include: { user: { select: { email: true, phoneNumber: true } } }
            });

            res.json({ success: true, data: profile });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/organizer/settings
     */
    static async updateSettings(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const { organizationName, contactEmail, contactPhone, city, payoutDetails, adminNote } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            const profile = await prisma.organizerProfile.update({
                where: { id: organizerId },
                data: {
                    organizationName,
                    contactEmail,
                    contactPhone,
                    city,
                    payoutDetails,
                    adminNote
                }
            });

            res.json({ success: true, data: profile });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/events
     */
    static async createEvent(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const { title, description, venue, dateTime, categoryId, cityId, tiers, coverImage, refundPolicy } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            const event = await prisma.event.create({
                data: {
                    title,
                    description,
                    venue,
                    dateTime: new Date(dateTime),
                    organizerId,
                    categoryId: parseInt(categoryId),
                    cityId: parseInt(cityId),
                    coverImage,
                    refundPolicy,
                    tiers: {
                        create: tiers.map((tier: any) => ({
                            name: tier.name,
                            price: parseFloat(tier.price),
                            capacity: parseInt(tier.capacity)
                        }))
                    }
                },
                include: { tiers: true }
            });

            res.json({ success: true, data: event });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/promos
     */
    static async createPromoCode(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const { code, discount, type, expiresAt, maxUses, eventId } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Security check: organizer must own the event
            const event = await prisma.event.findUnique({
                where: { id: parseInt(eventId) }
            });

            if (!event || event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event." });
            }

            const promo = await prisma.promoCode.create({
                data: {
                    code,
                    discount: parseFloat(discount),
                    type,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    maxUses: maxUses ? parseInt(maxUses) : null,
                    eventId: parseInt(eventId)
                }
            });

            res.json({ success: true, data: promo });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/promos
     */
    static async getPromoCodes(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;

            const promos = await prisma.promoCode.findMany({
                where: {
                    event: { organizerId }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ success: true, data: promos });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/events/:id
     * Get a single event for editing
     */
    static async getEventById(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const eventId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    tiers: true,
                    category: true,
                    city: true
                }
            });

            if (!event) {
                return res.status(404).json({ success: false, message: "Event not found" });
            }

            if (event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event" });
            }

            res.json({ success: true, data: event });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/organizer/events/:id
     * Update an existing event
     */
    static async updateEvent(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const eventId = parseInt(req.params.id);
            const { title, description, venue, dateTime, categoryId, cityId, coverImage, refundPolicy, tiers } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Security check: organizer must own the event
            const existingEvent = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: true }
            });

            if (!existingEvent) {
                return res.status(404).json({ success: false, message: "Event not found" });
            }

            if (existingEvent.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event" });
            }

            // Update basic event data
            const updateData: any = {};
            if (title) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (venue) updateData.venue = venue;
            if (dateTime) updateData.dateTime = new Date(dateTime);
            if (categoryId) updateData.categoryId = parseInt(categoryId);
            if (cityId) updateData.cityId = parseInt(cityId);
            if (coverImage !== undefined) updateData.coverImage = coverImage;
            if (refundPolicy !== undefined) updateData.refundPolicy = refundPolicy;

            const updatedEvent = await prisma.event.update({
                where: { id: eventId },
                data: updateData,
                include: { tiers: true }
            });

            // Handle tiers update if provided
            if (tiers && Array.isArray(tiers)) {
                // Delete existing tiers and recreate
                await prisma.ticketTier.deleteMany({
                    where: { eventId }
                });

                await prisma.ticketTier.createMany({
                    data: tiers.map((tier: any) => ({
                        eventId,
                        name: tier.name,
                        price: parseFloat(tier.price),
                        capacity: parseInt(tier.capacity)
                    }))
                });
            }

            // Fetch the final result with new tiers
            const finalEvent = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: true, category: true, city: true }
            });

            res.json({ success: true, data: finalEvent });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
