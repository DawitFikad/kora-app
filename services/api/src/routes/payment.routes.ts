import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public Mock Gateways (Removed for Production)
router.get("/verify-callback", PaymentController.verifyCallback);
// Mobile Completion Page
router.get("/completion", PaymentController.completion);
router.get("/health-check", PaymentController.healthCheck);

// Webhook (Public, but should be signature-verified in production)
router.post("/webhook", PaymentController.webhook);

// Authenticated Endpoints
router.use(authenticate);
router.post("/initialize", PaymentController.initialize);
router.post("/verify", PaymentController.verify);

export default router;
