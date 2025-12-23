import { Request, Response } from "express";
import { DisputeService } from "../services/dispute.service";
import { DisputeStatus, DisputeSource } from "@prisma/client";

export class DisputeController {
    /**
     * POST /api/disputes
     */
    static async createDispute(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { purchaseId, refundId, source, reason, metadata } = req.body;

            if (!reason || !source) {
                return res.status(400).json({ success: false, message: "Reason and source are required." });
            }

            const dispute = await DisputeService.createDispute({
                userId,
                purchaseId,
                refundId,
                source: source as DisputeSource,
                reason,
                metadata
            });
            res.status(201).json({ success: true, data: dispute });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/disputes/:id
     */
    static async updateDispute(req: Request, res: Response) {
        try {
            const disputeId = parseInt(req.params.id);
            const { status, adminNote } = req.body;

            const updated = await DisputeService.updateStatus(disputeId, status as DisputeStatus, adminNote);
            res.json({ success: true, data: updated });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/disputes
     */
    static async listDisputes(req: Request, res: Response) {
        try {
            const prisma = (await import("../lib/prisma")).prisma;
            const disputes = await prisma.dispute.findMany({
                include: { user: true, purchase: true, refund: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: disputes });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
