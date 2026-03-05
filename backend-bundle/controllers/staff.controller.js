"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const staff_service_1 = require("../services/staff.service");
const prisma_1 = require("../lib/prisma");
class StaffController {
    /**
     * Organizer: Invite a staff member.
     */
    static async inviteManual(req, res) {
        try {
            const { phoneNumber, role } = req.body;
            // Get organizer profile for current user
            const organizer = await prisma_1.prisma.organizerProfile.findUnique({
                where: { userId: req.user.userId }
            });
            if (!organizer)
                return res.status(403).json({ error: "Only organizers can invite staff." });
            const invitation = await staff_service_1.StaffService.inviteStaff(organizer.id, phoneNumber, role);
            res.json(invitation);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * User: Accept an invitation.
     */
    static async acceptInvite(req, res) {
        try {
            const { inviteCode } = req.body;
            const staff = await staff_service_1.StaffService.acceptInvitation(req.user.userId, inviteCode);
            res.json({ message: "Invitation accepted successfully", staff });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Organizer: List my staff.
     */
    static async listMyStaff(req, res) {
        try {
            const organizer = await prisma_1.prisma.organizerProfile.findUnique({
                where: { userId: req.user.userId }
            });
            if (!organizer)
                return res.status(403).json({ error: "Not an organizer profile." });
            const staff = await staff_service_1.StaffService.listStaff(organizer.id);
            res.json(staff);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Organizer: Remove a staff member.
     */
    static async removeStaff(req, res) {
        try {
            const { id } = req.params;
            const organizer = await prisma_1.prisma.organizerProfile.findUnique({
                where: { userId: req.user.userId }
            });
            if (!organizer)
                return res.status(403).json({ error: "Unauthorized." });
            await staff_service_1.StaffService.removeStaff(organizer.id, parseInt(id));
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.StaffController = StaffController;
