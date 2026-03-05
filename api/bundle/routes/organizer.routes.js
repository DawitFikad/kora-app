"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizer_controller_1 = require("../controllers/organizer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const upload_config_1 = require("../config/upload.config");
const router = (0, express_1.Router)();
// All organizer routes require authentication and ORGANIZER role
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)([client_1.Role.ORGANIZER, client_1.Role.ADMIN])); // Admins can also see dashboards for support
router.get("/overview", organizer_controller_1.OrganizerController.getOverview);
router.get("/events", organizer_controller_1.OrganizerController.getMyEvents);
router.post("/events", organizer_controller_1.OrganizerController.createEvent);
router.get("/attendees", organizer_controller_1.OrganizerController.getAttendees);
router.get("/financials", organizer_controller_1.OrganizerController.getFinancials);
router.get("/ticket-stats", organizer_controller_1.OrganizerController.getTicketStats);
router.patch("/tiers/:id", organizer_controller_1.OrganizerController.updateTicketTier);
router.get("/settings", organizer_controller_1.OrganizerController.getSettings);
router.patch("/settings", organizer_controller_1.OrganizerController.updateSettings);
router.post("/security/2fa/request", organizer_controller_1.OrganizerController.requestTwoFactorOtp);
router.post("/security/2fa/verify", organizer_controller_1.OrganizerController.verifyTwoFactorOtp);
router.post("/promos", organizer_controller_1.OrganizerController.createPromoCode);
router.get("/promos", organizer_controller_1.OrganizerController.getPromoCodes);
router.delete("/promos/:id", organizer_controller_1.OrganizerController.deletePromoCode);
router.get("/events/:id/dashboard", organizer_controller_1.OrganizerController.getDashboard);
router.get("/events/:id", organizer_controller_1.OrganizerController.getEventById);
router.patch("/events/:id", organizer_controller_1.OrganizerController.updateEvent);
router.post("/events/:id/duplicate", organizer_controller_1.OrganizerController.duplicateEvent);
router.post("/events/:id/feature", organizer_controller_1.OrganizerController.requestFeature);
router.post("/attendees/:id/resend", organizer_controller_1.OrganizerController.resendTicket);
router.post("/attendees/:id/check-in", organizer_controller_1.OrganizerController.manualCheckIn);
router.post("/attendees/:id/vip", organizer_controller_1.OrganizerController.tagVip);
router.post("/support", organizer_controller_1.OrganizerController.contactSupport);
// Payment Methods
router.get("/payment-methods", organizer_controller_1.OrganizerController.getPaymentMethods);
router.post("/payment-methods", organizer_controller_1.OrganizerController.addPaymentMethod);
router.delete("/payment-methods/:id", organizer_controller_1.OrganizerController.deletePaymentMethod);
router.patch("/payment-methods/:id/default", organizer_controller_1.OrganizerController.setDefaultPaymentMethod);
// Notifications
router.get("/notifications", organizer_controller_1.OrganizerController.getNotifications);
router.patch("/notifications/read", organizer_controller_1.OrganizerController.markNotificationsRead);
// Payouts
router.get("/payouts", organizer_controller_1.OrganizerController.getPayoutHistory);
// Refunds & Cancellations
router.get("/refunds", organizer_controller_1.OrganizerController.getRefunds);
router.post("/refunds/request", organizer_controller_1.OrganizerController.requestRefund);
router.post("/refunds/:id/approve", organizer_controller_1.OrganizerController.approveRefund);
router.post("/refunds/:id/reject", organizer_controller_1.OrganizerController.rejectRefund);
router.get("/events/:id/refund-impact", organizer_controller_1.OrganizerController.getRefundImpact);
router.post("/events/:id/request-cancellation", organizer_controller_1.OrganizerController.requestCancellation);
// Profile Management
router.post("/profile/upload-logo", upload_config_1.upload.single('logo'), organizer_controller_1.OrganizerController.uploadLogo);
router.delete("/profile/remove-logo", organizer_controller_1.OrganizerController.removeLogo);
router.post("/profile/change-password", organizer_controller_1.OrganizerController.changePassword);
router.post("/profile/change-phone-request", organizer_controller_1.OrganizerController.requestPhoneChange);
router.post("/profile/change-phone-verify", organizer_controller_1.OrganizerController.verifyPhoneChange);
exports.default = router;
