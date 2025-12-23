import { Router } from "express";
import { OrganizerController } from "../controllers/organizer.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// All organizer routes require authentication and ORGANIZER role
router.use(authenticate);
router.use(authorize([Role.ORGANIZER, Role.ADMIN])); // Admins can also see dashboards for support

router.get("/events", OrganizerController.getMyEvents);
router.get("/events/:id/dashboard", OrganizerController.getDashboard);

export default router;
