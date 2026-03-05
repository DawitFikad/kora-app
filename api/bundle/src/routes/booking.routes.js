"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Public routes (no auth required)
 */
// Get event details for booking display
router.get("/events/:eventId", booking_controller_1.BookingController.getEventForBooking);
// Get real-time seat status for seat map events
router.get("/events/:eventId/tiers/:tierId/seats", booking_controller_1.BookingController.getSeatStatus);
// Calculate price breakdown (can be public for preview)
router.post("/calculate-price", booking_controller_1.BookingController.calculatePrice);
// Validate promo code (can be public for preview)
router.post("/validate-promo", booking_controller_1.BookingController.validatePromoCode);
/**
 * Protected routes (auth required)
 */
// Lock seats (for seat selection)
router.post("/lock-seats", auth_middleware_1.authenticate, booking_controller_1.BookingController.lockSeats);
// Release seats
router.post("/release-seats", auth_middleware_1.authenticate, booking_controller_1.BookingController.releaseSeats);
// Create reservation
router.post("/reserve", auth_middleware_1.authenticate, booking_controller_1.BookingController.createReservation);
// Get purchase details
router.get("/:purchaseId", auth_middleware_1.authenticate, booking_controller_1.BookingController.getPurchase);
// Extend lock time
router.post("/:purchaseId/extend", auth_middleware_1.authenticate, booking_controller_1.BookingController.extendLock);
// Cancel reservation
router.post("/:purchaseId/cancel", auth_middleware_1.authenticate, booking_controller_1.BookingController.cancelReservation);
exports.default = router;
