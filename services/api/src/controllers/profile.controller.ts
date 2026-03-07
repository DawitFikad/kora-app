import { Request, Response } from "express";
import { ProfileService } from "../services/profile.service";
import { Role, OrganizerStatus } from "@prisma/client";

export class ProfileController {
    // --- User Profile ---

    static async getMyProfile(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const profile = await ProfileService.getUserProfile(userId);
            res.json(profile);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateMyProfile(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const {
                fullName,
                avatarUrl,
                bio,
                gender,
                birthDate,
                language,
                email,
                location,
                interests,
                notificationPreferences,
            } = req.body;
            const profile = await ProfileService.updateUserProfile(userId, {
                fullName,
                avatarUrl,
                bio,
                gender,
                birthDate,
                language,
                email,
                location,
                interests,
                notificationPreferences,
            });
            res.json(profile);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // --- Organizer Profile ---

    static async getMyOrganizerProfile(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const profile = await ProfileService.getOrganizerProfile(userId);
            res.json(profile);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }

    static async updateMyOrganizerProfile(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const result = await ProfileService.updateOrganizerProfile(userId, req.body);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    // --- Admin Actions ---

    static async listOrganizers(req: Request, res: Response) {
        try {
            const { status } = req.query;
            const organizers = await ProfileService.listAllOrganizers(status as OrganizerStatus);
            res.json(organizers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async reviewOrganizer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, adminNote, feeType, feeFixed, feePercentage } = req.body;

            if (![OrganizerStatus.APPROVED, OrganizerStatus.REJECTED].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }

            const result = await ProfileService.reviewOrganizer(
                parseInt(id),
                status,
                adminNote,
                feeType,
                feeFixed,
                feePercentage
            );

            // Audit Log
            const { prisma } = await import("../lib/prisma");
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Organizer Reviewed',
                    content: `Admin ${(req as any).user?.userId} reviewed organizer ${id}: ${status}`,
                    status: 'DELIVERED',
                    metadata: { organizerId: id, status, adminNote, fees: { feeType, feeFixed, feePercentage } }
                }
            });

            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
