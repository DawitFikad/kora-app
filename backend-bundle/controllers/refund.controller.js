"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundController = void 0;
const refund_service_1 = require("../services/refund.service");
class RefundController {
    /**
     * POST /api/refunds/request
     */
    static async requestRefund(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const { purchaseId, reason, description } = req.body;
            if (!purchaseId || !reason) {
                return res.status(400).json({ success: false, message: "Purchase ID and reason are required." });
            }
            const refund = await refund_service_1.RefundService.requestRefund(userId, purchaseId, reason, description);
            res.status(201).json({ success: true, data: refund });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * POST /api/refunds/:id/approve
     */
    static async approveRefund(req, res) {
        try {
            const adminId = req.user.userId;
            const refundId = parseInt(req.params.id);
            const refund = await refund_service_1.RefundService.approveRefund(refundId, adminId);
            res.json({ success: true, data: refund });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * POST /api/refunds/:id/reject
     */
    static async rejectRefund(req, res) {
        try {
            const adminId = req.user.userId;
            const refundId = parseInt(req.params.id);
            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json({ success: false, message: "Rejection reason is required." });
            }
            const refund = await refund_service_1.RefundService.rejectRefund(refundId, adminId, reason);
            res.json({ success: true, data: refund });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * GET /api/refunds
     * List refunds (Admin view)
     */
    static async listRefunds(req, res) {
        try {
            const prisma = (await Promise.resolve().then(() => __importStar(require("../lib/prisma")))).prisma;
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.RefundController = RefundController;
