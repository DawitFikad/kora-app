"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudController = void 0;
const prisma_1 = require("../lib/prisma");
const fraud_service_1 = require("../services/fraud.service");
class FraudController {
    static async getSecurityMetrics(req, res) {
        try {
            const metrics = await fraud_service_1.FraudService.getSecurityMetrics();
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async listAlerts(req, res) {
        try {
            const alerts = await prisma_1.prisma.fraudAlert.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { phoneNumber: true } },
                    event: { select: { title: true } },
                    organizer: { select: { organizationName: true } }
                }
            });
            res.json(alerts);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getAlertDetails(req, res) {
        try {
            const { id } = req.params;
            const alert = await prisma_1.prisma.fraudAlert.findUnique({
                where: { id: parseInt(id) },
                include: {
                    user: true,
                    event: true,
                    organizer: true
                }
            });
            if (!alert)
                return res.status(404).json({ error: "Alert not found" });
            res.json(alert);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async resolveAlert(req, res) {
        try {
            const { id } = req.params;
            const { adminNote, isCleared } = req.body;
            const alert = await prisma_1.prisma.fraudAlert.update({
                where: { id: parseInt(id) },
                data: {
                    isCleared,
                    adminNote,
                    resolvedAt: new Date()
                }
            });
            res.json(alert);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getRiskScores(req, res) {
        try {
            const scores = await prisma_1.prisma.riskScore.findMany({
                orderBy: { score: 'desc' },
                take: 100
            });
            res.json(scores);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async freezeOrganizer(req, res) {
        // Implementation for freezing accounts/wallets
        // We'll simulate this by adding an admin note to the organizer profile
        try {
            const { id } = req.params;
            const organizer = await prisma_1.prisma.organizerProfile.update({
                where: { id: parseInt(id) },
                data: {
                    status: "PENDING", // Effectively suspends them
                    adminNote: `FREEZE: Suspicious activity logged. Reason: ${req.body.reason}`
                }
            });
            res.json({ success: true, message: "Organizer frozen pending investigation", organizer });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.FraudController = FraudController;
