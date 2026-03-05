"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const admin_analytics_service_1 = require("../services/admin-analytics.service");
const email_service_1 = require("../services/email.service");
class AdminController {
    static async getCancellationRequests(req, res) {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);
            const where = {
                recipient: 'Audit Log',
                title: 'Event Cancellation Request'
            };
            const [logs, total] = await Promise.all([
                prisma_1.prisma.notificationLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take
                }),
                prisma_1.prisma.notificationLog.count({ where })
            ]);
            const eventIds = Array.from(new Set(logs.map(l => Number(l.metadata?.eventId)).filter(n => Number.isFinite(n))));
            const organizerIds = Array.from(new Set(logs.map(l => Number(l.metadata?.organizerId)).filter(n => Number.isFinite(n))));
            const [events, organizers] = await Promise.all([
                eventIds.length
                    ? prisma_1.prisma.event.findMany({
                        where: { id: { in: eventIds } },
                        select: { id: true, title: true, status: true, dateTime: true }
                    })
                    : Promise.resolve([]),
                organizerIds.length
                    ? prisma_1.prisma.organizerProfile.findMany({
                        where: { id: { in: organizerIds } },
                        select: { id: true, organizationName: true, contactPhone: true, userId: true }
                    })
                    : Promise.resolve([])
            ]);
            const eventMap = new Map(events.map(e => [e.id, e]));
            const organizerMap = new Map(organizers.map(o => [o.id, o]));
            const items = logs.map(l => {
                const meta = l.metadata || {};
                const eventId = Number(meta.eventId);
                const organizerId = Number(meta.organizerId);
                const event = eventMap.get(eventId);
                const organizer = organizerMap.get(organizerId);
                let effectiveStatus = meta.status || 'PENDING';
                if (event?.status === 'CANCELLED')
                    effectiveStatus = 'APPROVED';
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async approveCancellationRequest(req, res) {
        try {
            const adminUserId = req.user?.userId;
            if (!adminUserId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const logId = Number(req.params.id);
            const { adminNote } = req.body || {};
            const log = await prisma_1.prisma.notificationLog.findUnique({ where: { id: logId } });
            if (!log || log.recipient !== 'Audit Log' || log.title !== 'Event Cancellation Request') {
                return res.status(404).json({ success: false, message: 'Cancellation request not found' });
            }
            const meta = log.metadata || {};
            const eventId = Number(meta.eventId);
            const organizerId = Number(meta.organizerId);
            if (!eventId || !organizerId) {
                return res.status(400).json({ success: false, message: 'Invalid cancellation request metadata' });
            }
            const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
            if (!event)
                return res.status(404).json({ success: false, message: 'Event not found' });
            if (event.status !== 'CANCELLED') {
                await prisma_1.prisma.event.update({ where: { id: eventId }, data: { status: 'CANCELLED' } });
            }
            await prisma_1.prisma.notificationLog.update({
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
            const organizer = await prisma_1.prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                select: { id: true, userId: true, organizationName: true }
            });
            if (organizer?.userId) {
                await prisma_1.prisma.notificationLog.create({
                    data: {
                        userId: organizer.userId,
                        organizerId,
                        channel: client_1.NotificationChannel.PUSH,
                        recipient: 'System',
                        title: 'Cancellation Approved',
                        content: `Your cancellation request for event "${event.title}" was approved. Refunds will be processed automatically.`,
                        status: 'DELIVERED',
                        metadata: { type: 'CANCELLATION_APPROVED', eventId, adminNote: adminNote || null }
                    }
                });
            }
            // Process refunds for all successful purchases for this event
            const purchases = await prisma_1.prisma.purchase.findMany({
                where: {
                    status: 'SUCCESS',
                    tickets: { some: { eventId } }
                },
                select: { id: true, totalAmount: true }
            });
            const { RefundService } = await Promise.resolve().then(() => __importStar(require('../services/refund.service')));
            let refundsAttempted = 0;
            let refundsSucceeded = 0;
            let refundsFailed = 0;
            for (const p of purchases) {
                try {
                    // Find most recent refund, if any
                    const existing = await prisma_1.prisma.refund.findFirst({
                        where: { purchaseId: p.id },
                        orderBy: { createdAt: 'desc' }
                    });
                    let refundId = null;
                    if (existing?.status === client_1.RefundStatus.APPROVED) {
                        continue;
                    }
                    refundsAttempted++;
                    if (existing?.status === client_1.RefundStatus.PENDING) {
                        refundId = existing.id;
                    }
                    else {
                        const created = await prisma_1.prisma.refund.create({
                            data: {
                                purchaseId: p.id,
                                amount: p.totalAmount,
                                reason: client_1.RefundReason.CANCELLATION,
                                description: 'Event cancelled (admin approved).',
                                status: client_1.RefundStatus.PENDING
                            }
                        });
                        refundId = created.id;
                    }
                    await RefundService.approveRefund(refundId, adminUserId);
                    refundsSucceeded++;
                }
                catch (e) {
                    refundsFailed++;
                }
            }
            // Store a small summary on the audit log
            await prisma_1.prisma.notificationLog.update({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async rejectCancellationRequest(req, res) {
        try {
            const adminUserId = req.user?.userId;
            if (!adminUserId)
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            const logId = Number(req.params.id);
            const { reason } = req.body || {};
            if (!reason || String(reason).trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Rejection reason is required' });
            }
            const log = await prisma_1.prisma.notificationLog.findUnique({ where: { id: logId } });
            if (!log || log.recipient !== 'Audit Log' || log.title !== 'Event Cancellation Request') {
                return res.status(404).json({ success: false, message: 'Cancellation request not found' });
            }
            const meta = log.metadata || {};
            const eventId = Number(meta.eventId);
            const organizerId = Number(meta.organizerId);
            if (!eventId || !organizerId) {
                return res.status(400).json({ success: false, message: 'Invalid cancellation request metadata' });
            }
            const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
            await prisma_1.prisma.notificationLog.update({
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
            const organizer = await prisma_1.prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                select: { id: true, userId: true }
            });
            if (organizer?.userId) {
                await prisma_1.prisma.notificationLog.create({
                    data: {
                        userId: organizer.userId,
                        organizerId,
                        channel: client_1.NotificationChannel.PUSH,
                        recipient: 'System',
                        title: 'Cancellation Rejected',
                        content: `Your cancellation request${event?.title ? ` for event "${event.title}"` : ''} was rejected: ${String(reason).trim()}`,
                        status: 'DELIVERED',
                        metadata: { type: 'CANCELLATION_REJECTED', eventId, reason: String(reason).trim() }
                    }
                });
            }
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getStats(req, res) {
        try {
            const stats = await admin_analytics_service_1.AdminAnalyticsService.getPlatformStats();
            // Add Financial Clarity Metrics (Liability & Projections)
            const financials = await prisma_1.prisma.financialTransaction.aggregate({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getDetailedStats(req, res) {
        try {
            const stats = await admin_analytics_service_1.AdminAnalyticsService.getDetailedAnalytics();
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Get all users with optional filters
    static async getAllUsers(req, res) {
        try {
            const { role, status } = req.query;
            const filters = {};
            if (role)
                filters.role = role;
            if (status)
                filters.status = status;
            const users = await prisma_1.prisma.user.findMany({
                where: filters,
                include: {
                    profile: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ users, count: users.length });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Approve a pending organizer (Deprecated: Should use ProfileController's reviewOrganizer)
    static async approveOrganizer(req, res) {
        try {
            const { userId } = req.params;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: parseInt(userId) },
                include: { organizer: true }
            });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            if (user.role !== client_1.Role.ORGANIZER) {
                return res.status(400).json({ error: "User is not an organizer" });
            }
            // Update both account status and organizer profile status
            await prisma_1.prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: client_1.AccountStatus.ACTIVE }
            });
            if (user.organizer) {
                await prisma_1.prisma.organizerProfile.update({
                    where: { id: user.organizer.id },
                    data: { status: client_1.OrganizerStatus.APPROVED }
                });
            }
            res.json({ message: "Organizer approved successfully" });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Suspend a user
    static async suspendUser(req, res) {
        try {
            const { userId } = req.params;
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: client_1.AccountStatus.SUSPENDED }
            });
            res.json({
                message: "User suspended successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    status: updatedUser.status
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Activate a suspended user
    static async activateUser(req, res) {
        try {
            const { userId } = req.params;
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: parseInt(userId) },
                data: { status: client_1.AccountStatus.ACTIVE }
            });
            res.json({
                message: "User activated successfully",
                user: {
                    id: updatedUser.id,
                    phoneNumber: updatedUser.phoneNumber,
                    status: updatedUser.status
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Create admin user (Direct)
    static async createAdmin(req, res) {
        try {
            const { phoneNumber, email, firstName, lastName } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
            }
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { phoneNumber }
            });
            if (existingUser) {
                return res.status(400).json({ error: "User with this phone number already exists" });
            }
            const admin = await prisma_1.prisma.user.create({
                data: {
                    phoneNumber,
                    email,
                    role: client_1.Role.ADMIN,
                    status: client_1.AccountStatus.ACTIVE,
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Invite Admin (With Email Integration)
    static async inviteAdmin(req, res) {
        try {
            const { email, phoneNumber, fullName, role } = req.body;
            if (!email || !phoneNumber || !fullName) {
                return res.status(400).json({ error: "Email, Phone and Full Name are required" });
            }
            // Check if user already exists
            const existingUser = await prisma_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber },
                        { email }
                    ]
                },
                include: { profile: true }
            });
            let admin = existingUser;
            if (existingUser) {
                // If user exists, update their role if provided, and prepare for resend
                admin = await prisma_1.prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        role: role === 'moderator' ? client_1.Role.ADMIN : client_1.Role.ADMIN,
                        status: client_1.AccountStatus.ACTIVE
                    },
                    include: { profile: true }
                });
                console.log(`[inviteAdmin] User ${email} already exists. Proceeding to resend invitation.`);
            }
            else {
                // Create new account
                admin = await prisma_1.prisma.user.create({
                    data: {
                        phoneNumber,
                        email,
                        role: role === 'moderator' ? client_1.Role.ADMIN : client_1.Role.ADMIN,
                        status: client_1.AccountStatus.ACTIVE,
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
            if (!admin)
                throw new Error("Failed to create or find admin user");
            // Send Real Email
            const portalUrl = process.env.ADMIN_PORTAL_URL || "https://admin.ettickets.com";
            const emailHtml = email_service_1.EmailService.createAdminInvitationTemplate({
                fullName,
                role: role || 'admin',
                phoneNumber,
                portalUrl
            });
            console.log(`[inviteAdmin] Sending email to ${email}...`);
            const emailResult = await email_service_1.EmailService.sendEmail(email, "Invitation to join the ET-Ticket Admin Team", `Hello ${fullName}, you have been invited to join ET-Ticket as an ${role || 'admin'}. Visit ${portalUrl} to login with your phone: ${phoneNumber}.`, emailHtml);
            if (!emailResult) {
                console.warn(`[inviteAdmin] Email failed to send to ${email}, but account was created.`);
            }
            // Audit Log
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId: req.user?.userId || req.user?.id,
                    channel: client_1.NotificationChannel.EMAIL,
                    recipient: email,
                    title: 'Admin Invited',
                    content: `Admin ${req.user?.userId || req.user?.id} invited ${fullName} (${email}) as ${role}`,
                    status: emailResult ? 'SENT' : 'FAILED',
                    metadata: { invitedUserId: admin.id, role }
                }
            });
            res.json({ success: true, message: emailResult ? "Invitation sent successfully" : "Account created but email failed to send" });
        }
        catch (error) {
            console.error("[inviteAdmin Error]", error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "User with this phone number or email already exists in our system." });
            }
            res.status(500).json({ error: error.message || "An unexpected error occurred while sending the invitation." });
        }
    }
    // Toggle Event Featured status
    static async toggleEventFeatured(req, res) {
        try {
            const { eventId } = req.params;
            const { featured } = req.body;
            const updatedEvent = await prisma_1.prisma.event.update({
                where: { id: parseInt(eventId) },
                data: { featured: !!featured }
            });
            // Audit Log
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId: req.user?.id,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Event Featured Toggle',
                    content: `Admin ${req.user?.id} toggled featured for event ${eventId} to ${!!featured}`,
                    status: 'DELIVERED',
                    metadata: { eventId, featured: !!featured }
                }
            });
            res.json({ success: true, featured: updatedEvent.featured });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Get Admin Notifications
    static async getNotifications(req, res) {
        try {
            const currentUserId = req.user.userId;
            const { recipient, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);
            const where = {};
            if (recipient === 'Audit Log') {
                where.recipient = 'Audit Log';
            }
            else {
                where.userId = currentUserId;
                if (recipient)
                    where.recipient = recipient;
            }
            const [notifications, total] = await Promise.all([
                prisma_1.prisma.notificationLog.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take
                }),
                prisma_1.prisma.notificationLog.count({ where })
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Delete a single notification/log
    static async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            await prisma_1.prisma.notificationLog.delete({ where: { id: Number(id) } });
            res.json({ success: true, message: "Log entry deleted" });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Clear all audit logs
    static async clearAuditLogs(req, res) {
        try {
            await prisma_1.prisma.notificationLog.deleteMany({
                where: { recipient: 'Audit Log' }
            });
            // Log this action itself!
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId: req.user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Audit Logs Cleared',
                    content: `Admin ${req.user?.userId} cleared the entire audit history.`,
                    status: 'DELIVERED'
                }
            });
            res.json({ success: true, message: "Audit history cleared" });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Respond to feature request (Approve/Reject)
    static async respondToFeatureRequest(req, res) {
        try {
            const { notificationId } = req.params;
            const { approved } = req.body;
            const prisma = (await Promise.resolve().then(() => __importStar(require("../lib/prisma")))).prisma;
            const notif = await prisma.notificationLog.findUnique({ where: { id: Number(notificationId) } });
            if (!notif)
                return res.status(404).json({ error: "Request not found" });
            const meta = notif.metadata;
            if (meta?.type !== 'FEATURE_REQUEST')
                return res.status(400).json({ error: "Not a feature request" });
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
            }
            else {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Get Platform Fee Configs
    static async getPlatformFees(req, res) {
        try {
            const configs = await prisma_1.prisma.platformFeeConfig.findMany({
                orderBy: { createdAt: 'desc' }
            });
            // Also find organizers with custom fees (overrides)
            const overrides = await prisma_1.prisma.organizerProfile.findMany({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Update or Create Default Platform Fee
    static async updatePlatformFee(req, res) {
        try {
            const { name, feeType, feeFixed, feePercentage, isDefault } = req.body;
            // If this is default, set others to non-default
            if (isDefault) {
                await prisma_1.prisma.platformFeeConfig.updateMany({
                    data: { isDefault: false }
                });
            }
            const config = await prisma_1.prisma.platformFeeConfig.upsert({
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
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId: req.user?.id,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Platform Fee Updated',
                    content: `Admin ${req.user?.id} updated platform fee: ${config.name}`,
                    status: 'DELIVERED',
                    metadata: { configId: config.id, config }
                }
            });
            res.json({ success: true, data: config });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getSystemConfigs(req, res) {
        try {
            const configs = await prisma_1.prisma.systemConfig.findMany();
            res.json(configs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async updateSystemConfig(req, res) {
        try {
            const { key, value, description } = req.body;
            const config = await prisma_1.prisma.systemConfig.upsert({
                where: { key },
                update: { value, description },
                create: { key, value, description }
            });
            // Audit Log
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId: req.user?.userId,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'System Config Updated',
                    content: `Admin ${req.user?.userId} updated system config: ${key} to ${value}`,
                    status: 'DELIVERED',
                    metadata: { key, value }
                }
            });
            res.json({ success: true, data: config });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Toggle payments read-only flag (preview mode for admins)
    static async togglePaymentsReadOnly(req, res) {
        try {
            const { enabled } = req.body;
            if (typeof enabled !== 'boolean')
                return res.status(400).json({ error: 'enabled boolean required' });
            const config = await prisma_1.prisma.systemConfig.upsert({
                where: { key: 'payments_read_only' },
                update: { value: JSON.stringify(enabled) },
                create: { key: 'payments_read_only', value: JSON.stringify(enabled), description: 'When true, payment actions are read-only for preview/testing' }
            });
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId: req.user?.id,
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Payments ReadOnly Toggled',
                    content: `Admin ${req.user?.id} set payments_read_only to ${enabled}`,
                    status: 'DELIVERED',
                    metadata: { enabled }
                }
            });
            res.json({ success: true, data: config });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Delete a user
    static async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            // Block deleting self
            const requestingAdminId = req.user?.userId || req.user?.id;
            if (parseInt(userId) === requestingAdminId) {
                return res.status(400).json({ error: "You cannot delete your own administrative account." });
            }
            await prisma_1.prisma.user.delete({
                where: { id: parseInt(userId) }
            });
            // Audit Log
            await prisma_1.prisma.notificationLog.create({
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.AdminController = AdminController;
