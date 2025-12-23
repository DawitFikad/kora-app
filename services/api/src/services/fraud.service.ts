import { prisma } from "../lib/prisma";
import { FraudType, RiskLevel, Prisma } from "@prisma/client";

export class FraudService {
    /**
     * Analyzes a scan log for fraud signals.
     * Checks for replays, gate anomalies, and suspicious device behavior.
     */
    static async analyzeScan(scanId: number) {
        const scan = await prisma.scanLog.findUnique({
            where: { id: scanId }
        });

        if (!scan) return;

        // 1. Check for QR Replay
        if (scan.status === "SUCCESS") {
            const previousScans = await prisma.scanLog.count({
                where: {
                    ticketId: scan.ticketId,
                    status: "SUCCESS",
                    id: { not: scan.id }
                }
            });

            if (previousScans > 0) {
                await this.createAlert({
                    type: FraudType.REPLAY,
                    riskLevel: RiskLevel.CRITICAL,
                    message: `Ticket ${scan.ticketId} scanned successfully multiple times. Possible QR replay.`,
                    eventId: scan.eventId,
                    ticketId: scan.ticketId,
                    metadata: { scanId, ticketId: scan.ticketId, previousScans }
                });
            }
        } else if (scan.reason === "Already scanned") {
            // Signal that someone is trying to reuse a ticket
            await this.createAlert({
                type: FraudType.REPLAY,
                riskLevel: RiskLevel.HIGH,
                message: `Repeat scan attempt for ticket ${scan.ticketId}.`,
                eventId: scan.eventId,
                ticketId: scan.ticketId,
                metadata: { scanId, ticketId: scan.ticketId }
            });
        }

        // 2. Check for Device Anomaly (High failure rate from one device)
        if (scan.deviceId) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const failureCount = await prisma.scanLog.count({
                where: {
                    deviceId: scan.deviceId,
                    status: "REJECTED",
                    timestamp: { gte: fiveMinutesAgo }
                }
            });

            if (failureCount > 10) {
                console.log(`[FRAUD] Alerting for device ${scan.deviceId}: failures=${failureCount}`);
                await this.createAlert({
                    type: FraudType.INSIDER_ABUSE,
                    riskLevel: RiskLevel.HIGH,
                    message: `Device ${scan.deviceId} exceeded failure threshold (10+ failures in 5 min).`,
                    metadata: { deviceId: scan.deviceId, failureCount },
                    deviceId: scan.deviceId
                });
            } else {
                console.log(`[FRAUD] Device ${scan.deviceId} failure count: ${failureCount}`);
            }
        }

        // 3. Check for Offline/Late Sync Anomaly
        if (scan.mode === "OFFLINE" && scan.deviceTime) {
            const timeDiff = Math.abs(scan.timestamp.getTime() - scan.deviceTime.getTime());
            if (timeDiff > 24 * 60 * 60 * 1000) { // 24 hours
                await this.createAlert({
                    type: FraudType.OFFLINE_ABUSE,
                    riskLevel: RiskLevel.MEDIUM,
                    message: `Offline scan synced after 24 hours. Ticket: ${scan.ticketId}`,
                    eventId: scan.eventId,
                    ticketId: scan.ticketId,
                    metadata: { scanId, timeDiffHours: timeDiff / 3600000 }
                });
            }
        }
    }

    /**
     * Analyzes a purchase for fraud signals.
     */
    static async analyzePurchase(purchaseId: number) {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { user: true }
        });

        if (!purchase) return;

        // 1. High Velocity Purchases
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCount = await prisma.purchase.count({
            where: {
                userId: purchase.userId,
                createdAt: { gte: oneHourAgo }
            }
        });

        if (recentCount > 5) {
            await this.createAlert({
                type: FraudType.BOT_PURCHASE,
                riskLevel: RiskLevel.HIGH,
                message: `User ${purchase.userId} made 5+ purchases in 1 hour.`,
                userId: purchase.userId,
                metadata: { purchaseId, recentCount }
            });
        }
    }

    /**
     * Internal helper to create fraud alerts and update risk scores.
     */
    private static async createAlert(data: {
        type: FraudType;
        riskLevel: RiskLevel;
        message: string;
        userId?: number;
        eventId?: number;
        organizerId?: number;
        ticketId?: string;
        deviceId?: string;
        metadata?: any;
    }) {
        const alert = await prisma.fraudAlert.create({ data });

        // Try to associate userId if not provided (lookup from ticket)
        let effectiveUserId = data.userId;
        if (!effectiveUserId && data.ticketId) {
            const ticket = await prisma.ticket.findUnique({ where: { id: data.ticketId } });
            if (ticket) effectiveUserId = ticket.userId;
        }

        // Update Risk Score for the entity
        if (effectiveUserId) await this.adjustRiskScore("USER", effectiveUserId.toString(), this.getScoreForLevel(data.riskLevel));
        if (data.organizerId) await this.adjustRiskScore("ORGANIZER", data.organizerId.toString(), this.getScoreForLevel(data.riskLevel));
        if (data.deviceId) await this.adjustRiskScore("DEVICE", data.deviceId, this.getScoreForLevel(data.riskLevel));

        // If critical, execute automated actions
        if (data.riskLevel === RiskLevel.CRITICAL) {
            await this.handleCriticalFraud(alert);
        }

        return alert;
    }

    private static getScoreForLevel(level: RiskLevel): number {
        switch (level) {
            case RiskLevel.LOW: return 5;
            case RiskLevel.MEDIUM: return 20;
            case RiskLevel.HIGH: return 50;
            case RiskLevel.CRITICAL: return 100;
            default: return 0;
        }
    }

    private static async adjustRiskScore(entityType: string, entityId: string, adjustment: number) {
        let risk = await prisma.riskScore.findFirst({
            where: { entityType, entityId }
        });

        if (!risk) {
            risk = await prisma.riskScore.create({
                data: { entityType, entityId, score: 0, level: RiskLevel.LOW }
            });
        }

        const newScore = Math.min(100, risk.score + adjustment);
        let newLevel: RiskLevel = RiskLevel.LOW;
        if (newScore > 80) newLevel = RiskLevel.CRITICAL;
        else if (newScore > 50) newLevel = RiskLevel.HIGH;
        else if (newScore > 20) newLevel = RiskLevel.MEDIUM;

        await prisma.riskScore.update({
            where: { id: risk.id },
            data: {
                score: newScore,
                level: newLevel,
                lastUpdated: new Date(),
                metadata: {
                    lastAdjustment: adjustment,
                    history: [...((risk.metadata as any)?.history || []), { adjustment, timestamp: new Date() }]
                }
            }
        });
    }

    private static async handleCriticalFraud(alert: any) {
        if (alert.organizerId || alert.eventId) {
            const targetOrganizerId = alert.organizerId || (alert.eventId ? (await prisma.event.findUnique({ where: { id: alert.eventId } }))?.organizerId : null);
            if (targetOrganizerId) {
                console.warn(`[FRAUD] CRITICAL ALERT: Locking wallet for organizer ${targetOrganizerId}`);
            }
        }
        console.error(`[FRAUD] CRITICAL ALERT: ${alert.message}`);
    }
}
