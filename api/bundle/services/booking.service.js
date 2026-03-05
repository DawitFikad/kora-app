"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const lock_service_1 = require("./lock.service");
const promo_code_service_1 = require("./promo-code.service");
const price_calculator_1 = require("../utils/price-calculator");
const crypto_1 = __importDefault(require("crypto"));
class BookingService {
    /**
     * Gets purchase details for payment page
     */
    static async getPurchaseDetails(purchaseId, userId) {
        const purchase = await prisma_1.prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: {
                tickets: true
            }
        });
        if (!purchase || purchase.userId !== userId) {
            throw new Error("Purchase not found");
        }
        // Parse metadata to reconstruct useful info
        const metadata = purchase.metadata;
        const eventId = metadata.eventId;
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            select: {
                title: true,
                dateTime: true,
                venue: true
            }
        });
        return {
            id: purchase.id,
            totalAmount: purchase.totalAmount.toNumber(),
            status: purchase.status,
            paymentRef: purchase.paymentRef,
            priceBreakdown: metadata.priceBreakdown,
            event,
            lockExpiry: new Date(Date.now() + 5 * 60 * 1000) // Estimate remaining time or store creation time and calc
        };
    }
    /**
     * Gets event details with tier information for booking display
     */
    static async getEventForBooking(eventId) {
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                tiers: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        capacity: true,
                        salesStart: true,
                        salesEnd: true,
                        maxPerUser: true,
                        _count: {
                            select: { tickets: true }
                        }
                    }
                },
                category: { select: { name: true } },
                city: { select: { name: true } },
                organizer: {
                    select: {
                        organizationName: true
                    }
                }
            }
        });
        if (!event) {
            throw new Error("Event not found");
        }
        if (event.isPublic === false) {
            throw new Error("Event is not available for booking");
        }
        if (event.status !== "APPROVED") {
            throw new Error("Event is not available for booking");
        }
        // Calculate availability for each tier
        const tiersWithAvailability = event.tiers.map(tier => ({
            id: tier.id,
            name: tier.name,
            price: tier.price.toNumber(),
            capacity: tier.capacity,
            salesStart: tier.salesStart,
            salesEnd: tier.salesEnd,
            maxPerUser: tier.maxPerUser,
            soldCount: tier._count.tickets,
            available: tier.capacity - tier._count.tickets
        }));
        return {
            id: event.id,
            title: event.title,
            description: event.description,
            venue: event.venue,
            dateTime: event.dateTime,
            coverImage: event.coverImage,
            eventType: event.eventType,
            category: event.category.name,
            city: event.city.name,
            organizer: event.organizer.organizationName,
            feeType: event.feeType,
            feeFixed: event.feeFixed ? Number(event.feeFixed) : 0,
            feePercentage: event.feePercentage ? Number(event.feePercentage) : 0,
            tiers: tiersWithAvailability
        };
    }
    /**
     * Gets real-time seat status for seat map events
     */
    static async getSeatStatus(eventId, tierId) {
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            select: { eventType: true }
        });
        if (event?.eventType !== client_1.EventType.SEAT_MAP) {
            throw new Error("This endpoint is only for seat map events");
        }
        const tier = await prisma_1.prisma.ticketTier.findUnique({
            where: { id: tierId },
            select: { capacity: true }
        });
        if (!tier) {
            throw new Error("Tier not found");
        }
        // Get sold seats from database
        const soldTickets = await prisma_1.prisma.ticket.findMany({
            where: {
                eventId,
                tierId,
                seatNumber: { not: null },
                status: { in: ["VALID", "USED"] }
            },
            select: { seatNumber: true }
        });
        const soldSeats = new Set(soldTickets.map(t => t.seatNumber));
        // Get locked seats from Redis
        const lockedSeats = await lock_service_1.LockService.getLockedSeats(eventId, tierId);
        // Generate seat statuses (assuming seats are numbered 1 to capacity)
        const seatStatuses = [];
        for (let i = 1; i <= tier.capacity; i++) {
            const seatNumber = `S${i}`;
            if (soldSeats.has(seatNumber)) {
                seatStatuses.push({ seatNumber, status: 'sold' });
            }
            else if (lockedSeats[seatNumber]) {
                seatStatuses.push({
                    seatNumber,
                    status: 'locked',
                    lockedBy: parseInt(lockedSeats[seatNumber].userId),
                    ttl: lockedSeats[seatNumber].ttl
                });
            }
            else {
                seatStatuses.push({ seatNumber, status: 'available' });
            }
        }
        return seatStatuses;
    }
    /**
     * Calculates price breakdown with all fees based on the priority hierarchy:
     * 1. Event Override
     * 2. Organizer Override
     * 3. Global Default
     */
    static async calculatePrice(eventId, tierId, quantity, promoCode) {
        const tier = await prisma_1.prisma.ticketTier.findUnique({
            where: { id: tierId },
            include: {
                event: {
                    include: { organizer: true }
                }
            }
        });
        if (!tier) {
            throw new Error("Ticket tier not found");
        }
        if (tier.eventId !== eventId) {
            throw new Error("Tier does not belong to this event");
        }
        const event = tier.event;
        const organizer = event.organizer;
        // Resolve Commission Rules
        let activeFeeType = "PERCENTAGE";
        let activeFeeFixed = 0;
        let activeFeePercentage = 10; // Default fallback
        if (event.feeType) {
            activeFeeType = event.feeType;
            activeFeeFixed = Number(event.feeFixed || 0);
            activeFeePercentage = Number(event.feePercentage || 0);
        }
        else if (organizer.feeType) {
            activeFeeType = organizer.feeType;
            activeFeeFixed = Number(organizer.feeFixed || 0);
            activeFeePercentage = Number(organizer.feePercentage || 0);
        }
        else {
            // Get Global Default
            const globalConfig = await prisma_1.prisma.platformFeeConfig.findFirst({
                where: { isDefault: true, isActive: true }
            });
            if (globalConfig) {
                activeFeeType = globalConfig.feeType;
                activeFeeFixed = Number(globalConfig.feeFixed);
                activeFeePercentage = Number(globalConfig.feePercentage);
            }
        }
        // Resolve Convenience Fee (Global only for now)
        let convenienceFeeRate = this.CONVENIENCE_FEE_PERCENTAGE;
        // In future, this could also be overrideable
        const ticketPrice = Number(tier.price);
        const subtotal = ticketPrice * quantity;
        // Calculate commission
        const commission = price_calculator_1.PriceCalculator.calculateCommission(subtotal, activeFeeType, activeFeeFixed, activeFeePercentage);
        // Convenience fee (flat percentage on subtotal)
        const convenienceFee = price_calculator_1.PriceCalculator.calculateConvenienceFee(subtotal, convenienceFeeRate);
        // Apply promo code if provided
        let discount = 0;
        let promoApplied;
        if (promoCode) {
            const promoResult = await promo_code_service_1.PromoCodeService.validateAndCalculateDiscount(promoCode, eventId, subtotal);
            if (promoResult.valid) {
                discount = promoResult.discountAmount;
                promoApplied = {
                    code: promoCode,
                    type: promoResult.type,
                    value: promoResult.value
                };
            }
        }
        const total = subtotal + commission + convenienceFee - discount;
        return {
            basePrice: ticketPrice,
            ticketPrice,
            subtotal,
            commission: Math.round(commission * 100) / 100,
            convenienceFee: Math.round(convenienceFee * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            total: Math.round(total * 100) / 100,
            promoApplied,
            commissionRate: activeFeeType === 'PERCENTAGE' ? activeFeePercentage : activeFeeFixed,
            feeType: activeFeeType
        };
    }
    /**
     * Locks seats for a user (for SEAT_MAP events)
     */
    static async lockSeats(eventId, tierId, seatNumbers, userId) {
        const results = await Promise.all(seatNumbers.map(async (seat) => {
            const locked = await lock_service_1.LockService.lockSeat(eventId, tierId, seat, userId);
            return { seat, locked };
        }));
        const lockedSeats = results.filter(r => r.locked).map(r => r.seat);
        const failedSeats = results.filter(r => !r.locked).map(r => r.seat);
        // If some seats failed to lock, release the ones we did lock
        if (failedSeats.length > 0 && lockedSeats.length > 0) {
            await Promise.all(lockedSeats.map(seat => lock_service_1.LockService.unlockSeat(eventId, tierId, seat)));
            return {
                success: false,
                lockedSeats: [],
                failedSeats: seatNumbers,
                expiry: new Date()
            };
        }
        return {
            success: lockedSeats.length === seatNumbers.length,
            lockedSeats,
            failedSeats,
            expiry: new Date(Date.now() + this.LOCK_TTL_SECONDS * 1000)
        };
    }
    /**
     * Releases seat locks for a user
     */
    static async releaseSeats(eventId, tierId, seatNumbers) {
        await Promise.all(seatNumbers.map(seat => lock_service_1.LockService.unlockSeat(eventId, tierId, seat)));
    }
    /**
     * Creates a booking reservation with price calculation and seat/capacity locking
     */
    static async createReservation(userId, request) {
        const { eventId, tierId, quantity, seatNumbers, paymentMethod, promoCode } = request;
        // Validation
        if (quantity < 1 || quantity > this.MAX_TICKETS_PER_PURCHASE) {
            return {
                success: false,
                error: `Quantity must be between 1 and ${this.MAX_TICKETS_PER_PURCHASE}`
            };
        }
        // Get event and tier
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            include: { tiers: { where: { id: tierId } } }
        });
        if (!event || event.status !== "APPROVED") {
            return { success: false, error: "Event not found or not available" };
        }
        const tier = event.tiers[0];
        if (!tier) {
            return { success: false, error: "Ticket tier not found" };
        }
        const now = new Date();
        if (tier.salesStart && now < tier.salesStart) {
            return { success: false, error: "Ticket sales for this tier have not started yet" };
        }
        if (tier.salesEnd && now > tier.salesEnd) {
            return { success: false, error: "Ticket sales for this tier have ended" };
        }
        if (tier.maxPerUser && tier.maxPerUser > 0) {
            const userTicketCount = await prisma_1.prisma.ticket.count({
                where: { userId, tierId }
            });
            const pendingPurchases = await prisma_1.prisma.purchase.findMany({
                where: { userId, status: client_1.PaymentStatus.PENDING },
                select: { metadata: true }
            });
            const pendingQty = pendingPurchases.reduce((sum, purchase) => {
                const metadata = purchase.metadata;
                if (metadata?.tierId === tierId) {
                    return sum + (parseInt(metadata?.quantity, 10) || 0);
                }
                return sum;
            }, 0);
            if (userTicketCount + pendingQty + quantity > tier.maxPerUser) {
                return {
                    success: false,
                    error: `Maximum ${tier.maxPerUser} tickets per user for this tier`
                };
            }
        }
        // Handle seat locking based on event type
        if (event.eventType === client_1.EventType.SEAT_MAP) {
            if (!seatNumbers || seatNumbers.length !== quantity) {
                return { success: false, error: "Seat numbers required for this event" };
            }
            const lockResult = await this.lockSeats(eventId, tierId, seatNumbers, userId);
            if (!lockResult.success) {
                return {
                    success: false,
                    error: `Seats unavailable: ${lockResult.failedSeats.join(", ")}`
                };
            }
        }
        else {
            // CAPACITY event - check and reserve capacity
            const soldQty = await prisma_1.prisma.ticket.count({ where: { tierId } });
            const available = tier.capacity - soldQty;
            const reserved = await lock_service_1.LockService.reserveCapacity(eventId, tierId, userId, quantity, available);
            if (!reserved) {
                return { success: false, error: "Not enough tickets available" };
            }
        }
        // Calculate price breakdown
        const priceBreakdown = await this.calculatePrice(eventId, tierId, quantity, promoCode);
        // Validate promo code if provided
        let promoId = null;
        if (promoCode) {
            const promoValidation = await promo_code_service_1.PromoCodeService.validateAndCalculateDiscount(promoCode, eventId, priceBreakdown.subtotal);
            if (promoValidation.valid && promoValidation.promoId) {
                promoId = promoValidation.promoId;
            }
        }
        // Create purchase record
        const paymentRef = `TX-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}`;
        const purchase = await prisma_1.prisma.purchase.create({
            data: {
                userId,
                status: client_1.PaymentStatus.PENDING,
                totalAmount: priceBreakdown.total,
                paymentRef,
                paymentMethod: paymentMethod || "CHAPA",
                metadata: JSON.parse(JSON.stringify({
                    eventId,
                    tierId,
                    quantity,
                    seatNumbers: seatNumbers || [],
                    priceBreakdown,
                    promoCodeId: promoId,
                    promoCode: promoCode ? promoCode.toUpperCase() : null
                }))
            }
        });
        // Create a user notification for the reservation
        const eventInfo = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true, dateTime: true, venue: true }
        });
        await prisma_1.prisma.notificationLog.create({
            data: {
                userId,
                channel: client_1.NotificationChannel.PUSH,
                recipient: "APP",
                title: "Booking Started",
                content: eventInfo
                    ? `Your booking for "${eventInfo.title}" is started. Complete payment to confirm.`
                    : "Your booking is started. Complete payment to confirm.",
                status: "DELIVERED",
                metadata: {
                    type: "BOOKING",
                    purchaseId: purchase.id,
                    eventId,
                    tierId,
                    quantity,
                    eventTitle: eventInfo?.title,
                    eventTime: eventInfo?.dateTime,
                    eventVenue: eventInfo?.venue
                }
            }
        });
        // Increment promo code usage if applied
        if (promoId) {
            await promo_code_service_1.PromoCodeService.incrementUsage(promoId);
        }
        return {
            success: true,
            purchaseId: purchase.id,
            paymentRef: purchase.paymentRef,
            priceBreakdown,
            lockExpiry: new Date(Date.now() + this.LOCK_TTL_SECONDS * 1000)
        };
    }
    /**
     * Extends the lock time for seats/capacity if user needs more time
     */
    static async extendLock(purchaseId, userId) {
        const purchase = await prisma_1.prisma.purchase.findUnique({
            where: { id: purchaseId }
        });
        if (!purchase || purchase.userId !== userId) {
            return { success: false, error: "Purchase not found" };
        }
        if (purchase.status !== client_1.PaymentStatus.PENDING) {
            return { success: false, error: "Cannot extend lock for non-pending purchase" };
        }
        const metadata = purchase.metadata;
        const { eventId, tierId, seatNumbers } = metadata;
        if (seatNumbers && seatNumbers.length > 0) {
            // Re-lock seats with fresh TTL
            await Promise.all(seatNumbers.map((seat) => lock_service_1.LockService.lockSeat(eventId, tierId, seat, userId)));
        }
        else {
            // For capacity events, we need to refresh the user's capacity lock
            // This is handled internally by the LockService
            await lock_service_1.LockService.refreshCapacityLock(eventId, tierId, userId);
        }
        return {
            success: true,
            newExpiry: new Date(Date.now() + this.LOCK_TTL_SECONDS * 1000)
        };
    }
    /**
     * Cancels a pending reservation and releases locks
     */
    static async cancelReservation(purchaseId, userId) {
        const purchase = await prisma_1.prisma.purchase.findUnique({
            where: { id: purchaseId }
        });
        if (!purchase || purchase.userId !== userId) {
            return { success: false, error: "Purchase not found" };
        }
        if (purchase.status !== client_1.PaymentStatus.PENDING) {
            return { success: false, error: "Cannot cancel non-pending purchase" };
        }
        const metadata = purchase.metadata;
        const { eventId, tierId, seatNumbers, quantity } = metadata;
        // Release locks
        if (seatNumbers && seatNumbers.length > 0) {
            await this.releaseSeats(eventId, tierId, seatNumbers);
        }
        else {
            await lock_service_1.LockService.releaseCapacity(eventId, tierId, userId);
        }
        // Decrement promo code usage if it was used
        if (metadata.promoCodeId) {
            await promo_code_service_1.PromoCodeService.decrementUsage(metadata.promoCodeId);
        }
        // Update purchase status
        await prisma_1.prisma.purchase.update({
            where: { id: purchaseId },
            data: { status: client_1.PaymentStatus.CANCELLED }
        });
        return { success: true };
    }
}
exports.BookingService = BookingService;
BookingService.LOCK_TTL_SECONDS = 300; // 5 minutes
BookingService.CONVENIENCE_FEE_PERCENTAGE = 2.5; // 2.5%
BookingService.MAX_TICKETS_PER_PURCHASE = 10;
