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
}
