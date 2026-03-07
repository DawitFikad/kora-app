import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { NotificationChannel, StaffRole } from "@prisma/client";

import { SmsService } from "./sms.service";
import { NotificationService } from "./notification.service";

export class StaffService {
    static async getPendingInvitationForUser(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { phoneNumber: true }
        });

        if (!user?.phoneNumber) return null;

        const invitation = await prisma.staffInvitation.findFirst({
            where: {
                phoneNumber: user.phoneNumber,
                isUsed: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                organizer: {
                    select: {
                        id: true,
                        organizationName: true
                    }
                }
            }
        });

        if (!invitation) return null;

        return {
            id: invitation.id,
            organizerId: invitation.organizer.id,
            organizationName: invitation.organizer.organizationName,
            role: invitation.role,
            expiresAt: invitation.expiresAt
        };
    }

    /**
     * Creates an invitation for a staff member.
     */
    static async inviteStaff(organizerId: number, phoneNumber: string, role: StaffRole = StaffRole.SCANNER) {
        // Check if staff already exists
        const existingStaff = await prisma.organizerStaff.findFirst({
            where: {
                organizerId,
                user: { phoneNumber }
            }
        });

        if (existingStaff) throw new Error("This user is already part of your staff.");

        // Generate a simple 6-digit invite code
        const inviteCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const invitation = await prisma.staffInvitation.create({
            data: {
                organizerId,
                phoneNumber,
                inviteCode,
                role,
                expiresAt
            }
        });

        const organizer = await prisma.organizerProfile.findUnique({
            where: { id: organizerId },
            select: { organizationName: true },
        });
        const organizerName = organizer?.organizationName || `Organizer ${organizerId}`;

        // Send SMS to the invited staff member
        const message = `You have been invited to join the staff team for ${organizerName} as ${role}. Use code: ${inviteCode}. Expires in 24 hours.`;
        await SmsService.sendSms(phoneNumber, message);

        // If the invited phone already belongs to a registered user, also notify in-app and email.
        const invitedUser = await prisma.user.findUnique({
            where: { phoneNumber },
            select: { id: true },
        });

        if (invitedUser) {
            await NotificationService.notifyUser(invitedUser.id, {
                title: "Staff Team Invitation",
                content: `You have been invited to join the staff team for ${organizerName} as ${role}. Open the app to accept or decline.`,
                channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
                type: "STAFF_INVITATION",
                referenceId: invitation.id,
                metadata: {
                    invitationId: invitation.id,
                    role,
                    organizerId,
                    inviteCode,
                    actionPath: "/profile",
                    actions: ["ACCEPT", "DECLINE"],
                },
            });
        }

        console.log(`[STAFF INVITE] Created invite for ${phoneNumber}: ${inviteCode}`);

        return invitation;
    }

    /**
     * Redeems an invitation.
     */
    static async acceptInvitation(userId: number, inviteCode: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        const invitation = await prisma.staffInvitation.findUnique({
            where: { inviteCode }
        });

        if (!invitation || invitation.isUsed) throw new Error("Invalid or used invitation code.");
        if (invitation.expiresAt < new Date()) throw new Error("Invitation has expired.");
        if (invitation.phoneNumber !== user.phoneNumber) throw new Error("This invitation was sent to a different phone number.");

        return await prisma.$transaction(async (tx) => {
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
                data: { role: invitation.role as any } // "SCANNER" or "MANAGER"
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
    static async listStaff(organizerId: number) {
        return prisma.organizerStaff.findMany({
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
    static async removeStaff(organizerId: number, staffId: number) {
        return prisma.organizerStaff.delete({
            where: {
                id: staffId,
                organizerId // Security check
            }
        });
    }

    /**
     * Checks if a user is staff for a specific organizer.
     */
    static async isStaff(organizerId: number, userId: number): Promise<boolean> {
        const staff = await prisma.organizerStaff.findFirst({
            where: { organizerId, userId }
        });
        return !!staff;
    }
}
