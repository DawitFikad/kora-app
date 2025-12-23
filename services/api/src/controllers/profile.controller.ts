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
            const { fullName, language } = req.body;
            const profile = await ProfileService.updateUserProfile(userId, { fullName, language });
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
            const organizers = await ProfileService.listAllOrganizers();
            res.json(organizers);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async reviewOrganizer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, adminNote } = req.body;

            if (![OrganizerStatus.APPROVED, OrganizerStatus.REJECTED].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }

            const result = await ProfileService.reviewOrganizer(parseInt(id), status, adminNote);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
