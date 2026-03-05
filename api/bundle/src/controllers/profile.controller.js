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
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const client_1 = require("@prisma/client");
class ProfileController {
    // --- User Profile ---
    static async getMyProfile(req, res) {
        try {
            const userId = req.user.userId;
            const profile = await profile_service_1.ProfileService.getUserProfile(userId);
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async updateMyProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { fullName, avatarUrl, bio, gender, birthDate, language, email } = req.body;
            const profile = await profile_service_1.ProfileService.updateUserProfile(userId, {
                fullName,
                avatarUrl,
                bio,
                gender,
                birthDate,
                language,
                email
            });
            res.json(profile);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    // --- Organizer Profile ---
    static async getMyOrganizerProfile(req, res) {
        try {
            const userId = req.user.userId;
            const profile = await profile_service_1.ProfileService.getOrganizerProfile(userId);
            res.json(profile);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    static async updateMyOrganizerProfile(req, res) {
        try {
            const userId = req.user.userId;
            const result = await profile_service_1.ProfileService.updateOrganizerProfile(userId, req.body);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    // --- Admin Actions ---
    static async listOrganizers(req, res) {
        try {
            const { status } = req.query;
            const organizers = await profile_service_1.ProfileService.listAllOrganizers(status);
            res.json(organizers);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async reviewOrganizer(req, res) {
        try {
            const { id } = req.params;
            const { status, adminNote, feeType, feeFixed, feePercentage } = req.body;
            if (![client_1.OrganizerStatus.APPROVED, client_1.OrganizerStatus.REJECTED].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            const result = await profile_service_1.ProfileService.reviewOrganizer(parseInt(id), status, adminNote, feeType, feeFixed, feePercentage);
            // Audit Log
            const { prisma } = await Promise.resolve().then(() => __importStar(require("../lib/prisma")));
            await prisma.notificationLog.create({
                data: {
                    userId: req.user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Organizer Reviewed',
                    content: `Admin ${req.user?.userId} reviewed organizer ${id}: ${status}`,
                    status: 'DELIVERED',
                    metadata: { organizerId: id, status, adminNote, fees: { feeType, feeFixed, feePercentage } }
                }
            });
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.ProfileController = ProfileController;
