import { Router } from "express";
import { TicketingController } from "../controllers/ticketing.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All ticketing routes require authentication
router.use(authenticate);

router.post("/reserve", TicketingController.reserve);
router.get("/me", TicketingController.getMyTickets);

// Admin Only
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";
router.post("/:ticketId/invalidate", authorize([Role.ADMIN]), TicketingController.invalidate);

export default router;
