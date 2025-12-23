import { Request, Response } from "express";
import { PayoutService } from "../services/payout.service";
import { Role } from "@prisma/client";

export class PayoutController {
    /**
     * Organizer: Request a Payout
     */
    static async requestPayout(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Organizer profile not found" });

            const { amount, method, details } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: "Invalid amount" });
            }

            if (!method || !details) {
                return res.status(400).json({ success: false, message: "Payout method and details are required" });
            }

            const payout = await PayoutService.requestPayout(organizerId, amount, method, details);
            res.json({ success: true, data: payout });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Admin: Approve Payout
     */
    static async approvePayout(req: Request, res: Response) {
        try {
            const adminId = (req as any).user.id;
            const { batchId } = req.params;

            const payout = await PayoutService.approvePayout(parseInt(batchId), adminId);
            res.json({ success: true, data: payout, message: "Payout approved and processed successfully" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Organizer: Get Payout History
     */
    static async getMyPayouts(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Organizer profile not found" });

            const payouts = await PayoutService.getOrganizerPayouts(organizerId);
            res.json({ success: true, data: payouts });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Admin: List All Pending Payouts
     */
    static async listPendingPayouts(req: Request, res: Response) {
        try {
            const payouts = await PayoutService.adminListPendingPayouts();
            res.json({ success: true, data: payouts });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
