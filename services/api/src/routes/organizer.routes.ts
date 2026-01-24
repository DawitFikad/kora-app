import { Router } from "express";
import { OrganizerController } from "../controllers/organizer.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { upload } from "../config/upload.config";

const router = Router();

// All organizer routes require authentication and ORGANIZER role
router.use(authenticate);
router.use(authorize([Role.ORGANIZER, Role.ADMIN])); // Admins can also see dashboards for support

router.get("/overview", OrganizerController.getOverview);
router.get("/events", OrganizerController.getMyEvents);
router.post("/events", OrganizerController.createEvent);
router.get("/attendees", OrganizerController.getAttendees);
router.get("/financials", OrganizerController.getFinancials);
router.get("/ticket-stats", OrganizerController.getTicketStats);
router.get("/settings", OrganizerController.getSettings);
router.patch("/settings", OrganizerController.updateSettings);
router.post("/promos", OrganizerController.createPromoCode);
router.get("/promos", OrganizerController.getPromoCodes);
router.get("/events/:id/dashboard", OrganizerController.getDashboard);
router.get("/events/:id", OrganizerController.getEventById);
router.patch("/events/:id", OrganizerController.updateEvent);
router.post("/events/:id/feature", OrganizerController.requestFeature);
router.post("/support", OrganizerController.contactSupport);

// Payment Methods
router.get("/payment-methods", OrganizerController.getPaymentMethods);
router.post("/payment-methods", OrganizerController.addPaymentMethod);
router.delete("/payment-methods/:id", OrganizerController.deletePaymentMethod);
router.patch("/payment-methods/:id/default", OrganizerController.setDefaultPaymentMethod);

// Notifications
router.get("/notifications", OrganizerController.getNotifications);
router.patch("/notifications/read", OrganizerController.markNotificationsRead);

// Payouts
router.get("/payouts", OrganizerController.getPayoutHistory);

// Refunds & Cancellations
router.get("/refunds", OrganizerController.getRefunds);
router.post("/refunds/request", OrganizerController.requestRefund);
router.get("/events/:id/refund-impact", OrganizerController.getRefundImpact);
router.post("/events/:id/request-cancellation", OrganizerController.requestCancellation);

// Profile Management
router.post("/profile/upload-logo", upload.single('logo'), OrganizerController.uploadLogo);
router.delete("/profile/remove-logo", OrganizerController.removeLogo);
router.post("/profile/change-password", OrganizerController.changePassword);
router.post("/profile/change-phone-request", OrganizerController.requestPhoneChange);
router.post("/profile/change-phone-verify", OrganizerController.verifyPhoneChange);

export default router;
