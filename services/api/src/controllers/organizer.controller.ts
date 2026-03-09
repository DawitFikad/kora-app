/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { EventOperationsService } from "../services/event-operations.service";
import { PromoCodeService } from "../services/promo-code.service";
import { OtpService } from "../services/otp.service";
import { SmsService } from "../services/sms.service";
import redis from "../utils/redis";

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

            let events: any[] = [];
            try {
                events = await prisma.event.findMany({
                    where: { organizerId },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        dateTime: true,
                        additionalDates: true,
                        venue: true,
                        coverImage: true,
                        isPublic: true,
                        featured: true,
                        feeType: true,
                        _count: {
                            select: {
                                tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } }
                            }
                        },
                        tiers: {
                            select: { capacity: true }
                        }
                    }
                } as any);
            } catch (error) {
                // Fallback for older schema without new fields
                events = await prisma.event.findMany({
                    where: { organizerId },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        dateTime: true,
                        venue: true,
                        coverImage: true,
                        featured: true,
                        feeType: true,
                        _count: {
                            select: {
                                tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } }
                            }
                        },
                        tiers: {
                            select: { capacity: true }
                        }
                    }
                } as any);
            }

            const eventIds = (events as any[]).map(e => e.id).filter(Boolean);
            let likesByEventId = new Map<number, number>();
            let ratingsByEventId = new Map<number, { avg: number; count: number }>();
            if (eventIds.length > 0) {
                try {
                    const prismaAny = prisma as any;
                    const hasDelegates = !!prismaAny.eventLike && !!prismaAny.eventRating;

                    if (hasDelegates) {
                        const [likeCounts, ratingAgg] = await Promise.all([
                            prismaAny.eventLike.groupBy({
                                by: ['eventId'],
                                where: { eventId: { in: eventIds } },
                                _count: { eventId: true }
                            }),
                            prismaAny.eventRating.groupBy({
                                by: ['eventId'],
                                where: { eventId: { in: eventIds } },
                                _avg: { rating: true },
                                _count: { rating: true }
                            })
                        ]);

                        likesByEventId = new Map<number, number>(
                            (likeCounts as any[]).map((row: any) => [row.eventId, Number(row?._count?.eventId || 0)])
                        );
                        ratingsByEventId = new Map<number, { avg: number; count: number }>(
                            (ratingAgg as any[]).map((row: any) => [
                                row.eventId,
                                {
                                    avg: row?._avg?.rating ? Number(row._avg.rating) : 0,
                                    count: Number(row?._count?.rating || 0)
                                }
                            ])
                        );
                    } else {
                        const idsCsv = eventIds.map((id: number) => Number(id)).filter(Number.isFinite).join(',');
                        if (idsCsv) {
                            const tableRows = await prisma.$queryRawUnsafe<Array<{ likeTable: string | null; ratingTable: string | null }>>(
                                "SELECT to_regclass('public.\"EventLike\"') AS \"likeTable\", to_regclass('public.\"EventRating\"') AS \"ratingTable\""
                            );
                            const tables = tableRows[0] || { likeTable: null, ratingTable: null };

                            if (tables.likeTable) {
                                const likeRows = await prisma.$queryRawUnsafe<Array<{ eventId: number; count: number }>>(
                                    `SELECT \"eventId\", COUNT(*)::int AS count FROM \"EventLike\" WHERE \"eventId\" IN (${idsCsv}) GROUP BY \"eventId\"`
                                );
                                likesByEventId = new Map<number, number>(
                                    likeRows.map((row) => [Number(row.eventId), Number(row.count || 0)])
                                );
                            }

                            if (tables.ratingTable) {
                                const ratingRows = await prisma.$queryRawUnsafe<Array<{ eventId: number; averageRating: number | string | null; ratingsCount: number }>>(
                                    `SELECT \"eventId\", COALESCE(AVG(\"rating\"), 0) AS \"averageRating\", COUNT(*)::int AS \"ratingsCount\" FROM \"EventRating\" WHERE \"eventId\" IN (${idsCsv}) GROUP BY \"eventId\"`
                                );
                                ratingsByEventId = new Map<number, { avg: number; count: number }>(
                                    ratingRows.map((row) => [
                                        Number(row.eventId),
                                        {
                                            avg: Number(row.averageRating ?? 0) || 0,
                                            count: Number(row.ratingsCount || 0)
                                        }
                                    ])
                                );
                            }
                        }
                    }
                } catch {
                    likesByEventId = new Map<number, number>();
                    ratingsByEventId = new Map<number, { avg: number; count: number }>();
                }
            }

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
            const formattedEvents = (events as any[]).map(event => ({
                ...event,
                totalCapacity: (event.tiers || []).reduce((sum: number, tier: any) => sum + tier.capacity, 0),
                featureStatus: event.featured ? 'APPROVED' : (eventStatusMap.get(event.id) || 'NONE'),
                likesCount: Number(likesByEventId.get(event.id) || 0),
                ratingsCount: Number(ratingsByEventId.get(event.id)?.count || 0),
                averageRating: (() => {
                    const agg = ratingsByEventId.get(event.id);
                    if (agg && agg.count > 0) return Number(agg.avg.toFixed(2));
                    const fallback = Number(event?.rating ?? 0);
                    return Number.isFinite(fallback) ? fallback : 0;
                })()
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

            let tickets: any[] = [];
            try {
                tickets = await prisma.ticket.findMany({
                    where: {
                        event: { organizerId }
                    },
                    select: {
                        id: true,
                        code: true,
                        status: true,
                        isVip: true,
                        createdAt: true,
                        user: {
                            select: {
                                phoneNumber: true,
                                email: true,
                                profile: { select: { fullName: true } }
                            }
                        },
                        purchase: { select: { status: true } },
                        event: { select: { title: true } },
                        tier: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50
                } as any);
            } catch (error: any) {
                const msg = (error?.message || '').toLowerCase();
                if (msg.includes('isvip') || (msg.includes('column') && msg.includes('does not exist'))) {
                    tickets = await prisma.ticket.findMany({
                        where: {
                            event: { organizerId }
                        },
                        select: {
                            id: true,
                            code: true,
                            status: true,
                            createdAt: true,
                            user: {
                                select: {
                                    phoneNumber: true,
                                    email: true,
                                    profile: { select: { fullName: true } }
                                }
                            },
                            purchase: { select: { status: true } },
                            event: { select: { title: true } },
                            tier: { select: { name: true } }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 50
                    } as any);
                } else {
                    throw error;
                }
            }

            const formattedAttendees = tickets.map(t => ({
                id: t.id,
                ticketCode: t.code || null,
                name: t.user?.profile?.fullName || 'Guest',
                phone: t.user?.phoneNumber,
                email: t.user?.email,
                event: t.event.title,
                type: t.tier.name,
                date: t.createdAt,
                status: t.purchase?.status === "REFUNDED" || t.status === "CANCELLED"
                    ? "Refunded"
                    : t.status === "USED" ? "Used" : "Valid",
                isVip: (t as any).isVip === true
            }));

            res.json({ success: true, data: formattedAttendees });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/attendees/:id/resend
     */
    static async resendTicket(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const ticketId = req.params.id;
            const { channel } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    user: true,
                    event: { select: { title: true, dateTime: true, venue: true, organizerId: true } },
                    tier: { select: { name: true } }
                }
            });

            if (!ticket || ticket.event?.organizerId !== organizerId) {
                return res.status(404).json({ success: false, message: "Ticket not found" });
            }

            const jwt = await import("jsonwebtoken");
            const secret = process.env.JWT_SECRET || "et-ticket-qr-secret";
            let code = ticket.id;
            try {
                const payload: any = jwt.default.verify(ticket.qrPayload, secret);
                if (payload?.code) code = payload.code;
            } catch {
                // fallback
            }

            const { NotificationService } = await import("../services/notification.service");
            const { NotificationChannel } = await import("@prisma/client");

            const channels = [channel === "EMAIL" ? NotificationChannel.EMAIL : NotificationChannel.SMS];
            await NotificationService.notifyUser(ticket.userId, {
                title: "Your Ticket Details",
                content: `Ticket for "${ticket.event?.title}" (${ticket.tier?.name}). Code: ${code}. Venue: ${ticket.event?.venue}. Date: ${new Date(ticket.event?.dateTime || '').toLocaleString()}`,
                channels
            });

            res.json({ success: true, message: "Ticket resent" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/attendees/:id/check-in
     */
    static async manualCheckIn(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const ticketId = req.params.id;
            const prisma = (await import("../lib/prisma")).prisma;

            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: { event: { select: { organizerId: true } } }
            });

            if (!ticket || ticket.event?.organizerId !== organizerId) {
                return res.status(404).json({ success: false, message: "Ticket not found" });
            }

            if (ticket.status === "USED") {
                return res.json({ success: true, data: ticket });
            }

            const updated = await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: "USED" }
            });

            res.json({ success: true, data: updated });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/attendees/:id/vip
     */
    static async tagVip(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const ticketId = req.params.id;
            const { isVip } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: { event: { select: { organizerId: true } } }
            });

            if (!ticket || ticket.event?.organizerId !== organizerId) {
                return res.status(404).json({ success: false, message: "Ticket not found" });
            }

            try {
                const updated = await prisma.ticket.update({
                    where: { id: ticketId },
                    data: { isVip: !!isVip } as any
                });
                res.json({ success: true, data: updated });
            } catch (error: any) {
                const msg = (error?.message || '').toLowerCase();
                if (msg.includes('unknown arg') || (msg.includes('column') && msg.includes('does not exist'))) {
                    try {
                        await prisma.$executeRawUnsafe('ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "isVip" BOOLEAN NOT NULL DEFAULT false');
                        await prisma.$executeRawUnsafe(
                            'UPDATE "Ticket" SET "isVip" = $1 WHERE id = $2',
                            !!isVip,
                            ticketId
                        );
                        return res.json({ success: true, data: { id: ticketId, isVip: !!isVip } });
                    } catch (sqlError: any) {
                        return res.status(400).json({ success: false, message: "VIP tagging requires database migration." });
                    }
                }
                throw error;
            }
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
     * PATCH /api/organizer/tiers/:id
     * Update a ticket tier (capacity only)
     */
    static async updateTicketTier(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const tierId = parseInt(req.params.id);
            const capacity = Number(req.body?.capacity);
            if (!tierId || !Number.isFinite(capacity) || capacity <= 0) {
                return res.status(400).json({ success: false, message: "Invalid capacity" });
            }

            const prisma = (await import("../lib/prisma")).prisma;
            const tier = await prisma.ticketTier.findUnique({
                where: { id: tierId },
                include: {
                    event: { select: { organizerId: true } },
                    _count: { select: { tickets: { where: { status: { in: ["SOLD", "USED", "VALID"] } } } } }
                }
            });

            if (!tier) return res.status(404).json({ success: false, message: "Tier not found" });
            if (tier.event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event" });
            }

            const sold = tier._count.tickets || 0;
            if (capacity < sold) {
                return res.status(400).json({ success: false, message: `Capacity cannot be less than sold (${sold}).` });
            }

            const updated = await prisma.ticketTier.update({
                where: { id: tierId },
                data: { capacity: Math.floor(capacity) }
            });

            res.json({ success: true, data: updated });
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

            const {
                organizationName, contactEmail, contactPhone, city, payoutDetails, adminNote, description,
                websiteUrl, socialLinks, supportPhone, supportEmail, businessAddress,
                categoryFocus, operatingCities, defaultConfig, notificationPrefs
            } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Check current status for locking
            const currentProfile = await prisma.organizerProfile.findUnique({ where: { id: organizerId } });

            // Prepare update data
            const updateData: any = {
                contactEmail,
                contactPhone,
                city,
                adminNote,
                description,
                websiteUrl,
                socialLinks,
                supportPhone,
                supportEmail,
                businessAddress,
                categoryFocus,
                operatingCities,
                defaultConfig,
                notificationPrefs
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
     * POST /api/organizer/security/2fa/request
     * Send OTP to enable/disable 2FA
     */
    static async requestTwoFactorOtp(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const action = String(req.body?.action || '').toLowerCase();
            if (action !== 'enable' && action !== 'disable') {
                return res.status(400).json({ success: false, message: "Invalid action" });
            }

            const prisma = (await import("../lib/prisma")).prisma;
            const profile = await prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                include: { user: { select: { phoneNumber: true } } }
            });

            const phoneNumber = profile?.user?.phoneNumber || profile?.contactPhone;
            if (!phoneNumber) {
                return res.status(400).json({ success: false, message: "No phone number on file" });
            }

            const otp = await OtpService.generateOtp(phoneNumber);
            await SmsService.sendOtp(phoneNumber, otp);
            await redis.setex(`2fa_action:${organizerId}`, 300, action);

            res.json({ success: true, message: "OTP sent" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/organizer/security/2fa/verify
     * Verify OTP and update 2FA setting
     */
    static async verifyTwoFactorOtp(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const action = String(req.body?.action || '').toLowerCase();
            const otp = String(req.body?.otp || '').trim();
            if ((action !== 'enable' && action !== 'disable') || !otp) {
                return res.status(400).json({ success: false, message: "Invalid request" });
            }

            const expected = await redis.get(`2fa_action:${organizerId}`);
            if (!expected || expected !== action) {
                return res.status(400).json({ success: false, message: "OTP request expired. Please request again." });
            }

            const prisma = (await import("../lib/prisma")).prisma;
            const profile = await prisma.organizerProfile.findUnique({
                where: { id: organizerId },
                include: { user: { select: { phoneNumber: true } } }
            });

            const phoneNumber = profile?.user?.phoneNumber || profile?.contactPhone;
            if (!phoneNumber) {
                return res.status(400).json({ success: false, message: "No phone number on file" });
            }

            const isValid = await OtpService.verifyOtp(phoneNumber, otp);
            if (!isValid) {
                return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
            }

            const updatedConfig = { ...(profile?.defaultConfig as any || {}), twoFactorEnabled: action === 'enable' };
            await prisma.organizerProfile.update({
                where: { id: organizerId },
                data: { defaultConfig: updatedConfig }
            });

            await redis.del(`2fa_action:${organizerId}`);

            res.json({ success: true, data: { twoFactorEnabled: action === 'enable' } });
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

            const { title, titleAm, description, descriptionAm, venue, dateTime, additionalDates, isPublic, categoryId, cityId, tiers, coverImage, refundPolicy, minAge, additionalPolicy, hasSeatMap, status } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Optional: Validate status if provided
            const initialStatus = status === 'DRAFT' ? 'DRAFT' : 'PENDING';

            const baseData: any = {
                title,
                titleAm,
                description,
                descriptionAm,
                venue,
                dateTime: new Date(dateTime),
                additionalDates: Array.isArray(additionalDates) ? additionalDates.map((d: string) => new Date(d)) : [],
                isPublic: isPublic !== false,
                organizerId,
                categoryId: parseInt(categoryId),
                cityId: parseInt(cityId),
                coverImage,
                refundPolicy,
                minAge: parseInt(minAge) || 0,
                additionalPolicy,
                hasSeatMap: !!hasSeatMap,
                status: initialStatus,
                tiers: {
                    create: tiers.map((tier: any) => ({
                        name: tier.name,
                        type: tier.type || 'GENERAL',
                        price: parseFloat(tier.price),
                        capacity: parseInt(tier.capacity),
                        salesStart: tier.salesStart ? new Date(tier.salesStart) : null,
                        salesEnd: tier.salesEnd ? new Date(tier.salesEnd) : null,
                        maxPerUser: parseInt(tier.maxPerUser) || 5,
                        isTransferable: tier.isTransferable !== undefined ? !!tier.isTransferable : true,
                        isResellable: tier.isResellable !== undefined ? !!tier.isResellable : false
                    }))
                }
            };

            let event: any;
            try {
                event = await prisma.event.create({ data: baseData, include: { tiers: true } } as any);
            } catch (error: any) {
                const msg = (error?.message || '').toLowerCase();
                if (msg.includes('additionaldates') || msg.includes('ispublic') || msg.includes('unknown arg') || (msg.includes('column') && msg.includes('does not exist'))) {
                    const fallbackData = { ...baseData };
                    delete fallbackData.additionalDates;
                    delete fallbackData.isPublic;
                    if (fallbackData.tiers?.create) {
                        fallbackData.tiers = {
                            create: fallbackData.tiers.create.map((tier: any) => ({
                                name: tier.name,
                                price: tier.price,
                                capacity: tier.capacity,
                                salesStart: tier.salesStart,
                                salesEnd: tier.salesEnd,
                                maxPerUser: tier.maxPerUser
                            }))
                        };
                    }
                    event = await prisma.event.create({ data: fallbackData, include: { tiers: true } } as any);
                } else {
                    throw error;
                }
            }

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

            const { code, discount, type, expiresAt, maxUses, eventId, codeType, campaignName, influencerName } = req.body;
            const prisma = (await import("../lib/prisma")).prisma;

            // Security check: organizer must own the event
            const event = await prisma.event.findUnique({
                where: { id: parseInt(eventId) }
            });

            if (!event || event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event." });
            }

            const promo = await PromoCodeService.create({
                code,
                eventId: parseInt(eventId),
                discount: parseFloat(discount),
                type,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                maxUses: maxUses ? parseInt(maxUses) : undefined,
                codeType,
                campaignName,
                influencerName
            } as any);

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

            let promos: any[] = [];
            try {
                promos = await prisma.promoCode.findMany({
                    where: {
                        event: { organizerId }
                    },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        code: true,
                        discount: true,
                        type: true,
                        expiresAt: true,
                        maxUses: true,
                        usedCount: true,
                        isActive: true,
                        eventId: true,
                        createdAt: true
                    }
                });
            } catch (error: any) {
                const msg = (error?.message || '').toLowerCase();
                if (msg.includes('column') && msg.includes('does not exist')) {
                    promos = await prisma.promoCode.findMany({
                        where: {
                            event: { organizerId }
                        },
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            code: true,
                            discount: true,
                            type: true,
                            expiresAt: true,
                            maxUses: true,
                            usedCount: true,
                            isActive: true,
                            eventId: true,
                            createdAt: true
                        }
                    });
                } else {
                    throw error;
                }
            }

            const promoStats = new Map<number, { orders: number; revenue: number }>();
            promos.forEach(p => promoStats.set(p.id, { orders: 0, revenue: 0 }));

            if (promos.length > 0) {
                const purchases = await prisma.purchase.findMany({
                    where: { status: "SUCCESS" },
                    select: { totalAmount: true, metadata: true }
                });

                purchases.forEach(purchase => {
                    const metadata = purchase.metadata as any;
                    const promoId = metadata?.promoCodeId;
                    if (!promoId || !promoStats.has(promoId)) return;

                    const current = promoStats.get(promoId)!;
                    current.orders += 1;
                    current.revenue += Number(purchase.totalAmount || 0);
                    promoStats.set(promoId, current);
                });
            }

            const enriched = promos.map(p => ({
                ...p,
                stats: promoStats.get(p.id) || { orders: 0, revenue: 0 }
            }));

            res.json({ success: true, data: enriched });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * DELETE /api/organizer/promos/:id
     */
    static async deletePromoCode(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user.organizerId;
            if (!organizerId) return res.status(403).json({ success: false, message: "Unauthorized" });

            const promoId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            const promo = await prisma.promoCode.findUnique({
                where: { id: promoId },
                select: { id: true, eventId: true, usedCount: true }
            });

            if (!promo) {
                return res.status(404).json({ success: false, message: "Promo code not found" });
            }

            const event = await prisma.event.findUnique({
                where: { id: promo.eventId },
                select: { organizerId: true }
            });

            if (!event || event.organizerId !== organizerId) {
                return res.status(403).json({ success: false, message: "You don't own this event." });
            }

            await PromoCodeService.delete(promoId);
            res.json({ success: true, message: "Promo code deleted" });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
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
            const { title, titleAm, description, descriptionAm, venue, dateTime, additionalDates, isPublic, categoryId, cityId, coverImage, refundPolicy, minAge, additionalPolicy, hasSeatMap, tiers, status } = req.body;
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
            if (Array.isArray(additionalDates)) updateData.additionalDates = additionalDates.map((d: string) => new Date(d));
            if (isPublic !== undefined) updateData.isPublic = !!isPublic;
            if (categoryId) updateData.categoryId = parseInt(categoryId);
            if (cityId) updateData.cityId = parseInt(cityId);
            if (coverImage !== undefined) updateData.coverImage = coverImage;
            if (refundPolicy !== undefined) updateData.refundPolicy = refundPolicy;
            if (minAge !== undefined) updateData.minAge = parseInt(minAge);
            if (additionalPolicy !== undefined) updateData.additionalPolicy = additionalPolicy;
            if (hasSeatMap !== undefined) updateData.hasSeatMap = hasSeatMap;
            if (status) updateData.status = status;

            let updatedEvent: any;
            try {
                updatedEvent = await prisma.event.update({
                    where: { id: eventId },
                    data: updateData,
                    include: { tiers: true }
                } as any);
            } catch (error: any) {
                const msg = (error?.message || '').toLowerCase();
                if (msg.includes('additionaldates') || msg.includes('ispublic') || msg.includes('unknown arg') || (msg.includes('column') && msg.includes('does not exist'))) {
                    const fallbackData = { ...updateData };
                    delete fallbackData.additionalDates;
                    delete fallbackData.isPublic;
                    updatedEvent = await prisma.event.update({
                        where: { id: eventId },
                        data: fallbackData,
                        include: { tiers: true }
                    } as any);
                } else {
                    throw error;
                }
            }

            // Handle tiers update if provided
            if (tiers && Array.isArray(tiers)) {
                const incoming = tiers as any[];
                const existing = await prisma.ticketTier.findMany({ where: { eventId }, select: { id: true } });
                const incomingIds = new Set(incoming.filter(t => t.id).map(t => Number(t.id)));

                // Update existing tiers
                const updates = incoming.filter(t => t.id).map(t => (
                    prisma.ticketTier.update({
                        where: { id: Number(t.id) },
                        data: {
                            name: t.name,
                            type: t.type || undefined,
                            price: parseFloat(t.price),
                            capacity: parseInt(t.capacity),
                            salesStart: t.salesStart ? new Date(t.salesStart) : undefined,
                            salesEnd: t.salesEnd ? new Date(t.salesEnd) : undefined,
                            maxPerUser: t.maxPerUser ? parseInt(t.maxPerUser) : undefined,
                            isTransferable: t.isTransferable !== undefined ? !!t.isTransferable : undefined,
                            isResellable: t.isResellable !== undefined ? !!t.isResellable : undefined
                        } as any
                    } as any)
                ));

                // Create new tiers
                const creates = incoming.filter(t => !t.id).map(t => (
                    prisma.ticketTier.create({
                        data: {
                            eventId,
                            name: t.name,
                            type: t.type || 'GENERAL',
                            price: parseFloat(t.price),
                            capacity: parseInt(t.capacity),
                            salesStart: t.salesStart ? new Date(t.salesStart) : null,
                            salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
                            maxPerUser: t.maxPerUser ? parseInt(t.maxPerUser) : 5,
                            isTransferable: t.isTransferable !== undefined ? !!t.isTransferable : true,
                            isResellable: t.isResellable !== undefined ? !!t.isResellable : false
                        } as any
                    } as any)
                ));

                try {
                    await Promise.all([...updates, ...creates]);
                } catch (error: any) {
                    const msg = (error?.message || '').toLowerCase();
                    if (msg.includes('unknown arg') || (msg.includes('column') && msg.includes('does not exist'))) {
                        const fallbackUpdates = incoming.filter(t => t.id).map(t => (
                            prisma.ticketTier.update({
                                where: { id: Number(t.id) },
                                data: {
                                    name: t.name,
                                    price: parseFloat(t.price),
                                    capacity: parseInt(t.capacity),
                                    salesStart: t.salesStart ? new Date(t.salesStart) : undefined,
                                    salesEnd: t.salesEnd ? new Date(t.salesEnd) : undefined,
                                    maxPerUser: t.maxPerUser ? parseInt(t.maxPerUser) : undefined
                                }
                            })
                        ));

                        const fallbackCreates = incoming.filter(t => !t.id).map(t => (
                            prisma.ticketTier.create({
                                data: {
                                    eventId,
                                    name: t.name,
                                    price: parseFloat(t.price),
                                    capacity: parseInt(t.capacity),
                                    salesStart: t.salesStart ? new Date(t.salesStart) : null,
                                    salesEnd: t.salesEnd ? new Date(t.salesEnd) : null,
                                    maxPerUser: t.maxPerUser ? parseInt(t.maxPerUser) : 5
                                }
                            })
                        ));

                        await Promise.all([...fallbackUpdates, ...fallbackCreates]);
                    } else {
                        throw error;
                    }
                }

                // Delete tiers removed from payload only if they have no tickets
                const removableIds = existing.map(t => t.id).filter(id => !incomingIds.has(id));
                if (removableIds.length > 0) {
                    const removable = await prisma.ticketTier.findMany({
                        where: { id: { in: removableIds }, tickets: { none: {} } },
                        select: { id: true }
                    });
                    if (removable.length > 0) {
                        await prisma.ticketTier.deleteMany({ where: { id: { in: removable.map(r => r.id) } } });
                    }
                }
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
            const duplicateData: any = {
                title: `${original.title} (Copy)`,
                titleAm: original.titleAm,
                description: original.description,
                descriptionAm: original.descriptionAm,
                venue: original.venue,
                dateTime: original.dateTime,
                organizerId,
                categoryId: original.categoryId,
                cityId: original.cityId,
                coverImage: original.coverImage,
                refundPolicy: original.refundPolicy,
                minAge: original.minAge,
                additionalPolicy: original.additionalPolicy,
                hasSeatMap: original.hasSeatMap,
                additionalDates: (original as any).additionalDates || [],
                isPublic: (original as any).isPublic !== false,
                status: 'DRAFT',
                tiers: {
                    create: original.tiers.map(t => ({
                        name: t.name,
                        type: (t as any).type || 'GENERAL',
                        price: Number(t.price),
                        capacity: t.capacity,
                        salesStart: t.salesStart,
                        salesEnd: t.salesEnd,
                        maxPerUser: t.maxPerUser,
                        isTransferable: (t as any).isTransferable !== undefined ? !!(t as any).isTransferable : true,
                        isResellable: (t as any).isResellable !== undefined ? !!(t as any).isResellable : false
                    }))
                }
            };

            let copy: any;
            try {
                copy = await prisma.event.create({ data: duplicateData } as any);
            } catch (error: any) {
                const msg = (error?.message || '').toLowerCase();
                if (msg.includes('additionaldates') || msg.includes('ispublic') || msg.includes('unknown arg') || (msg.includes('column') && msg.includes('does not exist'))) {
                    const fallback = { ...duplicateData };
                    delete fallback.additionalDates;
                    delete fallback.isPublic;
                    if (fallback.tiers?.create) {
                        fallback.tiers = {
                            create: fallback.tiers.create.map((tier: any) => ({
                                name: tier.name,
                                price: tier.price,
                                capacity: tier.capacity,
                                salesStart: tier.salesStart,
                                salesEnd: tier.salesEnd,
                                maxPerUser: tier.maxPerUser
                            }))
                        };
                    }
                    copy = await prisma.event.create({ data: fallback } as any);
                } else {
                    throw error;
                }
            }

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

    /**
     * GET /api/organizer/refunds
     * Get all refund requests for the organizer's events
     */
    static async getRefunds(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user?.organizerId;
            if (!organizerId) return res.status(403).json({ error: "Unauthorized" });

            const prisma = (await import("../lib/prisma")).prisma;

            const refunds = await prisma.refund.findMany({
                where: {
                    purchase: {
                        tickets: {
                            some: {
                                event: { organizerId }
                            }
                        }
                    }
                },
                include: {
                    purchase: {
                        include: {
                            user: {
                                include: { profile: true }
                            },
                            tickets: {
                                include: {
                                    event: { select: { title: true, dateTime: true, refundPolicy: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedRefunds = refunds.map(r => {
                const purchaseTotal = Number(r.purchase.totalAmount);
                const refundAmount = Number(r.amount);
                const refundType = refundAmount >= purchaseTotal ? 'FULL' : 'PARTIAL';
                const eventInfo = r.purchase.tickets[0]?.event;

                return {
                    id: r.id,
                    status: r.status,
                    amount: refundAmount,
                    reason: r.reason,
                    description: r.description,
                    customerName: r.purchase.user.profile?.fullName || r.purchase.user.phoneNumber,
                    eventTitle: eventInfo?.title || 'Unknown Event',
                    eventDate: eventInfo?.dateTime || null,
                    refundPolicy: eventInfo?.refundPolicy || 'No refunds within 24 hours of event.',
                    ticketCount: r.purchase.tickets.length,
                    purchaseTotal,
                    refundType,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt
                }
            });

            res.json({ success: true, data: formattedRefunds });
        } catch (error: any) {
            console.error("Get refunds error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/refunds/request
     * Request a refund for a specific purchase (requires admin approval)
     */
    static async requestRefund(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user?.organizerId;
            if (!organizerId) return res.status(403).json({ error: "Unauthorized" });

            const { purchaseId, reason, description, amount } = req.body;

            if (!purchaseId || !reason) {
                return res.status(400).json({ error: "Purchase ID and reason are required" });
            }

            const prisma = (await import("../lib/prisma")).prisma;

            // Verify the purchase belongs to this organizer's events
            const purchase = await prisma.purchase.findFirst({
                where: {
                    id: parseInt(purchaseId),
                    tickets: {
                        some: {
                            event: { organizerId }
                        }
                    }
                },
                include: {
                    tickets: {
                        include: { event: true }
                    }
                }
            });

            if (!purchase) {
                return res.status(404).json({ error: "Purchase not found or you don't have permission" });
            }

            // Check if refund already exists
            const existingRefund = await prisma.refund.findFirst({
                where: { purchaseId: purchase.id }
            });

            if (existingRefund) {
                return res.status(400).json({ error: "Refund request already exists for this purchase" });
            }

            const event = purchase.tickets[0]?.event;
            if (event?.dateTime) {
                const cutoff = new Date(event.dateTime);
                cutoff.setHours(cutoff.getHours() - 24);
                if (new Date() > cutoff) {
                    return res.status(400).json({ error: "Refund window closed (24h cutoff before event start)." });
                }
            }

            const refundAmount = amount ? Number(amount) : Number(purchase.totalAmount);
            if (isNaN(refundAmount) || refundAmount <= 0) {
                return res.status(400).json({ error: "Invalid refund amount" });
            }
            if (refundAmount > Number(purchase.totalAmount)) {
                return res.status(400).json({ error: "Refund amount exceeds purchase total" });
            }

            // Create refund request
            const refund = await prisma.refund.create({
                data: {
                    purchaseId: purchase.id,
                    amount: refundAmount,
                    reason: reason,
                    description: description || null,
                    status: 'PENDING'
                }
            });

            // Notify admin
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
            if (admins.length > 0) {
                await prisma.notificationLog.createMany({
                    data: admins.map(admin => ({
                        userId: admin.id,
                        organizerId,
                        channel: 'PUSH',
                        recipient: admin.email || admin.phoneNumber || 'System',
                        title: 'Refund Request',
                        content: `Organizer ${organizerId} requested a ${refundAmount >= Number(purchase.totalAmount) ? 'full' : 'partial'} refund of ETB ${refundAmount} for purchase #${purchase.id}`,
                        status: 'DELIVERED',
                        metadata: {
                            type: 'REFUND_REQUEST',
                            refundId: refund.id,
                            purchaseId: purchase.id,
                            organizerId,
                            amount: refundAmount
                        }
                    }))
                });
            }

            res.json({ success: true, data: refund, message: "Refund request submitted for admin approval" });
        } catch (error: any) {
            console.error("Request refund error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/refunds/:id/approve
     * Organizer approval flow (pre-approval)
     */
    static async approveRefund(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user?.organizerId;
            const userId = (req as any).user?.userId;
            if (!organizerId) return res.status(403).json({ error: "Unauthorized" });

            const refundId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            const refund = await prisma.refund.findUnique({
                where: { id: refundId },
                include: { purchase: { include: { tickets: { include: { event: true } } } } }
            });

            if (!refund) return res.status(404).json({ error: "Refund not found" });

            const event = refund.purchase.tickets[0]?.event;
            if (!event || event.organizerId !== organizerId) {
                return res.status(403).json({ error: "Access denied" });
            }

            if (refund.status !== 'PENDING') {
                return res.status(400).json({ error: "Refund already processed" });
            }

            const { RefundService } = await import("../services/refund.service");
            const updated = await RefundService.approveRefund(refundId, userId);

            res.json({ success: true, data: updated });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/refunds/:id/reject
     */
    static async rejectRefund(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user?.organizerId;
            const userId = (req as any).user?.userId;
            if (!organizerId) return res.status(403).json({ error: "Unauthorized" });

            const refundId = parseInt(req.params.id);
            const { reason } = req.body;
            if (!reason) return res.status(400).json({ error: "Rejection reason required" });

            const prisma = (await import("../lib/prisma")).prisma;

            const refund = await prisma.refund.findUnique({
                where: { id: refundId },
                include: { purchase: { include: { tickets: { include: { event: true } } } } }
            });

            if (!refund) return res.status(404).json({ error: "Refund not found" });

            const event = refund.purchase.tickets[0]?.event;
            if (!event || event.organizerId !== organizerId) {
                return res.status(403).json({ error: "Access denied" });
            }

            if (refund.status !== 'PENDING') {
                return res.status(400).json({ error: "Refund already processed" });
            }

            const { RefundService } = await import("../services/refund.service");
            const updated = await RefundService.rejectRefund(refundId, userId, reason);

            res.json({ success: true, data: updated });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/organizer/events/:id/refund-impact
     * Calculate the financial impact of cancelling an event
     */
    static async getRefundImpact(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user?.organizerId;
            if (!organizerId) return res.status(403).json({ error: "Unauthorized" });

            const eventId = parseInt(req.params.id);
            const prisma = (await import("../lib/prisma")).prisma;

            // Verify event ownership
            const event = await prisma.event.findFirst({
                where: { id: eventId, organizerId },
                include: {
                    tickets: {
                        where: { status: { in: ['SOLD', 'VALID'] } },
                        include: { purchase: true }
                    }
                }
            });

            if (!event) {
                return res.status(404).json({ error: "Event not found or you don't have permission" });
            }

            // Calculate impact
            const totalTickets = event.tickets.length;
            const totalRevenue = event.tickets.reduce((sum, t) => sum + Number(t.basePrice || 0), 0);
            const totalRefundAmount = event.tickets.reduce((sum, t) => sum + Number(t.basePrice || 0), 0);

            // Get unique purchases
            const uniquePurchases = new Set(event.tickets.map(t => t.purchaseId).filter(Boolean));
            const affectedCustomers = uniquePurchases.size;

            const impact = {
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.dateTime,
                totalTicketsSold: totalTickets,
                totalRevenue,
                totalRefundAmount,
                affectedCustomers,
                canCancel: event.status !== 'CANCELLED' && event.status !== 'COMPLETED',
                refundBreakdown: {
                    ticketRevenue: totalRevenue,
                    platformFees: event.tickets.reduce((sum, t) => sum + Number(t.platformNet || 0), 0),
                    organizerNet: event.tickets.reduce((sum, t) => sum + Number(t.organizerNet || 0), 0)
                }
            };

            res.json({ success: true, data: impact });
        } catch (error: any) {
            console.error("Get refund impact error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/organizer/events/:id/request-cancellation
     * Request to cancel an event (requires admin approval)
     */
    static async requestCancellation(req: Request, res: Response) {
        try {
            const organizerId = (req as any).user?.organizerId;
            if (!organizerId) return res.status(403).json({ error: "Unauthorized" });

            const eventId = parseInt(req.params.id);
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({ error: "Cancellation reason is required" });
            }

            const prisma = (await import("../lib/prisma")).prisma;

            // Verify event ownership
            const event = await prisma.event.findFirst({
                where: { id: eventId, organizerId }
            });

            if (!event) {
                return res.status(404).json({ error: "Event not found or you don't have permission" });
            }

            if (event.status === 'CANCELLED') {
                return res.status(400).json({ error: "Event is already cancelled" });
            }

            if (event.status === 'COMPLETED') {
                return res.status(400).json({ error: "Cannot cancel a completed event" });
            }

            // Notify all admins for approval
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
            if (admins.length > 0) {
                await prisma.notificationLog.createMany({
                    data: admins.map(admin => ({
                        userId: admin.id,
                        organizerId,
                        channel: 'PUSH',
                        recipient: admin.email || admin.phoneNumber || 'System',
                        title: 'Event Cancellation Request',
                        content: `Organizer ${organizerId} requested to cancel event "${event.title}". Reason: ${reason}`,
                        status: 'DELIVERED',
                        metadata: {
                            type: 'CANCELLATION_REQUEST',
                            status: 'PENDING',
                            eventId: event.id,
                            organizerId,
                            reason
                        }
                    }))
                });
            }

            // Audit log entry for admin dashboard
            await prisma.notificationLog.create({
                data: {
                    channel: 'PUSH',
                    recipient: 'Audit Log',
                    title: 'Event Cancellation Request',
                    content: `Organizer ${organizerId} requested to cancel event "${event.title}". Reason: ${reason}`,
                    status: 'DELIVERED',
                    metadata: {
                        type: 'CANCELLATION_REQUEST',
                        status: 'PENDING',
                        eventId: event.id,
                        organizerId,
                        reason
                    }
                }
            });

            res.json({
                success: true,
                message: "Cancellation request submitted to admin for approval. You will be notified once processed."
            });
        } catch (error: any) {
            console.error("Request cancellation error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}
