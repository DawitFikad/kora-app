import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// All admin routes require authentication and ADMIN role
// Except createAdmin which is for initial setup

// Create admin (for testing/initial setup - should be secured in production)
router.post("/create-admin", AdminController.createAdmin);

// Get platform stats
router.get("/stats", authenticate, authorize([Role.ADMIN]), AdminController.getStats);
router.get("/analytics", authenticate, authorize([Role.ADMIN]), AdminController.getDetailedStats);

// Get all users (with optional filters)
router.get("/users", authenticate, authorize([Role.ADMIN]), AdminController.getAllUsers);

// Approve pending organizer
router.patch("/users/:userId/approve", authenticate, authorize([Role.ADMIN]), AdminController.approveOrganizer);

// Suspend user
router.patch("/users/:userId/suspend", authenticate, authorize([Role.ADMIN]), AdminController.suspendUser);

// Activate user
router.patch("/users/:userId/activate", authenticate, authorize([Role.ADMIN]), AdminController.activateUser);

// Feature Event
router.patch("/events/:eventId/featured", authenticate, authorize([Role.ADMIN]), AdminController.toggleEventFeatured);

// Notifications
router.get("/notifications", authenticate, authorize([Role.ADMIN]), AdminController.getNotifications);
router.post("/feature-requests/:notificationId/respond", authenticate, authorize([Role.ADMIN]), AdminController.respondToFeatureRequest);

// System Config
router.get("/config", authenticate, authorize([Role.ADMIN]), AdminController.getSystemConfigs);
router.patch("/config", authenticate, authorize([Role.ADMIN]), AdminController.updateSystemConfig);

// Platform Fees
router.get("/fees", authenticate, authorize([Role.ADMIN]), AdminController.getPlatformFees);
router.patch("/fees", authenticate, authorize([Role.ADMIN]), AdminController.updatePlatformFee);

export default router;
