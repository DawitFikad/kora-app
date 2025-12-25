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
