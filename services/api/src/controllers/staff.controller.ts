import { Request, Response } from "express";
import { StaffService } from "../services/staff.service";
import { prisma } from "../lib/prisma";

export class StaffController {
    static async getMyInviteStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const invitation = await StaffService.getPendingInvitationForUser(userId);

            res.json({
                hasPendingInvite: !!invitation,
                invitation: invitation || null,
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Organizer: Invite a staff member.
     */
    static async inviteManual(req: Request, res: Response) {
        try {
            const { phoneNumber, role } = req.body;
            // Get organizer profile for current user
            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId: (req as any).user.userId }
            });

            if (!organizer) return res.status(403).json({ error: "Only organizers can invite staff." });

            const invitation = await StaffService.inviteStaff(organizer.id, phoneNumber, role);
            res.json(invitation);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * User: Accept an invitation.
     */
    static async acceptInvite(req: Request, res: Response) {
        try {
            const { inviteCode } = req.body;
            const staff = await StaffService.acceptInvitation((req as any).user.userId, inviteCode);
            res.json({ message: "Invitation accepted successfully", staff });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Organizer: List my staff.
     */
    static async listMyStaff(req: Request, res: Response) {
        try {
            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId: (req as any).user.userId }
            });

            if (!organizer) return res.status(403).json({ error: "Not an organizer profile." });

            const staff = await StaffService.listStaff(organizer.id);
            res.json(staff);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Organizer: Remove a staff member.
     */
    static async removeStaff(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId: (req as any).user.userId }
            });

            if (!organizer) return res.status(403).json({ error: "Unauthorized." });

            await StaffService.removeStaff(organizer.id, parseInt(id));
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
