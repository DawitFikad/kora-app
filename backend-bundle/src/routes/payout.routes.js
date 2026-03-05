"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payout_controller_1 = require("../controllers/payout.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Organizer: Request and View Payouts
router.post("/request", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER]), payout_controller_1.PayoutController.requestPayout);
router.get("/my", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ORGANIZER]), payout_controller_1.PayoutController.getMyPayouts);
// Admin: Manage Payouts
router.get("/pending", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), payout_controller_1.PayoutController.listPendingPayouts);
router.get("/processed", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), payout_controller_1.PayoutController.listProcessedPayouts);
router.post("/:batchId/approve", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), payout_controller_1.PayoutController.approvePayout);
router.post("/:batchId/reject", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), payout_controller_1.PayoutController.rejectPayout);
exports.default = router;
