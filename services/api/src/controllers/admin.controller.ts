import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";

export class AdminController {
    // Get all users with optional filters
    static async getAllUsers(req: Request, res: Response) {
        try {
            const { role, status } = req.query;

            const filters: any = {};
            if (role) filters.role = role as Role;
            if (status) filters.status = status as AccountStatus;

            const users = await prisma.user.findMany({
                where: filters,
                include: {
                    profile: true
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ users, count: users.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Approve a pending organizer (Deprecated: Should use ProfileController's reviewOrganizer)
    static async approveOrganizer(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId) },
                include: { organizer: true }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (user.role !== Role.ORGANIZER) {
                return res.status(400).json({ error: "User is not an organizer" });
            }

            // Update both account status and organizer profile status
            await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: AccountStatus.ACTIVE }
            });

            if (user.organizer) {
                await prisma.organizerProfile.update({
                    where: { id: user.organizer.id },
                    data: { status: OrganizerStatus.APPROVED }
                });
            }

            res.json({ message: "Organizer approved successfully" });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Suspend a user
    static async suspendUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const updatedUser = await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: AccountStatus.SUSPENDED }
            });

            res.json({
                message: "User suspended successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    status: updatedUser.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Activate a suspended user
    static async activateUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const updatedUser = await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: AccountStatus.ACTIVE }
            });

            res.json({
                message: "User activated successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    status: updatedUser.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Create admin user
    static async createAdmin(req: Request, res: Response) {
        try {
            const { phoneNumber, email, firstName, lastName } = req.body;

            if (!phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
            }

            const existingUser = await prisma.user.findUnique({
                where: { phoneNumber }
            });

            if (existingUser) {
                return res.status(400).json({ error: "User with this phone number already exists" });
            }

            const admin = await prisma.user.create({
                data: {
                    phoneNumber,
                    email,
                    role: Role.ADMIN,
                    status: AccountStatus.ACTIVE,
                    profile: {
                        create: {
                            fullName: `${firstName || ""} ${lastName || ""}`.trim() || null,
                            language: "en"
                        }
                    }
                },
                include: {
                    profile: true
                }
            });

            res.json({
                message: "Admin created successfully",
                admin: {
                    id: admin.id,
                    phoneNumber: admin.phoneNumber,
                    email: admin.email,
                    role: admin.role,
                    status: admin.status
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
