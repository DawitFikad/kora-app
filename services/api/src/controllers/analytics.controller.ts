import { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { ProfileService } from "../services/profile.service";

export class AnalyticsController {
    static async getLiveMetrics(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const userId = req.user!.userId;

            // Authorization check
            const organizer = await ProfileService.getOrganizerProfile(userId);
            const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });

            if (!event || event.organizerId !== organizer.id) {
                return res.status(403).json({ error: "Access denied to event analytics" });
            }

            const metrics = await AnalyticsService.getLiveEventMetrics(parseInt(eventId));
            res.json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getPostEventReport(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const report = await AnalyticsService.getPostEventAnalytics(parseInt(eventId));
            res.json(report);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

// Minimal prisma local import since it's used in and out of services
import { prisma } from "../lib/prisma";
