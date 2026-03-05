"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const profile_service_1 = require("../services/profile.service");
class AnalyticsController {
    static async getLiveMetrics(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user.userId;
            // Authorization check
            const organizer = await profile_service_1.ProfileService.getOrganizerProfile(userId);
            const event = await prisma_1.prisma.event.findUnique({ where: { id: parseInt(eventId) } });
            if (!event || event.organizerId !== organizer.id) {
                return res.status(403).json({ error: "Access denied to event analytics" });
            }
            const metrics = await analytics_service_1.AnalyticsService.getLiveEventMetrics(parseInt(eventId));
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getPostEventReport(req, res) {
        try {
            const { eventId } = req.params;
            const report = await analytics_service_1.AnalyticsService.getPostEventAnalytics(parseInt(eventId));
            res.json(report);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
// Minimal prisma local import since it's used in and out of services
const prisma_1 = require("../lib/prisma");
