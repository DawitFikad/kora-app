import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

// User can view their notification history
router.get("/", NotificationController.getMyNotifications);

export default router;
