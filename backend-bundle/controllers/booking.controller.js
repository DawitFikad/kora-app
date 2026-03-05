"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("../services/booking.service");
const promo_code_service_1 = require("../services/promo-code.service");
class BookingController {
    /**
     * Get event details for booking display
     */
    static async getEventForBooking(req, res) {
        try {
            const eventId = parseInt(req.params.eventId);
            if (isNaN(eventId)) {
                return res.status(400).json({ success: false, error: "Invalid event ID" });
            }
            const event = await booking_service_1.BookingService.getEventForBooking(eventId);
            res.json({ success: true, data: event });
        }
        catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }
    /**
     * Get real-time seat status for seat map events
     */
    static async getSeatStatus(req, res) {
        try {
            const eventId = parseInt(req.params.eventId);
            const tierId = parseInt(req.params.tierId);
            if (isNaN(eventId) || isNaN(tierId)) {
                return res.status(400).json({ success: false, error: "Invalid event or tier ID" });
            }
            const seatStatus = await booking_service_1.BookingService.getSeatStatus(eventId, tierId);
            res.json({ success: true, data: seatStatus });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Calculate price breakdown with optional promo code
     */
    static async calculatePrice(req, res) {
        try {
            const { eventId, tierId, quantity, promoCode } = req.body;
            if (!eventId || !tierId || !quantity) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and quantity are required"
                });
            }
            const priceBreakdown = await booking_service_1.BookingService.calculatePrice(eventId, tierId, quantity, promoCode);
            res.json({ success: true, data: priceBreakdown });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Validate promo code
     */
    static async validatePromoCode(req, res) {
        try {
            const { code, eventId } = req.body;
            if (!code || !eventId) {
                return res.status(400).json({
                    success: false,
                    error: "code and eventId are required"
                });
            }
            const result = await promo_code_service_1.PromoCodeService.validate(code, eventId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Lock seats for a user (seat map events)
     */
    static async lockSeats(req, res) {
        try {
            const userId = req.user.userId;
            const { eventId, tierId, seatNumbers } = req.body;
            if (!eventId || !tierId || !seatNumbers || !Array.isArray(seatNumbers)) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and seatNumbers array are required"
                });
            }
            const result = await booking_service_1.BookingService.lockSeats(eventId, tierId, seatNumbers, userId);
            if (!result.success) {
                return res.status(409).json({
                    success: false,
                    error: "Some seats are not available",
                    failedSeats: result.failedSeats
                });
            }
            res.json({
                success: true,
                data: {
                    lockedSeats: result.lockedSeats,
                    expiry: result.expiry
                }
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Release seat locks
     */
    static async releaseSeats(req, res) {
        try {
            const { eventId, tierId, seatNumbers } = req.body;
            if (!eventId || !tierId || !seatNumbers || !Array.isArray(seatNumbers)) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and seatNumbers array are required"
                });
            }
            await booking_service_1.BookingService.releaseSeats(eventId, tierId, seatNumbers);
            res.json({ success: true, message: "Seats released" });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Create a booking reservation
     */
    static async createReservation(req, res) {
        try {
            const userId = req.user.userId;
            const { eventId, tierId, quantity, seatNumbers, paymentMethod, promoCode } = req.body;
            if (!eventId || !tierId || !quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and quantity are required"
                });
            }
            const request = {
                eventId,
                tierId,
                quantity,
                seatNumbers,
                paymentMethod: paymentMethod || "CHAPA",
                promoCode
            };
            const result = await booking_service_1.BookingService.createReservation(userId, request);
            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error });
            }
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Get purchase details for payment page
     */
    static async getPurchase(req, res) {
        try {
            const userId = req.user.userId;
            const purchaseId = parseInt(req.params.purchaseId);
            if (isNaN(purchaseId)) {
                return res.status(400).json({ success: false, error: "Invalid purchase ID" });
            }
            const purchase = await booking_service_1.BookingService.getPurchaseDetails(purchaseId, userId);
            res.json({ success: true, data: purchase });
        }
        catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }
    /**
     * Extend lock time for a pending reservation
     */
    static async extendLock(req, res) {
        try {
            const userId = req.user.userId;
            const purchaseId = parseInt(req.params.purchaseId);
            if (isNaN(purchaseId)) {
                return res.status(400).json({ success: false, error: "Invalid purchase ID" });
            }
            const result = await booking_service_1.BookingService.extendLock(purchaseId, userId);
            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error });
            }
            res.json({ success: true, newExpiry: result.newExpiry });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    /**
     * Cancel a pending reservation
     */
    static async cancelReservation(req, res) {
        try {
            const userId = req.user.userId;
            const purchaseId = parseInt(req.params.purchaseId);
            if (isNaN(purchaseId)) {
                return res.status(400).json({ success: false, error: "Invalid purchase ID" });
            }
            const result = await booking_service_1.BookingService.cancelReservation(purchaseId, userId);
            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error });
            }
            res.json({ success: true, message: "Reservation cancelled" });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}
exports.BookingController = BookingController;
