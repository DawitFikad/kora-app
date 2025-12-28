import { Router } from "express";
import { OrganizerController } from "../controllers/organizer.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

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

export default router;
