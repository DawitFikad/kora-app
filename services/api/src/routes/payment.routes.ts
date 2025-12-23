import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public Mock Gateways (Simulated Provider Pages)
router.get("/mock-gateways/:provider", PaymentController.mockGateway);

// Webhook (Public, but should be signature-verified in production)
router.post("/webhook", PaymentController.webhook);

// Authenticated Endpoints
router.use(authenticate);
router.post("/initialize", PaymentController.initialize);
router.post("/verify", PaymentController.verify);

export default router;
