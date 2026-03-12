import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate, authenticateWithQueryToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stream", authenticateWithQueryToken, NotificationController.streamMyNotifications);

router.use(authenticate);

// User can view their notification history
router.get("/", NotificationController.getMyNotifications);
router.post("/mark-all-read", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export default router;
