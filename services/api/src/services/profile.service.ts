import { prisma } from "../lib/prisma";
import { Role, OrganizerStatus } from "@prisma/client";

export class ProfileService {
    // --- User Profile ---

    static async getUserProfile(userId: number) {
        let profile = await prisma.userProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            // Lazy creation if somehow missing
            profile = await prisma.userProfile.create({
                data: {
                    userId,
                    fullName: "",
                    language: "en",
                }
            });
        }

        return profile;
    }

    static async updateUserProfile(userId: number, data: { fullName?: string; language?: string }) {
        return prisma.userProfile.update({
            where: { userId },
            data,
        });
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

    static async listAllOrganizers() {
        return prisma.organizerProfile.findMany({
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

    static async reviewOrganizer(organizerProfileId: number, status: OrganizerStatus, adminNote?: string) {
        const profile = await prisma.organizerProfile.update({
            where: { id: organizerProfileId },
            data: {
                status,
                adminNote
            },
        });

        return profile;
    }
}
