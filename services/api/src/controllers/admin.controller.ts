import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";
import { AdminAnalyticsService } from "../services/admin-analytics.service";

export class AdminController {
    static async getStats(req: Request, res: Response) {
        try {
            const stats = await AdminAnalyticsService.getPlatformStats();

            // Add Financial Clarity Metrics (Liability & Projections)
            const financials = await prisma.financialTransaction.aggregate({
                where: { status: 'SETTLED' },
                _sum: { amount: true, feeAmount: true, netAmount: true }
            });

            const statsWithFinancials = {
                ...stats,
                financials: {
                    totalRevenue: Number(financials._sum.amount || 0),
                    platformProfit: Number(financials._sum.feeAmount || 0),
                    organizerLiabilities: Number(financials._sum.netAmount || 0)
                }
            };

            res.json(statsWithFinancials);
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

            // Audit Log
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.id,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Event Featured Toggle',
                    content: `Admin ${(req as any).user?.id} toggled featured for event ${eventId} to ${!!featured}`,
                    status: 'DELIVERED',
                    metadata: { eventId, featured: !!featured }
                }
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

    // Get Platform Fee Configs
    static async getPlatformFees(req: Request, res: Response) {
        try {
            const configs = await prisma.platformFeeConfig.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: configs });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update or Create Default Platform Fee
    static async updatePlatformFee(req: Request, res: Response) {
        try {
            const { name, feeType, feeFixed, feePercentage, isDefault } = req.body;

            // If this is default, set others to non-default
            if (isDefault) {
                await prisma.platformFeeConfig.updateMany({
                    data: { isDefault: false }
                });
            }

            const config = await prisma.platformFeeConfig.upsert({
                where: { id: req.body.id || 0 },
                create: {
                    name: name || "Global Fee",
                    feeType: feeType || "PERCENTAGE",
                    feeFixed: feeFixed || 0,
                    feePercentage: feePercentage || 0,
                    isDefault: !!isDefault
                },
                update: {
                    name,
                    feeType,
                    feeFixed,
                    feePercentage,
                    isDefault: !!isDefault
                }
            });

            // Audit Log
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.id,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Platform Fee Updated',
                    content: `Admin ${(req as any).user?.id} updated platform fee: ${config.name}`,
                    status: 'DELIVERED',
                    metadata: { configId: config.id, config }
                }
            });

            res.json({ success: true, data: config });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getSystemConfigs(req: Request, res: Response) {
        try {
            const configs = await prisma.systemConfig.findMany();
            res.json(configs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateSystemConfig(req: Request, res: Response) {
        try {
            const { key, value, description } = req.body;
            const config = await prisma.systemConfig.upsert({
                where: { key },
                update: { value, description },
                create: { key, value, description }
            });

            // Audit Log
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'System Config Updated',
                    content: `Admin ${(req as any).user?.userId} updated system config: ${key} to ${value}`,
                    status: 'DELIVERED',
                    metadata: { key, value }
                }
            });

            res.json({ success: true, data: config });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
