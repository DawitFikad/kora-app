import { prisma } from "../lib/prisma";
import { DisputeStatus, DisputeSource } from "@prisma/client";

export class DisputeService {
    /**
     * User or System creates a dispute.
     */
    static async createDispute(data: {
        userId: number;
        purchaseId?: number;
        refundId?: number;
        source: DisputeSource;
        reason: string;
        metadata?: any;
    }) {
        return await prisma.dispute.create({
            data: {
                ...data,
                status: DisputeStatus.OPEN
            }
        });
    }

    /**
     * Admin updates dispute status.
     */
    static async updateStatus(disputeId: number, status: DisputeStatus, adminNote?: string) {
        return await prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status,
                metadata: adminNote ? {
                    adminNote,
                    updatedAt: new Date(),
                    // Merge with existing metadata
                    history: [...((await prisma.dispute.findUnique({ where: { id: disputeId } }))?.metadata as any)?.history || [], { status, adminNote, timestamp: new Date() }]
                } : undefined
            }
        });
    }

    /**
     * Resolves a dispute with a specific outcome (e.g., Refund triggered).
     */
    static async resolveDispute(disputeId: number, outcome: string) {
        return await prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status: DisputeStatus.RESOLVED,
                metadata: {
                    outcome,
                    resolvedAt: new Date()
                }
            }
        });
    }
}
