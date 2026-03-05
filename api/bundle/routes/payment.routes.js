"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public Mock Gateways (Removed for Production)
router.get("/verify-callback", payment_controller_1.PaymentController.verifyCallback);
// Mobile Completion Page
router.get("/completion", payment_controller_1.PaymentController.completion);
router.get("/health-check", payment_controller_1.PaymentController.healthCheck);
// Webhook (Public, but should be signature-verified in production)
router.post("/webhook", payment_controller_1.PaymentController.webhook);
// Authenticated Endpoints
router.use(auth_middleware_1.authenticate);
router.post("/initialize", payment_controller_1.PaymentController.initialize);
router.post("/verify", payment_controller_1.PaymentController.verify);
exports.default = router;
