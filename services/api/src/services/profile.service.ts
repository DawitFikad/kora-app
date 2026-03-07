import { prisma } from "../lib/prisma";
import { Role, OrganizerStatus } from "@prisma/client";

export class ProfileService {
    // --- User Profile ---

    static async getUserProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                phoneNumber: true,
                email: true,
                role: true,
                profile: true
            }
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.profile) {
            // Lazy creation if somehow missing
            const profile = await prisma.userProfile.create({
                data: {
                    userId,
                    fullName: "",
                    language: "en",
                }
            });
            return { ...user, profile };
        }

        return user;
    }

    static async updateUserProfile(userId: number, data: {
        fullName?: string;
        avatarUrl?: string;
        bio?: string;
        gender?: string;
        birthDate?: string;
        language?: string;
        email?: string;
        location?: string;
        interests?: string[];
        notificationPreferences?: Record<string, any>;
    }) {
        const { email, birthDate, ...profileData } = data;

        // If email is provided, update the User model
        if (email) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { email }
                });
            } catch (error: any) {
                if (error.code === 'P2002') {
                    throw new Error("This email is already in use by another account.");
                }
                throw error;
            }
        }

        await (prisma as any).userProfile.update({
            where: { userId },
            data: {
                ...profileData,
                birthDate: birthDate ? new Date(birthDate) : undefined,
            },
        });

        // Return the full profile structure
        return this.getUserProfile(userId);
    }

    // --- Organizer Profile ---

    static async getOrganizerProfile(userId: number) {
        const organizer = await prisma.organizerProfile.findUnique({
            where: { userId },
        });

        if (!organizer) {
            throw new Error("Organizer profile not found. Please register as an organizer first.");
        }

        return organizer;
    }

    static async updateOrganizerProfile(userId: number, data: {
        organizationName?: string;
        contactPhone?: string;
        contactEmail?: string;
        city?: string;
        payoutDetails?: string;
    }) {
        const existing = await prisma.organizerProfile.findUnique({
            where: { userId }
        });

        if (!existing) {
            throw new Error("Organizer profile not found");
        }

        // If status was REJECTED, updating it might trigger a re-review?
        // Business rule: Default status remains same or goes back to PENDING?
        // Let's set it back to PENDING if it was REJECTED and they update it.
        const newStatus = existing.status === OrganizerStatus.REJECTED ? OrganizerStatus.PENDING : existing.status;

        return prisma.organizerProfile.update({
            where: { userId },
            data: {
                ...data,
                status: newStatus
            },
        });
    }

    // --- Admin Actions ---

    static async listAllOrganizers(status?: OrganizerStatus) {
        return prisma.organizerProfile.findMany({
            where: status ? { status } : undefined,
            include: {
                user: {
                    select: {
                        phoneNumber: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async reviewOrganizer(
        organizerProfileId: number,
        status: OrganizerStatus,
        adminNote?: string,
        feeType?: string,
        feeFixed?: number,
        feePercentage?: number
    ) {
        console.log(`[AdminReview] ID: ${organizerProfileId}, New Status: ${status}, Note: ${adminNote}`);
        const organizer = await prisma.organizerProfile.findUnique({
            where: { id: organizerProfileId }
        });

        if (!organizer) {
            throw new Error("Organizer not found");
        }

        const profile = await prisma.organizerProfile.update({
            where: { id: organizerProfileId },
            data: {
                status,
                adminNote,
                feeType,
                feeFixed,
                feePercentage
            },
        });

        // Also update User account status if approved
        if (status === OrganizerStatus.APPROVED) {
            await prisma.user.update({
                where: { id: organizer.userId },
                data: { status: 'ACTIVE' }
            });
        } else if (status === OrganizerStatus.REJECTED) {
            // Depending on business rules, maybe SUSPENDED if rejected?
            // Let's keep account ACTIVE but organizer profile REJECTED for now,
            // so they can log in and fix their profile.
        }

        return profile;
    }
}
