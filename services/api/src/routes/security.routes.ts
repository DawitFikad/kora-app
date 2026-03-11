import { Router } from "express";
import { FraudController } from "../controllers/fraud.controller";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// --- Fraud Admin Routes ---
router.get("/fraud/metrics", authenticate, authorize([Role.ADMIN]), FraudController.getSecurityMetrics);
router.get("/fraud/alerts", authenticate, authorize([Role.ADMIN]), FraudController.listAlerts);
router.get("/fraud/alerts/:id", authenticate, authorize([Role.ADMIN]), FraudController.getAlertDetails);
router.post("/fraud/alerts/:id/resolve", authenticate, authorize([Role.ADMIN]), FraudController.resolveAlert);
router.post("/fraud/alerts/:id/clear", authenticate, authorize([Role.ADMIN]), FraudController.clearAlert);
router.post("/fraud/organizers/:organizerId/clear-blocking", authenticate, authorize([Role.ADMIN]), FraudController.clearOrganizerAlerts);
router.get("/fraud/organizers/:organizerId/blocking-alerts", authenticate, authorize([Role.ADMIN]), FraudController.getOrganizerBlockingAlerts);
router.get("/fraud/risk-scores", authenticate, authorize([Role.ADMIN]), FraudController.getRiskScores);
router.post("/fraud/freeze-organizer/:id", authenticate, authorize([Role.ADMIN]), FraudController.freezeOrganizer);

// --- Analytics Routes ---
router.get("/analytics/live/:eventId", authenticate, authorize([Role.ORGANIZER, Role.ADMIN]), AnalyticsController.getLiveMetrics);
router.get("/analytics/report/:eventId", authenticate, authorize([Role.ORGANIZER, Role.ADMIN]), AnalyticsController.getPostEventReport);

export default router;
