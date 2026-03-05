"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fraud_controller_1 = require("../controllers/fraud.controller");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// --- Fraud Admin Routes ---
router.get("/fraud/metrics", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), fraud_controller_1.FraudController.getSecurityMetrics);
router.get("/fraud/alerts", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), fraud_controller_1.FraudController.listAlerts);
router.get("/fraud/alerts/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), fraud_controller_1.FraudController.getAlertDetails);
router.post("/fraud/alerts/:id/resolve", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), fraud_controller_1.FraudController.resolveAlert);
router.get("/fraud/risk-scores", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), fraud_controller_1.FraudController.getRiskScores);
router.post("/fraud/freeze-organizer/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), fraud_controller_1.FraudController.freezeOrganizer);
// --- Analytics Routes ---
router.get("/analytics/live/:eventId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ORGANIZER, client_1.Role.ADMIN]), analytics_controller_1.AnalyticsController.getLiveMetrics);
router.get("/analytics/report/:eventId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.ORGANIZER, client_1.Role.ADMIN]), analytics_controller_1.AnalyticsController.getPostEventReport);
exports.default = router;
