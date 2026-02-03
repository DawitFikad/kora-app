import { Request, Response } from "express";
import { RefundService } from "../services/refund.service";
import { RefundReason } from "@prisma/client";

export class RefundController {
    /**
     * POST /api/refunds/request
     */
    static async requestRefund(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const { purchaseId, reason, description } = req.body;

            if (!purchaseId || !reason) {
                return res.status(400).json({ success: false, message: "Purchase ID and reason are required." });
            }

            const refund = await RefundService.requestRefund(userId, purchaseId, reason as RefundReason, description);
            res.status(201).json({ success: true, data: refund });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/refunds/:id/approve
     */
    static async approveRefund(req: Request, res: Response) {
        try {
            const adminId = (req as any).user.userId;
            const refundId = parseInt(req.params.id);

            const refund = await RefundService.approveRefund(refundId, adminId);
            res.json({ success: true, data: refund });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/refunds/:id/reject
     */
    static async rejectRefund(req: Request, res: Response) {
        try {
            const adminId = (req as any).user.userId;
            const refundId = parseInt(req.params.id);
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({ success: false, message: "Rejection reason is required." });
            }

            const refund = await RefundService.rejectRefund(refundId, adminId, reason);
            res.json({ success: true, data: refund });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/refunds
     * List refunds (Admin view)
     */
    static async listRefunds(req: Request, res: Response) {
        try {
            const prisma = (await import("../lib/prisma")).prisma;
            const refunds = await prisma.refund.findMany({
                include: {
                    purchase: {
                        include: {
                            user: { include: { profile: true } },
                            tickets: {
                                include: {
                                    event: { select: { id: true, title: true, dateTime: true, organizerId: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: refunds });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
