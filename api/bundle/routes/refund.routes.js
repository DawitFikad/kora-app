"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const refund_controller_1 = require("../controllers/refund.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// User-facing refund request
router.post("/request", refund_controller_1.RefundController.requestRefund);
// Admin-facing refund management
router.get("/", (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), refund_controller_1.RefundController.listRefunds);
router.post("/:id/approve", (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), refund_controller_1.RefundController.approveRefund);
router.post("/:id/reject", (0, auth_middleware_1.authorize)([client_1.Role.ADMIN]), refund_controller_1.RefundController.rejectRefund);
exports.default = router;
