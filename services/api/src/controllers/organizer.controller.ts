/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { EventOperationsService } from "../services/event-operations.service";

export class OrganizerController {
    /**
     * GET /api/organizer/events/:id/dashboard
     */
    static async getDashboard(req: Request, res: Response) {
        try {
            const eventId = parseInt(req.params.id);
            const organizerId = (req as any).user.organizerId;

            if (!organizerId) {
                return res.status(403).json({ success: false, message: "Only organizers can access this dashboard." });
            }

            const dashboard = await EventOperationsService.getEventOperationsSummary(eventId, organizerId);
            res.json({ success: true, data: dashboard });
        } catch (error: any) {
            res.status(error.message.includes("access denied") ? 403 : 500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/organizer/overview
     * Aggregated stats for the organizer dashboard.
     */
    static async getOverview(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;

            if (!organizerId) {
                return res.status(403).json({ success: false, message: "Only organizers can access this dashboard." });
            }

            const summary = await EventOperationsService.getOrganizerSummary(organizerId);
            res.json({ success: true, data: summary });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/events
     * List events for the logged-in organizer.
     */
    static async getMyEvents(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            const prisma = (await import("../lib/prisma")).prisma;

            const events = await prisma.event.findMany({
                where: { organizerId },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    dateTime: true,
                    venue: true,
                    coverImage: true,
                    featured: true,
                    _count: {
                        select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } }
                    },
                    tiers: {
                        select: { capacity: true }
                    }
                }
            });

            // Check Logs for persistent status (Pending or Rejected)
            const logs = await prisma.notificationLog.findMany({
                where: { organizerId },
                select: { metadata: true },
                orderBy: { createdAt: 'desc' }
            });

            const eventStatusMap = new Map<number, string>();
            logs.forEach(log => {
                const meta = log.metadata as any;
                if (!meta?.eventId) return;
                const eid = Number(meta.eventId);

                // Only consider the latest relevant log for each event
                if (!eventStatusMap.has(eid)) {
                    if (meta.type === 'FEATURE_REQUEST') eventStatusMap.set(eid, 'PENDING');
                    else if (meta.type === 'FEATURE_DECLINED') eventStatusMap.set(eid, 'REJECTED');
                }
            });

            // Calculate formatted events
            const formattedEvents = events.map(event => ({
                ...event,
                totalCapacity: event.tiers.reduce((sum, tier) => sum + tier.capacity, 0),
                featureStatus: event.featured ? 'APPROVED' : (eventStatusMap.get(event.id) || 'NONE')
            }));

            res.json({ success: true, data: formattedEvents });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/attendees
     * List all attendees (ticket holders) for the organizer's events.
     */
    static async getAttendees(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            const prisma = (await import("../lib/prisma")).prisma;

            const tickets = await prisma.ticket.findMany({
                where: {
                    event: { organizerId }
                },
                include: {
                    user: {
                        include: { profile: true }
                    },
                    event: {
                        select: { title: true }
                    },
                    tier: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50 // Limit for now
            });

            const formattedAttendees = tickets.map(t => ({
                id: t.id,
                name: t.user.profile?.fullName || t.user.phoneNumber,
                event: t.event.title,
                type: t.tier.name,
                date: t.createdAt,
                status: t.status === "USED" ? "Checked In" : "Valid"
            }));

            res.json({ success: true, data: formattedAttendees });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/financials
     */
    static async getFinancials(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const financials = await EventOperationsService.getOrganizerFinancials(organizerId);
            res.json({ success: true, data: financials });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/ticket-stats
     */
    static async getTicketStats(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const stats = await EventOperationsService.getOrganizerTicketStats(organizerId);
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/settings
     */
    static async getSettings(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;
            const profile = await prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                include: { user: { select: { email: true, phoneNumber: true } } }
            });

            if (profile) {
                // Calculate Completeness
                const fields = [
                    profile.organizationName,
                    profile.contactPhone,
                    profile.contactEmail,
                    profile.city,
                    profile.payoutDetails,
                    profile.description,
                    profile.logoUrl
                ];
                const filled = fields.filter(f => f && f.toString().length > 0).length;
                const completeness = Math.round((filled / fields.length) * 100);

                (profile as any).completeness = completeness;
            }

            res.json({ success: true, data: profile });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/organizer/settings
     */
    static async updateSettings(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const { organizationName, contactEmail, contactPhone, city, payoutDetails, adminNote, description } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Check current status for locking
            const currentProfile = await prisma.organizerProfile.findUnique({ where: { id: organizerId } });

            // Prepare update data
            const updateData: any = {
                contactEmail,
                contactPhone,
                city,
                adminNote,
                description
            };

            // Lock critical fields if APPROVED
            if (currentProfile?.status !== 'APPROVED') {
                if (organizationName) updateData.organizationName = organizationName;
                if (payoutDetails) updateData.payoutDetails = payoutDetails;
            } else {
                // Determine if user TRIED to update locked fields
                const attemptedRestrictedUpdate =
                    (organizationName && organizationName !== currentProfile.organizationName) ||
                    (payoutDetails && payoutDetails !== currentProfile.payoutDetails);

                if (attemptedRestrictedUpdate) {
                    // We can either throw an error or just ignore it. 
                    // Let's just ignore it but maybe log it? 
                    // For better UX during development, we'll silently ignore locked fields.
                }
            }

            const profile = await prisma.organizerProfile.update({
                where: { id: organizerId },
                data: updateData
            });

            res.json({ success: true, data: profile });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/events
     */
    static async createEvent(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const { title, titleAm, description, descriptionAm, venue, dateTime, categoryId, cityId, tiers, coverImage, refundPolicy, minAge, additionalPolicy, status } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Optional: Validate status if provided
            const initialStatus = status === 'DRAFT' ? 'DRAFT' : 'PENDING';

            const event = await prisma.event.create({
                data: {
                    title,
                    titleAm,
                    description,
                    descriptionAm,
                    venue,
                    dateTime: new Date(dateTime),
                    organizerId,
                    categoryId: parseInt(categoryId),
                    cityId: parseInt(cityId),
                    coverImage,
                    refundPolicy,
                    minAge: parseInt(minAge) || 0,
                    additionalPolicy,
                    status: initialStatus,
                    tiers: {
                        create: tiers.map((tier: any) => ({
                            name: tier.name,
                            price: parseFloat(tier.price),
                            capacity: parseInt(tier.capacity)
                        }))
                    }
                },
                include: { tiers: true }
            });

            res.json({ success: true, data: event });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/promos
     */
    static async createPromoCode(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const { code, discount, type, expiresAt, maxUses, eventId } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Security check: organizer must own the event
            const event = await prisma.event.findUnique({
                where: { id: parseInt(eventId) }
            });

            if (!event || event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event." });
            }

            const promo = await prisma.promoCode.create({
                data: {
                    code,
                    discount: parseFloat(discount),
                    type,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    maxUses: maxUses ? parseInt(maxUses) : null,
                    eventId: parseInt(eventId)
                }
            });

            res.json({ success: true, data: promo });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/promos
     */
    static async getPromoCodes(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;

            const promos = await prisma.promoCode.findMany({
                where: {
                    event: { organizerId }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ success: true, data: promos });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/organizer/events/:id
     * Get a single event for editing
     */
    static async getEventById(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const eventId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    tiers: true,
                    category: true,
                    city: true
                }
            });

            if (!event) {
                return res.status(404).json({ success: false, message: "Event not found" });
            }

            if (event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event" });
            }

            res.json({ success: true, data: event });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/organizer/events/:id
     * Update an existing event
     */
    static async updateEvent(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const eventId = parseInt(req.params.id);
            const { title, titleAm, description, descriptionAm, venue, dateTime, categoryId, cityId, coverImage, refundPolicy, minAge, additionalPolicy, tiers, status } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Security check: organizer must own the event
            const existingEvent = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: true }
            });

            if (!existingEvent) {
                return res.status(404).json({ success: false, message: "Event not found" });
            }

            if (existingEvent.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event" });
            }

            // Update basic event data
            const updateData: any = {};
            if (title) updateData.title = title;
            if (titleAm !== undefined) updateData.titleAm = titleAm;
            if (description !== undefined) updateData.description = description;
            if (descriptionAm !== undefined) updateData.descriptionAm = descriptionAm;
            if (venue) updateData.venue = venue;
            if (dateTime) updateData.dateTime = new Date(dateTime);
            if (categoryId) updateData.categoryId = parseInt(categoryId);
            if (cityId) updateData.cityId = parseInt(cityId);
            if (coverImage !== undefined) updateData.coverImage = coverImage;
            if (refundPolicy !== undefined) updateData.refundPolicy = refundPolicy;
            if (minAge !== undefined) updateData.minAge = parseInt(minAge);
            if (additionalPolicy !== undefined) updateData.additionalPolicy = additionalPolicy;
            if (status) updateData.status = status;

            const updatedEvent = await prisma.event.update({
                where: { id: eventId },
                data: updateData,
                include: { tiers: true }
            });

            // Handle tiers update if provided
            if (tiers && Array.isArray(tiers)) {
                // Delete existing tiers and recreate
                await prisma.ticketTier.deleteMany({
                    where: { eventId }
                });

                await prisma.ticketTier.createMany({
                    data: tiers.map((tier: any) => ({
                        eventId,
                        name: tier.name,
                        price: parseFloat(tier.price),
                        capacity: parseInt(tier.capacity)
                    }))
                });
            }

            // Fetch the final result with new tiers
            const finalEvent = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: true, category: true, city: true }
            });

            res.json({ success: true, data: finalEvent });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * POST /api/organizer/events/:id/duplicate
     */
    static async duplicateEvent(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            const eventId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            // Fetch original event
            const original = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: true }
            });

            if (!original || original.organizerId !== organizerId) {
                return res.status(404).json({ success: false, message: "Event not found or unauthorized" });
            }

            // Create copy
            const copy = await prisma.event.create({
                data: {
                    title: `${original.title} (Copy)`,
                    titleAm: original.titleAm,
                    description: original.description,
                    descriptionAm: original.descriptionAm,
                    venue: original.venue,
                    dateTime: original.dateTime, // Keep same date or reset? Keeping same for duplication logic
                    organizerId,
                    categoryId: original.categoryId,
                    cityId: original.cityId,
                    coverImage: original.coverImage,
                    refundPolicy: original.refundPolicy,
                    minAge: original.minAge,
                    additionalPolicy: original.additionalPolicy,
                    status: 'DRAFT', // Always start as draft
                    tiers: {
                        create: original.tiers.map(t => ({
                            name: t.name,
                            price: Number(t.price),
                            capacity: t.capacity
                        }))
                    }
                }
            });

            res.json({ success: true, data: copy });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/events/:id/feature
     */
    static async requestFeature(req: Request, res: Response) {
        try {
            const eventId = Number(req.params.id);
            const organizerId = (req as any).user?.organizerId;
            const prisma = (await import("../lib/prisma")).prisma;

            // Validate ownership
            const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
            if (!event) return res.status(404).json({ success: false, message: "Event not found" });

            // Create notification for ADMIN
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

            if (admin) {
                await prisma.notificationLog.create({
                    data: {
                        userId: admin.id,
                        organizerId,
                        channel: 'PUSH',
                        recipient: admin.email || admin.phoneNumber || 'System',
                        title: 'Feature Request',
                        content: `Organizer ${organizerId} requested featuring for '${event.title}'`,
                        status: 'DELIVERED',
                        metadata: { type: 'FEATURE_REQUEST', eventId: eventId, organizerId: organizerId }
                    }
                });
            }

            res.json({ success: true, message: "Feature request submitted for approval" });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async contactSupport(req: Request, res: Response) {
        try {
            const { subject, message } = req.body;
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }

            const prisma = (await import("../lib/prisma")).prisma;

            const organizer = await prisma.organizerProfile.findUnique({ where: { userId } });
            if (!organizer) {
                return res.status(404).json({ error: "Organizer profile not found. Please complete your organizer profile first." });
            }

            if (!subject || !message) {
                return res.status(400).json({ error: "Subject and message are required" });
            }

            // Try to create notification log (make userId optional if it fails)
            try {
                await prisma.notificationLog.create({
                    data: {
                        userId: userId, // Use the actual user ID instead of hardcoded 1
                        organizerId: organizer.id,
                        channel: 'EMAIL',
                        recipient: 'support@ettickets.com',
                        title: `[Support] ${subject}`,
                        content: message,
                        status: 'PENDING',
                        metadata: { type: 'SUPPORT_TICKET', from: organizer.organizationName }
                    }
                });
            } catch (logError: any) {
                // Log error but don't fail the request
                console.warn("Failed to create notification log:", logError.message);
            }

            // Send Email Notification
            const { EmailService } = await import("../services/email.service");

            // Send to support team (use EMAIL_USER from .env or fallback to support email)
            const supportEmail = process.env.EMAIL_USER || 'support@ettickets.com';
            const supportHtml = EmailService.createSupportNotificationTemplate({
                organizationName: organizer.organizationName,
                organizerId: organizer.id,
                contactEmail: organizer.contactEmail || undefined,
                contactPhone: organizer.contactPhone || undefined,
                subject,
                message
            });

            await EmailService.sendEmail(
                supportEmail,
                `[Support] ${organizer.organizationName}: ${subject}`,
                `New support request from ${organizer.organizationName} (ID: ${organizer.id}).\n\nContact: ${organizer.contactEmail || 'N/A'}\nPhone: ${organizer.contactPhone || 'N/A'}\n\nMessage:\n${message}`,
                supportHtml
            );

            // Send confirmation email to organizer if they have an email
            if (organizer.contactEmail) {
                const confirmationHtml = EmailService.createConfirmationTemplate({
                    organizationName: organizer.organizationName,
                    subject,
                    message
                });

                await EmailService.sendEmail(
                    organizer.contactEmail,
                    `Support Request Confirmation: ${subject}`,
                    `Dear ${organizer.organizationName},\n\nThank you for contacting ET-Ticket support. We have received your request and will respond within 24 hours.\n\nYour Message:\n${message}\n\nBest regards,\nET-Ticket Support Team`,
                    confirmationHtml
                );
            }

            res.json({ success: true, message: "Support ticket created successfully. We will contact you shortly." });
        } catch (error: any) {
            console.error("Support error:", error);
            const errorMessage = error?.message || "An unexpected error occurred. Please try again.";
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * GET /api/organizer/payment-methods
     */
    static async getPaymentMethods(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;
            const methods = await prisma.savedPaymentMethod.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });

            res.json(methods);
        } catch (error: any) {
            console.error("Get payment methods error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/payment-methods
     */
    static async addPaymentMethod(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const { provider, accountNumber, accountName } = req.body;

            if (!provider || !accountNumber || !accountName) {
                return res.status(400).json({ error: "Provider, account number, and account name are required" });
            }

            const prisma = (await import("../lib/prisma")).prisma;

            // Check if this is the first payment method
            const existingMethods = await prisma.savedPaymentMethod.count({ where: { userId } });
            const isDefault = existingMethods === 0;

            const method = await prisma.savedPaymentMethod.create({
                data: {
                    userId,
                    provider,
                    accountNumber,
                    accountName,
                    isDefault
                }
            });

            res.json({ success: true, data: method });
        } catch (error: any) {
            console.error("Add payment method error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * DELETE /api/organizer/payment-methods/:id
     */
    static async deletePaymentMethod(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const methodId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            // Verify ownership
            const method = await prisma.savedPaymentMethod.findFirst({
                where: { id: methodId, userId }
            });

            if (!method) {
                return res.status(404).json({ error: "Payment method not found" });
            }

            if (method.isDefault) {
                return res.status(400).json({ error: "Cannot delete default payment method. Set another as default first." });
            }

            await prisma.savedPaymentMethod.delete({ where: { id: methodId } });

            res.json({ success: true, message: "Payment method deleted" });
        } catch (error: any) {
            console.error("Delete payment method error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * PATCH /api/organizer/payment-methods/:id/default
     */
    static async setDefaultPaymentMethod(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const methodId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            // Verify ownership
            const method = await prisma.savedPaymentMethod.findFirst({
                where: { id: methodId, userId }
            });

            if (!method) {
                return res.status(404).json({ error: "Payment method not found" });
            }

            // Unset all defaults, then set this one
            await prisma.savedPaymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false }
            });

            await prisma.savedPaymentMethod.update({
                where: { id: methodId },
                data: { isDefault: true }
            });

            res.json({ success: true, message: "Default payment method updated" });
        } catch (error: any) {
            console.error("Set default payment method error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/organizer/notifications
     */
    static async getNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;

            // Get organizer profile to find organizerId
            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: "Organizer profile not found" });
            }

            const notifications = await prisma.notificationLog.findMany({
                where: { organizerId: organizer.id },
                orderBy: { createdAt: 'desc' },
                take: 50 // Limit to recent 50
            });

            const unreadCount = await prisma.notificationLog.count({
                where: { organizerId: organizer.id, isRead: false }
            });

            res.json({ success: true, data: notifications, unreadCount });
        } catch (error: any) {
            console.error("Get notifications error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * PATCH /api/organizer/notifications/read
     */
    static async markNotificationsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const { notificationIds, markAll } = req.body;

            const prisma = (await import("../lib/prisma")).prisma;

            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: "Organizer profile not found" });
            }

            if (markAll) {
                await prisma.notificationLog.updateMany({
                    where: { organizerId: organizer.id, isRead: false },
                    data: { isRead: true }
                });
            } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
                await prisma.notificationLog.updateMany({
                    where: {
                        organizerId: organizer.id,
                        id: { in: notificationIds }
                    },
                    data: { isRead: true }
                });
            }

            res.json({ success: true, message: "Notifications marked as read" });
        } catch (error: any) {
            console.error("Mark notifications read error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/organizer/payouts
     */
    static async getPayoutHistory(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;

            // Get organizer profile and wallet
            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId },
                include: {
                    wallet: {
                        include: {
                            payouts: {
                                orderBy: { createdAt: 'desc' },
                                take: 50
                            }
                        }
                    }
                }
            });

            if (!organizer) {
                return res.status(404).json({ error: "Organizer profile not found" });
            }

            const payouts = organizer.wallet?.payouts || [];

            res.json(payouts);
        } catch (error: any) {
            console.error("Get payout history error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/profile/upload-logo
     */
    static async uploadLogo(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const prisma = (await import("../lib/prisma")).prisma;
            const sharp = (await import("sharp")).default;

            // Process image: resize and optimize
            const outputPath = req.file.path.replace(/\.[^.]+$/, '-optimized.jpg');

            await sharp(req.file.path)
                .resize(512, 512, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toFile(outputPath);

            // Delete original file
            const fs = await import('fs');
            fs.unlinkSync(req.file.path);

            // Generate URL (relative path for storage)
            const logoUrl = '/' + outputPath.replace(/\\/g, '/');

            // Get organizer profile
            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: "Organizer profile not found" });
            }

            // Delete old logo file if exists
            if (organizer.logoUrl) {
                const oldPath = organizer.logoUrl.substring(1); // Remove leading /
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Update profile with new logo URL
            const updated = await prisma.organizerProfile.update({
                where: { userId },
                data: { logoUrl }
            });

            res.json({ success: true, logoUrl: updated.logoUrl });
        } catch (error: any) {
            console.error("Upload logo error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * DELETE /api/organizer/profile/remove-logo
     */
    static async removeLogo(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;
            const fs = await import('fs');

            const organizer = await prisma.organizerProfile.findUnique({
                where: { userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: "Organizer profile not found" });
            }

            // Delete file if exists
            if (organizer.logoUrl) {
                const filePath = organizer.logoUrl.substring(1);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Remove from database
            await prisma.organizerProfile.update({
                where: { userId },
                data: { logoUrl: null }
            });

            res.json({ success: true, message: "Logo removed successfully" });
        } catch (error: any) {
            console.error("Remove logo error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/profile/change-password
     */
    static async changePassword(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: "Current password and new password are required" });
            }

            // Password strength validation
            if (newPassword.length < 8) {
                return res.status(400).json({ error: "Password must be at least 8 characters long" });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    error: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
                });
            }

            const prisma = (await import("../lib/prisma")).prisma;
            const bcrypt = await import("bcryptjs");

            // Get user
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || !user.password) {
                return res.status(400).json({ error: "Cannot change password for this account" });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            res.json({ success: true, message: "Password changed successfully. Please log in again with your new password." });
        } catch (error: any) {
            console.error("Change password error:", error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * POST /api/organizer/profile/change-phone-request
     */
    static async requestPhoneChange(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const { newPhoneNumber } = req.body;

            if (!newPhoneNumber) {
                return res.status(400).json({ error: "New phone number is required" });
            }

            const prisma = (await import("../lib/prisma")).prisma;
            const OtpService = (await import("../services/otp.service")).OtpService;
            const SmsService = (await import("../services/sms.service")).SmsService;

            // Check if phone number is already in use
            const existingUser = await prisma.user.findUnique({
                where: { phoneNumber: newPhoneNumber }
            });

            if (existingUser) {
                return res.status(400).json({ error: "Phone number is already associated with another account." });
            }

            // Generate and send OTP
            const otp = await OtpService.generateOtp(newPhoneNumber);
            await SmsService.sendOtp(newPhoneNumber, otp);

            res.json({ success: true, message: `OTP sent to ${newPhoneNumber}` });
        } catch (error: any) {
            console.error("Request phone change error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/profile/change-phone-verify
     */
    static async verifyPhoneChange(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(403).json({ error: "Unauthorized" });

            const { newPhoneNumber, otp } = req.body;

            if (!newPhoneNumber || !otp) {
                return res.status(400).json({ error: "Phone number and OTP are required" });
            }

            const OtpService = (await import("../services/otp.service")).OtpService;
            const prisma = (await import("../lib/prisma")).prisma;

            // Verify OTP
            const isValid = await OtpService.verifyOtp(newPhoneNumber, otp);
            if (!isValid) {
                return res.status(400).json({ error: "Invalid or expired OTP" });
            }

            // Double check availability (in case of race condition)
            const existingUser = await prisma.user.findUnique({
                where: { phoneNumber: newPhoneNumber }
            });

            if (existingUser) {
                return res.status(400).json({ error: "Phone number is already associated with another account." });
            }

            // Update user phone number
            await prisma.user.update({
                where: { id: userId },
                data: { phoneNumber: newPhoneNumber }
            });

            // Update organizer contact phone as well (optional but good for consistency)
            await prisma.organizerProfile.update({
                where: { userId },
                data: { contactPhone: newPhoneNumber }
            });

            // Note: In a stricter system, we might revoke tokens here, but for now we let them stay logged in.
            // But since the token contains userId (which didn't change), it's fine.
            // If token contained phoneNumber, we'd need to reissue. It doesn't.

            res.json({ success: true, message: "Phone number updated successfully." });
        } catch (error: any) {
            console.error("Verify phone change error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}
