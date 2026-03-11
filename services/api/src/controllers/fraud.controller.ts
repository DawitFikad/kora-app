import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { RiskLevel } from "@prisma/client";
import { FraudService } from "../services/fraud.service";

export class FraudController {
    static async getSecurityMetrics(req: Request, res: Response) {
        try {
            const metrics = await FraudService.getSecurityMetrics();
            res.json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async listAlerts(req: Request, res: Response) {
        try {
            const alerts = await prisma.fraudAlert.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { phoneNumber: true } },
                    event: { select: { title: true } },
                    organizer: { select: { organizationName: true } }
                }
            });
            res.json(alerts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAlertDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const alert = await prisma.fraudAlert.findUnique({
                where: { id: parseInt(id) },
                include: {
                    user: true,
                    event: true,
                    organizer: true
                }
            });
            if (!alert) return res.status(404).json({ error: "Alert not found" });
            res.json(alert);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async resolveAlert(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { adminNote, isCleared } = req.body;
            const alert = await prisma.fraudAlert.update({
                where: { id: parseInt(id) },
                data: {
                    isCleared,
                    adminNote,
                    resolvedAt: new Date()
                }
            });
            res.json(alert);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async clearAlert(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { adminNote } = req.body;
            const alert = await prisma.fraudAlert.update({
                where: { id: parseInt(id) },
                data: {
                    isCleared: true,
                    adminNote: adminNote || "Cleared by admin after review",
                    resolvedAt: new Date(),
                },
            });
            res.json({ success: true, data: alert });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async clearOrganizerAlerts(req: Request, res: Response) {
        try {
            const organizerId = parseInt(req.params.organizerId);
            const { adminNote } = req.body;

            const result = await prisma.fraudAlert.updateMany({
                where: {
                    organizerId,
                    isCleared: false,
                    riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] },
                },
                data: {
                    isCleared: true,
                    adminNote: adminNote || "Bulk-cleared by admin after payout review",
                    resolvedAt: new Date(),
                },
            });

            res.json({
                success: true,
                message: `Cleared ${result.count} blocking fraud alert(s) for organizer ${organizerId}`,
                data: { organizerId, clearedCount: result.count },
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getOrganizerBlockingAlerts(req: Request, res: Response) {
        try {
            const organizerId = parseInt(req.params.organizerId);
            const alerts = await prisma.fraudAlert.findMany({
                where: {
                    organizerId,
                    isCleared: false,
                    riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] },
                },
                orderBy: { createdAt: "desc" },
                include: {
                    event: { select: { id: true, title: true } },
                },
            });

            res.json({
                success: true,
                data: {
                    organizerId,
                    blockingCount: alerts.length,
                    blockingAlerts: alerts,
                },
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getRiskScores(req: Request, res: Response) {
        try {
            const scores = await prisma.riskScore.findMany({
                orderBy: { score: 'desc' },
                take: 100
            });
            res.json(scores);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async freezeOrganizer(req: Request, res: Response) {
        // Implementation for freezing accounts/wallets
        // We'll simulate this by adding an admin note to the organizer profile
        try {
            const { id } = req.params;
            const organizer = await prisma.organizerProfile.update({
                where: { id: parseInt(id) },
                data: {
                    status: "PENDING", // Effectively suspends them
                    adminNote: `FREEZE: Suspicious activity logged. Reason: ${req.body.reason}`
                }
            });
            res.json({ success: true, message: "Organizer frozen pending investigation", organizer });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
