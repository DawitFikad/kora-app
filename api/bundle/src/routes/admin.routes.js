"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All admin routes require authentication and ADMIN role
// Except createAdmin which is for initial setup
// Create admin (for testing/initial setup - should be secured in production)
router.post("/create-admin", admin_controller_1.AdminController.createAdmin);
// Invite Admin (Email-based)
router.post("/invite", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.inviteAdmin);
// Get platform stats
router.get("/stats", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getStats);
router.get("/analytics", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getDetailedStats);
// Get all users (with optional filters)
router.get("/users", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getAllUsers);
// Approve pending organizer
router.patch("/users/:userId/approve", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.approveOrganizer);
// Suspend user
router.patch("/users/:userId/suspend", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.suspendUser);
// Activate user
router.patch("/users/:userId/activate", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.activateUser);
// Delete user (Admin management)
router.delete("/users/:userId", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.deleteUser);
// Feature Event
router.patch("/events/:eventId/featured", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.toggleEventFeatured);
// Notifications
router.get("/notifications", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getNotifications);
router.delete("/notifications/clear", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.clearAuditLogs);
router.delete("/notifications/:id", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.deleteNotification);
router.post("/feature-requests/:notificationId/respond", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.respondToFeatureRequest);
// Refunds & Cancellations (Admin Review)
router.get('/cancellation-requests', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getCancellationRequests);
router.post('/cancellation-requests/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.approveCancellationRequest);
router.post('/cancellation-requests/:id/reject', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.rejectCancellationRequest);
// System Config
router.get("/config", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getSystemConfigs);
router.patch("/config", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.updateSystemConfig);
// Platform Fees
router.get("/fees", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.getPlatformFees);
router.patch("/fees", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.updatePlatformFee);
// Read-only payments toggle (preview/admin mode)
router.post('/payments/read-only', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), admin_controller_1.AdminController.togglePaymentsReadOnly);
exports.default = router;
