import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Public routes (no auth required)
 */
// Get event details for booking display
router.get("/events/:eventId", BookingController.getEventForBooking);

// Get real-time seat status for seat map events
router.get("/events/:eventId/tiers/:tierId/seats", BookingController.getSeatStatus);

// Calculate price breakdown (can be public for preview)
router.post("/calculate-price", BookingController.calculatePrice);

// Validate promo code (can be public for preview)
router.post("/validate-promo", BookingController.validatePromoCode);

/**
 * Protected routes (auth required)
 */
// Lock seats (for seat selection)
router.post("/lock-seats", authenticate, BookingController.lockSeats);

// Release seats
router.post("/release-seats", authenticate, BookingController.releaseSeats);

// Create reservation
router.post("/reserve", authenticate, BookingController.createReservation);

// Get purchase details
router.get("/:purchaseId", authenticate, BookingController.getPurchase);

// Extend lock time
router.post("/:purchaseId/extend", authenticate, BookingController.extendLock);

// Cancel reservation
router.post("/:purchaseId/cancel", authenticate, BookingController.cancelReservation);

export default router;
