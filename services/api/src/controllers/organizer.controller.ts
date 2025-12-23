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
                    _count: {
                        select: { tickets: true }
                    }
                }
            });

            res.json({ success: true, data: events });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
