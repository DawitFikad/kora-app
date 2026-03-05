"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutController = void 0;
const payout_service_1 = require("../services/payout.service");
class PayoutController {
    /**
     * Organizer: Request a Payout
     */
    static async requestPayout(req, res) {
        try {
            const organizerId = req.user.organizerId;
            if (!organizerId)
                return res.status(403).json({ success: false, message: "Organizer profile not found" });
            const { amount, method, details } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: "Invalid amount" });
            }
            if (!method || !details) {
                return res.status(400).json({ success: false, message: "Payout method and details are required" });
            }
            const payout = await payout_service_1.PayoutService.requestPayout(organizerId, amount, method, details);
            res.json({ success: true, data: payout });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: Approve Payout
     */
    static async approvePayout(req, res) {
        try {
            const adminId = req.user.userId;
            const { batchId } = req.params;
            const payout = await payout_service_1.PayoutService.approvePayout(parseInt(batchId), adminId);
            res.json({ success: true, data: payout, message: "Payout approved and processed successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Organizer: Get Payout History
     */
    static async getMyPayouts(req, res) {
        try {
            const organizerId = req.user.organizerId;
            if (!organizerId)
                return res.status(403).json({ success: false, message: "Organizer profile not found" });
            const payouts = await payout_service_1.PayoutService.getOrganizerPayouts(organizerId);
            res.json({ success: true, data: payouts });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: List All Pending Payouts
     */
    static async listPendingPayouts(req, res) {
        try {
            const payouts = await payout_service_1.PayoutService.adminListPendingPayouts();
            res.json({ success: true, data: payouts });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: Reject Payout
     */
    static async rejectPayout(req, res) {
        try {
            const adminId = req.user.userId;
            const { batchId } = req.params;
            const { reason } = req.body;
            const payout = await payout_service_1.PayoutService.rejectPayout(parseInt(batchId), adminId, reason || "Rejected by admin");
            res.json({ success: true, data: payout, message: "Payout rejected" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Admin: List Processed Payouts
     */
    static async listProcessedPayouts(req, res) {
        try {
            const payouts = await payout_service_1.PayoutService.adminListProcessedPayouts();
            res.json({ success: true, data: payouts });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.PayoutController = PayoutController;
