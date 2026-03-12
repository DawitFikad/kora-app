import { prisma } from "../lib/prisma";
import { RiskLevel, FinancialStatus } from "@prisma/client";
import { SystemConfigService } from "./system-config.service";

/**
 * RiskService (§13, §14)
 * Responsible for fraud scoring, payout eligibility blocks, and reserve rules.
 */
export class RiskService {
    /**
     * Checks if an organizer is eligible for payout based on compliance and fraud flags.
     * Satisfies §9 and §14 of the Financial Blueprint.
     */
    static async validatePayoutEligibility(organizerId: number) {
        // 1. KYC / Compliance Check
        const profile = await prisma.organizerProfile.findUnique({
            where: { id: organizerId },
        });

        if (!profile) throw new Error("Organizer profile not found.");

        // A "real" check: Organizer must be explicitly APPROVED and have a license on file
        if (profile.status !== "APPROVED") {
            throw new Error(`Organizer status is ${profile.status}. Payouts are only allowed for APPROVED organizers.`);
        }

        if (!profile.businessLicense) {
            throw new Error("Compliance Block: Business license verification is required before first payout.");
        }

        // 2. Fraud Block (§5, §9)
        const blockOnFraud = await SystemConfigService.getBoolean("financial.settlement.block_on_fraud", true);
        if (blockOnFraud) {
            const highRiskFraudCount = await prisma.fraudAlert.count({
                where: {
                    organizerId,
                    isCleared: false,
                    riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] }
                }
            });

            if (highRiskFraudCount > 0) {
                throw new Error("Risk Block: Outstanding HIGH/CRITICAL fraud alerts must be cleared.");
            }
        }

        // 3. New Organizer Risk Reserve (§14)
        const reserveEnabled = await SystemConfigService.getBoolean("financial.payout.risk_reserve_enabled", true);
        if (reserveEnabled) {
            const requiredEvents = await SystemConfigService.getNumber("financial.payout.risk_reserve_events", 3);
            const completedEventsCount = await prisma.event.count({
                where: { organizerId, status: "COMPLETED" }
            });

            if (completedEventsCount < requiredEvents) {
                throw new Error(`Risk Reserve Hold: ${requiredEvents} completed events required (Current: ${completedEventsCount}).`);
            }
        }

        return true;
    }

    /**
     * Checks if a settlement release should be held due to risk signals.
     */
    static async shouldHoldSettlement(eventId: number, organizerId: number): Promise<boolean> {
        const blockOnFraud = await SystemConfigService.getBoolean("financial.settlement.block_on_fraud", true);
        if (!blockOnFraud) return false;

        const alerts = await prisma.fraudAlert.count({
            where: {
                isCleared: false,
                riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] },
                OR: [
                    { eventId },
                    { organizerId }
                ]
            }
        });

        return alerts > 0;
    }

    /**
     * Simple fraud scoring logic (could be expanded with ML/Rules engine)
     */
    static calculateEventRiskScore(totalGmv: number, refundRatio: number): RiskLevel {
        if (refundRatio > 0.3) return RiskLevel.CRITICAL;
        if (refundRatio > 0.15) return RiskLevel.HIGH;
        if (totalGmv > 500000) return RiskLevel.MEDIUM; // High volume warrants review
        return RiskLevel.LOW;
    }
}
