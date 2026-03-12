import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role, AccountStatus, OrganizerStatus, NotificationChannel, RefundReason, RefundStatus } from "@prisma/client";
import { AdminAnalyticsService } from "../services/admin-analytics.service";
import { EmailService } from "../services/email.service";
import { SystemConfigService } from "../services/system-config.service";

const BOOLEAN_CONFIG_KEYS = new Set([
    "maintenance_mode",
    "auth.mandatory_2fa",
    "notification.email_enabled",
    "notification.sms_enabled",
    "notification.push_enabled",
    "payment.chapa",
    "payment.telebirr",
    "payment.sandbox",
]);

const NUMBER_CONFIG_KEYS = new Set([
    "auth.session_timeout",
    "auth.max_attempts",
    "commission.default_rate",
    "commission.min_payout",
    "commission.fixed_fee",
    "event.seat_lock",
    "event.rescan_limit",
    "event.max_per_user",
    "homepage.banner_limit",
    "homepage.featured_count",
]);

const STRING_CONFIG_KEYS = new Set([
    "general.platform_name",
    "general.support_phone",
    "language.default",
    "language.supported",
]);

const ALLOWED_CONFIG_KEYS = new Set([
    ...BOOLEAN_CONFIG_KEYS,
    ...NUMBER_CONFIG_KEYS,
    ...STRING_CONFIG_KEYS,
]);

export class AdminController {
    static async getCancellationRequests(req: Request, res: Response) {
        try {
            const { status, page = 1, limit = 20 } = req.query as any;

            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const where: any = {
                recipient: 'Audit Log',
                title: 'Event Cancellation Request'
            };

            const [logs, total] = await Promise.all([
                prisma.notificationLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take
                }),
                prisma.notificationLog.count({ where })
            ]);

            const eventIds = Array.from(new Set(
                logs.map(l => Number((l.metadata as any)?.eventId)).filter(n => Number.isFinite(n))
            ));
            const organizerIds = Array.from(new Set(
                logs.map(l => Number((l.metadata as any)?.organizerId)).filter(n => Number.isFinite(n))
            ));

            const [events, organizers] = await Promise.all([
                eventIds.length
                    ? prisma.event.findMany({
                        where: { id: { in: eventIds } },
                        select: { id: true, title: true, status: true, dateTime: true }
                    })
                    : Promise.resolve([] as any[]),
                organizerIds.length
                    ? prisma.organizerProfile.findMany({
                        where: { id: { in: organizerIds } },
                        select: { id: true, organizationName: true, contactPhone: true, userId: true }
                    })
                    : Promise.resolve([] as any[])
            ]);

            const eventMap = new Map(events.map(e => [e.id, e] as const));
            const organizerMap = new Map(organizers.map(o => [o.id, o] as const));

            const items = logs.map(l => {
                const meta = (l.metadata as any) || {};
                const eventId = Number(meta.eventId);
                const organizerId = Number(meta.organizerId);
                const event = eventMap.get(eventId);
                const organizer = organizerMap.get(organizerId);

                let effectiveStatus = (meta.status as string) || 'PENDING';
                if (event?.status === 'CANCELLED') effectiveStatus = 'APPROVED';

                return {
                    id: l.id,
                    createdAt: l.createdAt,
                    content: l.content,
                    status: effectiveStatus,
                    metadata: meta,
                    event,
                    organizer
                };
            });

            const filtered = status ? items.filter(i => i.status === status) : items;

            res.json({
                success: true,
                data: filtered,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async approveCancellationRequest(req: Request, res: Response) {
        try {
            const adminUserId = (req as any).user?.userId;
            if (!adminUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const logId = Number(req.params.id);
            const { adminNote } = req.body || {};

            const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
            if (!log || log.recipient !== 'Audit Log' || log.title !== 'Event Cancellation Request') {
                return res.status(404).json({ success: false, message: 'Cancellation request not found' });
            }

            const meta = (log.metadata as any) || {};
            const eventId = Number(meta.eventId);
            const organizerId = Number(meta.organizerId);
            if (!eventId || !organizerId) {
                return res.status(400).json({ success: false, message: 'Invalid cancellation request metadata' });
            }

            const event = await prisma.event.findUnique({ where: { id: eventId } });
            if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

            if (event.status !== 'CANCELLED') {
                await prisma.event.update({ where: { id: eventId }, data: { status: 'CANCELLED' as any } });
            }

            // Notify all ticket holders immediately on admin-approved cancellation.
            const { EventService } = await import('../services/event.service');
            await EventService.notifyTicketHolders(eventId, {
                title: 'Event Cancelled',
                content: `${event.title} has been cancelled. Please check the app for refund details.`,
                channels: ['PUSH', 'SMS', 'EMAIL'],
                type: 'EVENT_CANCELLED',
                referenceId: eventId,
            });

            await prisma.notificationLog.update({
                where: { id: logId },
                data: {
                    metadata: {
                        ...meta,
                        status: 'APPROVED',
                        processedBy: adminUserId,
                        processedAt: new Date().toISOString(),
                        adminNote: adminNote || null
                    }
                }
            });

            // Notify organizer
            const organizer = await prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                select: { id: true, userId: true, organizationName: true }
            });
            if (organizer?.userId) {
                await prisma.notificationLog.create({
                    data: {
                        userId: organizer.userId,
                        organizerId,
                        channel: NotificationChannel.PUSH,
                        recipient: 'System',
                        title: 'Cancellation Approved',
                        content: `Your cancellation request for event "${event.title}" was approved. Refunds will be processed automatically.`,
                        status: 'DELIVERED',
                        metadata: { type: 'CANCELLATION_APPROVED', eventId, adminNote: adminNote || null }
                    }
                });
            }

            // Process refunds for all successful purchases for this event
            const purchases = await prisma.purchase.findMany({
                where: {
                    status: 'SUCCESS' as any,
                    tickets: { some: { eventId } }
                },
                select: { id: true, totalAmount: true }
            });

            const { RefundService } = await import('../services/refund.service');

            let refundsAttempted = 0;
            let refundsSucceeded = 0;
            let refundsFailed = 0;

            for (const p of purchases) {
                try {
                    // Find most recent refund, if any
                    const existing = await prisma.refund.findFirst({
                        where: { purchaseId: p.id },
                        orderBy: { createdAt: 'desc' }
                    });

                    let refundId: number | null = null;
                    if (existing?.status === RefundStatus.APPROVED) {
                        continue;
                    }

                    refundsAttempted++;

                    if (existing?.status === RefundStatus.PENDING) {
                        refundId = existing.id;
                    } else {
                        const created = await prisma.refund.create({
                            data: {
                                purchaseId: p.id,
                                amount: p.totalAmount,
                                reason: RefundReason.CANCELLATION,
                                description: 'Event cancelled (admin approved).',
                                status: RefundStatus.PENDING
                            }
                        });
                        refundId = created.id;
                    }

                    await RefundService.approveRefund(refundId, adminUserId);
                    refundsSucceeded++;
                } catch (e) {
                    refundsFailed++;
                }
            }

            // Store a small summary on the audit log
            await prisma.notificationLog.update({
                where: { id: logId },
                data: {
                    metadata: {
                        ...meta,
                        status: 'APPROVED',
                        processedBy: adminUserId,
                        processedAt: new Date().toISOString(),
                        adminNote: adminNote || null,
                        refundSummary: { purchases: purchases.length, refundsAttempted, refundsSucceeded, refundsFailed }
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    eventId,
                    status: 'APPROVED',
                    refundSummary: { purchases: purchases.length, refundsAttempted, refundsSucceeded, refundsFailed }
                }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async rejectCancellationRequest(req: Request, res: Response) {
        try {
            const adminUserId = (req as any).user?.userId;
            if (!adminUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const logId = Number(req.params.id);
            const { reason } = req.body || {};
            if (!reason || String(reason).trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Rejection reason is required' });
            }

            const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
            if (!log || log.recipient !== 'Audit Log' || log.title !== 'Event Cancellation Request') {
                return res.status(404).json({ success: false, message: 'Cancellation request not found' });
            }

            const meta = (log.metadata as any) || {};
            const eventId = Number(meta.eventId);
            const organizerId = Number(meta.organizerId);
            if (!eventId || !organizerId) {
                return res.status(400).json({ success: false, message: 'Invalid cancellation request metadata' });
            }

            const event = await prisma.event.findUnique({ where: { id: eventId } });

            await prisma.notificationLog.update({
                where: { id: logId },
                data: {
                    metadata: {
                        ...meta,
                        status: 'REJECTED',
                        processedBy: adminUserId,
                        processedAt: new Date().toISOString(),
                        rejectionReason: String(reason).trim()
                    }
                }
            });

            // Notify organizer
            const organizer = await prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                select: { id: true, userId: true }
            });
            if (organizer?.userId) {
                await prisma.notificationLog.create({
                    data: {
                        userId: organizer.userId,
                        organizerId,
                        channel: NotificationChannel.PUSH,
                        recipient: 'System',
                        title: 'Cancellation Rejected',
                        content: `Your cancellation request${event?.title ? ` for event "${event.title}"` : ''} was rejected: ${String(reason).trim()}`,
                        status: 'DELIVERED',
                        metadata: { type: 'CANCELLATION_REJECTED', eventId, reason: String(reason).trim() }
                    }
                });
            }

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

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

    // Create admin user (Direct)
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

    // Invite Admin (With Email Integration)
    static async inviteAdmin(req: Request, res: Response) {
        try {
            const { email, phoneNumber, fullName, role } = req.body;

            if (!email || !phoneNumber || !fullName) {
                return res.status(400).json({ error: "Email, Phone and Full Name are required" });
            }

            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber },
                        { email }
                    ]
                },
                include: { profile: true }
            });

            let admin: any = existingUser;

            if (existingUser) {
                // If user exists, update their role if provided, and prepare for resend
                admin = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        role: role === 'moderator' ? Role.ADMIN : Role.ADMIN,
                        status: AccountStatus.ACTIVE
                    },
                    include: { profile: true }
                });
                console.log(`[inviteAdmin] User ${email} already exists. Proceeding to resend invitation.`);
            } else {
                // Create new account
                admin = await prisma.user.create({
                    data: {
                        phoneNumber,
                        email,
                        role: role === 'moderator' ? Role.ADMIN : Role.ADMIN,
                        status: AccountStatus.ACTIVE,
                        profile: {
                            create: {
                                fullName,
                                language: "en"
                            }
                        }
                    },
                    include: { profile: true }
                });
            }

            if (!admin) throw new Error("Failed to create or find admin user");

            // Send Real Email
            const portalUrl = process.env.ADMIN_PORTAL_URL || "https://admin.ettickets.com";
            const emailHtml = EmailService.createAdminInvitationTemplate({
                fullName,
                role: role || 'admin',
                phoneNumber,
                portalUrl
            });

            console.log(`[inviteAdmin] Sending email to ${email}...`);
            const emailResult = await EmailService.sendEmail(
                email,
                "Invitation to join the ET-Ticket Admin Team",
                `Hello ${fullName}, you have been invited to join ET-Ticket as an ${role || 'admin'}. Visit ${portalUrl} to login with your phone: ${phoneNumber}.`,
                emailHtml
            );

            if (!emailResult) {
                console.warn(`[inviteAdmin] Email failed to send to ${email}, but account was created.`);
            }

            // Audit Log
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.userId || (req as any).user?.id,
                    channel: NotificationChannel.EMAIL,
                    recipient: email,
                    title: 'Admin Invited',
                    content: `Admin ${(req as any).user?.userId || (req as any).user?.id} invited ${fullName} (${email}) as ${role}`,
                    status: emailResult ? 'SENT' : 'FAILED',
                    metadata: { invitedUserId: admin.id, role }
                }
            });

            res.json({ success: true, message: emailResult ? "Invitation sent successfully" : "Account created but email failed to send" });
        } catch (error: any) {
            console.error("[inviteAdmin Error]", error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "User with this phone number or email already exists in our system." });
            }
            res.status(500).json({ error: error.message || "An unexpected error occurred while sending the invitation." });
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
            const currentUserId = (req as any).user.userId;
            const { recipient, page = 1, limit = 20 } = req.query as any;

            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const where: any = {};

            if (recipient === 'Audit Log') {
                where.recipient = 'Audit Log';
            } else {
                where.userId = currentUserId;
                if (recipient) where.recipient = recipient as string;
            }

            const [notifications, total] = await Promise.all([
                prisma.notificationLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take
                }),
                prisma.notificationLog.count({ where })
            ]);

            res.json({
                success: true,
                data: notifications,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async streamNotifications(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user.userId || (req as any).user.id;

            const makeWhere = () => ({
                OR: [
                    { userId: currentUserId },
                    { recipient: 'Audit Log' },
                ],
            });

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders?.();

            const writeEvent = (event: string, payload: any) => {
                res.write(`event: ${event}\n`);
                res.write(`data: ${JSON.stringify(payload)}\n\n`);
            };

            const fetchSnapshot = async () => {
                const where = makeWhere();
                const [latest, unreadCount] = await Promise.all([
                    prisma.notificationLog.findFirst({
                        where,
                        orderBy: { createdAt: "desc" },
                        select: { id: true, createdAt: true },
                    }),
                    prisma.notificationLog.count({
                        where: {
                            ...where,
                            isRead: false,
                        },
                    }),
                ]);

                return {
                    latestId: latest?.id || 0,
                    latestAt: latest?.createdAt || null,
                    unreadCount,
                };
            };

            let last = await fetchSnapshot();
            writeEvent("connected", { ok: true, ...last });

            const tick = setInterval(async () => {
                try {
                    const next = await fetchSnapshot();
                    if (next.latestId !== last.latestId || next.unreadCount !== last.unreadCount) {
                        last = next;
                        writeEvent("notifications", next);
                    }
                } catch (error: any) {
                    writeEvent("error", { message: error?.message || "Stream check failed" });
                }
            }, 2000);

            const keepAlive = setInterval(() => {
                res.write(": ping\n\n");
            }, 15000);

            req.on("close", () => {
                clearInterval(tick);
                clearInterval(keepAlive);
                res.end();
            });
        } catch (error: any) {
            console.error("Admin notifications stream error:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        }
    }

    // Delete a single notification/log
    static async deleteNotification(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.notificationLog.delete({ where: { id: Number(id) } });
            res.json({ success: true, message: "Log entry deleted" });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Clear all audit logs
    static async clearAuditLogs(req: Request, res: Response) {
        try {
            await prisma.notificationLog.deleteMany({
                where: { recipient: 'Audit Log' }
            });

            // Log this action itself!
            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Audit Logs Cleared',
                    content: `Admin ${(req as any).user?.userId} cleared the entire audit history.`,
                    status: 'DELIVERED'
                }
            });

            res.json({ success: true, message: "Audit history cleared" });
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

            // Also find organizers with custom fees (overrides)
            const overrides = await prisma.organizerProfile.findMany({
                where: {
                    OR: [
                        { feePercentage: { not: 10 } }, // Assuming 10 is the global default or looking for deviation
                        { feeFixed: { not: 0 } }
                    ]
                },
                select: {
                    id: true,
                    organizationName: true,
                    feePercentage: true,
                    feeFixed: true
                }
            });

            res.json({ success: true, data: configs, overrides });
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

            if (!key || typeof key !== 'string') {
                return res.status(400).json({ error: 'Config key is required' });
            }
            if (!ALLOWED_CONFIG_KEYS.has(key)) {
                return res.status(400).json({ error: `Unsupported config key: ${key}` });
            }
            if (typeof value !== 'string') {
                return res.status(400).json({ error: 'Config value must be a string' });
            }

            const normalizedValue = value.trim();
            if (BOOLEAN_CONFIG_KEYS.has(key)) {
                const lower = normalizedValue.toLowerCase();
                if (!["true", "false", "1", "0", "yes", "no", "on", "off"].includes(lower)) {
                    return res.status(400).json({ error: `Invalid boolean value for ${key}` });
                }
            }

            if (NUMBER_CONFIG_KEYS.has(key)) {
                const numeric = Number(normalizedValue);
                if (!Number.isFinite(numeric)) {
                    return res.status(400).json({ error: `Invalid numeric value for ${key}` });
                }
            }

            const config = await SystemConfigService.setConfig(key, normalizedValue, description);

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

    // Toggle payments read-only flag (preview mode for admins)
    static async togglePaymentsReadOnly(req: Request, res: Response) {
        try {
            const { enabled } = req.body;
            if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled boolean required' });

            const config = await prisma.systemConfig.upsert({
                where: { key: 'payments_read_only' },
                update: { value: JSON.stringify(enabled) },
                create: { key: 'payments_read_only', value: JSON.stringify(enabled), description: 'When true, payment actions are read-only for preview/testing' }
            });

            await prisma.notificationLog.create({
                data: {
                    userId: (req as any).user?.id,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Payments ReadOnly Toggled',
                    content: `Admin ${(req as any).user?.id} set payments_read_only to ${enabled}`,
                    status: 'DELIVERED',
                    metadata: { enabled }
                }
            });

            res.json({ success: true, data: config });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete a user
    static async deleteUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            // Block deleting self
            const requestingAdminId = (req as any).user?.userId || (req as any).user?.id;
            if (parseInt(userId) === requestingAdminId) {
                return res.status(400).json({ error: "You cannot delete your own administrative account." });
            }

            await prisma.user.delete({
                where: { id: parseInt(userId) }
            });

            // Audit Log
            await prisma.notificationLog.create({
                data: {
                    userId: requestingAdminId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Admin Deleted',
                    content: `Admin ${requestingAdminId} deleted user record for ID: ${userId}`,
                    status: 'DELIVERED',
                    metadata: { deletedUserId: userId }
                }
            });

            res.json({ success: true, message: "User deleted successfully" });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
