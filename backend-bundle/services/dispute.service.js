"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class DisputeService {
    /**
     * User or System creates a dispute.
     */
    static async createDispute(data) {
        return await prisma_1.prisma.dispute.create({
            data: {
                ...data,
                status: client_1.DisputeStatus.OPEN
            }
        });
    }
    /**
     * Admin updates dispute status.
     */
    static async updateStatus(disputeId, status, adminNote) {
        return await prisma_1.prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status,
                metadata: adminNote ? {
                    adminNote,
                    updatedAt: new Date(),
                    // Merge with existing metadata
                    history: [...(await prisma_1.prisma.dispute.findUnique({ where: { id: disputeId } }))?.metadata?.history || [], { status, adminNote, timestamp: new Date() }]
                } : undefined
            }
        });
    }
    /**
     * Resolves a dispute with a specific outcome (e.g., Refund triggered).
     */
    static async resolveDispute(disputeId, outcome) {
        return await prisma_1.prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status: client_1.DisputeStatus.RESOLVED,
                metadata: {
                    outcome,
                    resolvedAt: new Date()
                }
            }
        });
    }
}
exports.DisputeService = DisputeService;
