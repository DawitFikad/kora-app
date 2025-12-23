import { Router } from "express";
import { TicketingController } from "../controllers/ticketing.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All ticketing routes require authentication
router.use(authenticate);

router.post("/reserve", TicketingController.reserve);
router.post("/confirm", TicketingController.confirm);
router.get("/me", TicketingController.getMyTickets);

export default router;
