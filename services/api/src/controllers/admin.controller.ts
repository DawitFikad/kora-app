import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";
import { AdminAnalyticsService } from "../services/admin-analytics.service";

export class AdminController {
    static async getStats(req: Request, res: Response) {
        try {
            const stats = await AdminAnalyticsService.getPlatformStats();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getDetailedStats(req: Request, res: Response) {
        try {
            const stats = await AdminAnalyticsService.getDetailedAnalytics();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
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

    // Toggle Event Featured status
    static async toggleEventFeatured(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const { featured } = req.body;

            const updatedEvent = await prisma.event.update({
                where: { id: parseInt(eventId) },
                data: { featured: !!featured }
            });

            res.json({ success: true, featured: updatedEvent.featured });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
    // Get Admin Notifications
    static async getNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const notifications = await prisma.notificationLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 20
            });
            res.json({ success: true, data: notifications });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Respond to feature request (Approve/Reject)
    static async respondToFeatureRequest(req: Request, res: Response) {
        try {
            const { notificationId } = req.params;
            const { approved } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            const notif = await prisma.notificationLog.findUnique({ where: { id: Number(notificationId) } });
            if (!notif) return res.status(404).json({ error: "Request not found" });

            const meta = notif.metadata as any;
            if (meta?.type !== 'FEATURE_REQUEST') return res.status(400).json({ error: "Not a feature request" });

            const eventId = Number(meta.eventId);
            const organizerId = Number(meta.organizerId);

            if (approved) {
                await prisma.event.update({ where: { id: eventId }, data: { featured: true } });
                await prisma.notificationLog.create({
                    data: {
                        organizerId,
                        channel: 'PUSH',
                        recipient: 'System',
                        title: 'Feature Approved! 🌟',
                        content: 'Your event has been featured on the homepage.',
                        status: 'DELIVERED',
                        metadata: { type: 'FEATURE_APPROVED', eventId }
                    }
                });
            } else {
                await prisma.notificationLog.create({
                    data: {
                        organizerId,
                        channel: 'PUSH',
                        recipient: 'System',
                        title: 'Feature Request Declined',
                        content: 'Your feature request was reviewed but declined at this time.',
                        status: 'DELIVERED',
                        metadata: { type: 'FEATURE_DECLINED', eventId }
                    }
                });
            }

            // Remove the request log
            await prisma.notificationLog.delete({ where: { id: Number(notificationId) } });

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
