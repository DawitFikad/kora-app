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
exports.DisputeController = void 0;
const dispute_service_1 = require("../services/dispute.service");
class DisputeController {
    /**
     * POST /api/disputes
     */
    static async createDispute(req, res) {
        try {
            const userId = req.user.userId;
            const { purchaseId, refundId, source, reason, metadata } = req.body;
            if (!reason || !source) {
                return res.status(400).json({ success: false, message: "Reason and source are required." });
            }
            const dispute = await dispute_service_1.DisputeService.createDispute({
                userId,
                purchaseId,
                refundId,
                source: source,
                reason,
                metadata
            });
            res.status(201).json({ success: true, data: dispute });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * PATCH /api/disputes/:id
     */
    static async updateDispute(req, res) {
        try {
            const disputeId = parseInt(req.params.id);
            const { status, adminNote } = req.body;
            const updated = await dispute_service_1.DisputeService.updateStatus(disputeId, status, adminNote);
            res.json({ success: true, data: updated });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * GET /api/disputes
     */
    static async listDisputes(req, res) {
        try {
            const prisma = (await Promise.resolve().then(() => __importStar(require("../lib/prisma")))).prisma;
            const disputes = await prisma.dispute.findMany({
                include: { user: true, purchase: true, refund: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: disputes });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.DisputeController = DisputeController;
