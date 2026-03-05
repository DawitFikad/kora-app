"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const sms_service_1 = require("./sms.service");
class StaffService {
    /**
     * Creates an invitation for a staff member.
     */
    static async inviteStaff(organizerId, phoneNumber, role = client_1.StaffRole.SCANNER) {
        // Check if staff already exists
        const existingStaff = await prisma_1.prisma.organizerStaff.findFirst({
            where: {
                organizerId,
                user: { phoneNumber }
            }
        });
        if (existingStaff)
            throw new Error("This user is already part of your staff.");
        // Generate a simple 6-digit invite code
        const inviteCode = crypto_1.default.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const invitation = await prisma_1.prisma.staffInvitation.create({
            data: {
                organizerId,
                phoneNumber,
                inviteCode,
                role,
                expiresAt
            }
        });
        // Send SMS to the invited staff member
        const message = `You have been invited to join the staff team on ET-Ticket. Use code: ${inviteCode} to join. Expires in 24 hours.`;
        await sms_service_1.SmsService.sendSms(phoneNumber, message);
        console.log(`[STAFF INVITE] Created invite for ${phoneNumber}: ${inviteCode}`);
        return invitation;
    }
    /**
     * Redeems an invitation.
     */
    static async acceptInvitation(userId, inviteCode) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("User not found");
        const invitation = await prisma_1.prisma.staffInvitation.findUnique({
            where: { inviteCode }
        });
        if (!invitation || invitation.isUsed)
            throw new Error("Invalid or used invitation code.");
        if (invitation.expiresAt < new Date())
            throw new Error("Invitation has expired.");
        if (invitation.phoneNumber !== user.phoneNumber)
            throw new Error("This invitation was sent to a different phone number.");
        return await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Create Staff record
            const staff = await tx.organizerStaff.create({
                data: {
                    organizerId: invitation.organizerId,
                    userId: user.id,
                    role: invitation.role
                }
            });
            // 1.5 Update User Role 
            //(Assuming we want to reflect their new main role, or at least grant permissions)
            await tx.user.update({
                where: { id: user.id },
                data: { role: invitation.role } // "SCANNER" or "MANAGER"
            });
            // 2. Mark invitation as used
            await tx.staffInvitation.update({
                where: { id: invitation.id },
                data: { isUsed: true }
            });
            return staff;
        });
    }
    /**
     * Lists all staff for an organizer.
     */
    static async listStaff(organizerId) {
        return prisma_1.prisma.organizerStaff.findMany({
            where: { organizerId },
            include: {
                user: {
                    select: {
                        phoneNumber: true,
                        profile: { select: { fullName: true, avatarUrl: true } }
                    }
                }
            }
        });
    }
    /**
     * Removes a staff member.
     */
    static async removeStaff(organizerId, staffId) {
        return prisma_1.prisma.organizerStaff.delete({
            where: {
                id: staffId,
                organizerId // Security check
            }
        });
    }
    /**
     * Checks if a user is staff for a specific organizer.
     */
    static async isStaff(organizerId, userId) {
        const staff = await prisma_1.prisma.organizerStaff.findFirst({
            where: { organizerId, userId }
        });
        return !!staff;
    }
}
exports.StaffService = StaffService;
