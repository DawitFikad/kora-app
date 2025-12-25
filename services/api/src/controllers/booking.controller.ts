import { Request, Response } from "express";
import { BookingService, BookingRequest } from "../services/booking.service";
import { PromoCodeService } from "../services/promo-code.service";

export class BookingController {
    /**
     * Get event details for booking display
     */
    static async getEventForBooking(req: Request, res: Response) {
        try {
            const eventId = parseInt(req.params.eventId);

            if (isNaN(eventId)) {
                return res.status(400).json({ success: false, error: "Invalid event ID" });
            }

            const event = await BookingService.getEventForBooking(eventId);
            res.json({ success: true, data: event });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    /**
     * Get real-time seat status for seat map events
     */
    static async getSeatStatus(req: Request, res: Response) {
        try {
            const eventId = parseInt(req.params.eventId);
            const tierId = parseInt(req.params.tierId);

            if (isNaN(eventId) || isNaN(tierId)) {
                return res.status(400).json({ success: false, error: "Invalid event or tier ID" });
            }

            const seatStatus = await BookingService.getSeatStatus(eventId, tierId);
            res.json({ success: true, data: seatStatus });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * Calculate price breakdown with optional promo code
     */
    static async calculatePrice(req: Request, res: Response) {
        try {
            const { eventId, tierId, quantity, promoCode } = req.body;

            if (!eventId || !tierId || !quantity) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and quantity are required"
                });
            }

            const priceBreakdown = await BookingService.calculatePrice(
                eventId,
                tierId,
                quantity,
                promoCode
            );

            res.json({ success: true, data: priceBreakdown });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * Validate promo code
     */
    static async validatePromoCode(req: Request, res: Response) {
        try {
            const { code, eventId } = req.body;

            if (!code || !eventId) {
                return res.status(400).json({
                    success: false,
                    error: "code and eventId are required"
                });
            }

            const result = await PromoCodeService.validate(code, eventId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * Lock seats for a user (seat map events)
     */
    static async lockSeats(req: Request, res: Response) {
        try {
            const userId = (req as any).user!.userId;
            const { eventId, tierId, seatNumbers } = req.body;

            if (!eventId || !tierId || !seatNumbers || !Array.isArray(seatNumbers)) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and seatNumbers array are required"
                });
            }

            const result = await BookingService.lockSeats(eventId, tierId, seatNumbers, userId);

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
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Release seat locks
     */
    static async releaseSeats(req: Request, res: Response) {
        try {
            const { eventId, tierId, seatNumbers } = req.body;

            if (!eventId || !tierId || !seatNumbers || !Array.isArray(seatNumbers)) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and seatNumbers array are required"
                });
            }

            await BookingService.releaseSeats(eventId, tierId, seatNumbers);
            res.json({ success: true, message: "Seats released" });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Create a booking reservation
     */
    static async createReservation(req: Request, res: Response) {
        try {
            const userId = (req as any).user!.userId;
            const { eventId, tierId, quantity, seatNumbers, paymentMethod, promoCode } = req.body;

            if (!eventId || !tierId || !quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    error: "eventId, tierId, and quantity are required"
                });
            }

            const request: BookingRequest = {
                eventId,
                tierId,
                quantity,
                seatNumbers,
                paymentMethod: paymentMethod || "CHAPA",
                promoCode
            };

            const result = await BookingService.createReservation(userId, request);

            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error });
            }

            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get purchase details for payment page
     */
    static async getPurchase(req: Request, res: Response) {
        try {
            const userId = (req as any).user!.userId;
            const purchaseId = parseInt(req.params.purchaseId);

            if (isNaN(purchaseId)) {
                return res.status(400).json({ success: false, error: "Invalid purchase ID" });
            }

            const purchase = await BookingService.getPurchaseDetails(purchaseId, userId);
            res.json({ success: true, data: purchase });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    /**
     * Extend lock time for a pending reservation
     */
    static async extendLock(req: Request, res: Response) {
        try {
            const userId = (req as any).user!.userId;
            const purchaseId = parseInt(req.params.purchaseId);

            if (isNaN(purchaseId)) {
                return res.status(400).json({ success: false, error: "Invalid purchase ID" });
            }

            const result = await BookingService.extendLock(purchaseId, userId);

            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error });
            }

            res.json({ success: true, newExpiry: result.newExpiry });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Cancel a pending reservation
     */
    static async cancelReservation(req: Request, res: Response) {
        try {
            const userId = (req as any).user!.userId;
            const purchaseId = parseInt(req.params.purchaseId);

            if (isNaN(purchaseId)) {
                return res.status(400).json({ success: false, error: "Invalid purchase ID" });
            }

            const result = await BookingService.cancelReservation(purchaseId, userId);

            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error });
            }

            res.json({ success: true, message: "Reservation cancelled" });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
