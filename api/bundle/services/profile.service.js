"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class ProfileService {
    // --- User Profile ---
    static async getUserProfile(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
            const profile = await prisma_1.prisma.userProfile.create({
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
    static async updateUserProfile(userId, data) {
        const { email, birthDate, ...profileData } = data;
        // If email is provided, update the User model
        if (email) {
            try {
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { email }
                });
            }
            catch (error) {
                if (error.code === 'P2002') {
                    throw new Error("This email is already in use by another account.");
                }
                throw error;
            }
        }
        await prisma_1.prisma.userProfile.update({
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
    static async getOrganizerProfile(userId) {
        const organizer = await prisma_1.prisma.organizerProfile.findUnique({
            where: { userId },
        });
        if (!organizer) {
            throw new Error("Organizer profile not found. Please register as an organizer first.");
        }
        return organizer;
    }
    static async updateOrganizerProfile(userId, data) {
        const existing = await prisma_1.prisma.organizerProfile.findUnique({
            where: { userId }
        });
        if (!existing) {
            throw new Error("Organizer profile not found");
        }
        // If status was REJECTED, updating it might trigger a re-review?
        // Business rule: Default status remains same or goes back to PENDING?
        // Let's set it back to PENDING if it was REJECTED and they update it.
        const newStatus = existing.status === client_1.OrganizerStatus.REJECTED ? client_1.OrganizerStatus.PENDING : existing.status;
        return prisma_1.prisma.organizerProfile.update({
            where: { userId },
            data: {
                ...data,
                status: newStatus
            },
        });
    }
    // --- Admin Actions ---
    static async listAllOrganizers(status) {
        return prisma_1.prisma.organizerProfile.findMany({
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
    static async reviewOrganizer(organizerProfileId, status, adminNote, feeType, feeFixed, feePercentage) {
        console.log(`[AdminReview] ID: ${organizerProfileId}, New Status: ${status}, Note: ${adminNote}`);
        const organizer = await prisma_1.prisma.organizerProfile.findUnique({
            where: { id: organizerProfileId }
        });
        if (!organizer) {
            throw new Error("Organizer not found");
        }
        const profile = await prisma_1.prisma.organizerProfile.update({
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
        if (status === client_1.OrganizerStatus.APPROVED) {
            await prisma_1.prisma.user.update({
                where: { id: organizer.userId },
                data: { status: 'ACTIVE' }
            });
        }
        else if (status === client_1.OrganizerStatus.REJECTED) {
            // Depending on business rules, maybe SUSPENDED if rejected?
            // Let's keep account ACTIVE but organizer profile REJECTED for now,
            // so they can log in and fix their profile.
        }
        return profile;
    }
}
exports.ProfileService = ProfileService;
