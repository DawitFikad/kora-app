import { prisma } from "../lib/prisma";
import { RiskLevel } from "@prisma/client";

export class FraudService {
    static async getRecentAlerts() {
        return prisma.fraudAlert.findMany({
            where: { isCleared: false },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { phoneNumber: true } },
                event: { select: { title: true } },
                organizer: { select: { organizationName: true } }
            }
        });
    }

    static async getSecurityMetrics() {
        const highRiskCount = await prisma.fraudAlert.count({
            where: { riskLevel: RiskLevel.HIGH, isCleared: false }
        });

        const criticalRiskCount = await prisma.fraudAlert.count({
            where: { riskLevel: RiskLevel.CRITICAL, isCleared: false }
        });

        const suspiciousOrgs = await prisma.organizerProfile.count({
            where: { status: 'PENDING' } // Simple proxy for now
        });

        return {
            criticalAlerts: criticalRiskCount,
            highRiskAlerts: highRiskCount,
            suspiciousOrgs,
            authSuccessRate: 99.8 // Mock for now
        };
    }

    static async analyzeScan(scanLogId: number) {
        const log = await prisma.scanLog.findUnique({
            where: { id: scanLogId }
        });

        if (!log) return;

        // Rule 1: Duplicate QR Scans (Double Entry)
        if (log.status === "REJECTED" && log.reason?.toLowerCase().includes("already")) {
            await prisma.fraudAlert.create({
                data: {
                    type: "REPLAY",
                    riskLevel: "HIGH",
                    message: `Duplicate scan attempt detected for Ticket ${log.ticketId} at Gate ${log.gateId || 'Unknown'}`,
                    eventId: log.eventId,
                    metadata: { scanLogId, deviceId: log.deviceId }
                }
            });
        }

        // Rule 2: Multiple Signature Errors (Potential Tampering)
        if (log.status === "REJECTED" && log.reason?.toLowerCase().includes("signature")) {
            await prisma.fraudAlert.create({
                data: {
                    type: "IP_ANOMALY", // Proxy for tampering
                    riskLevel: "CRITICAL",
                    message: `Invalid QR signature detected. Potential tampering attempt at Gate ${log.gateId || 'Unknown'}`,
                    metadata: { scanLogId, deviceId: log.deviceId }
                }
            });
        }
    }
}
