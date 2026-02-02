import { Router } from "express";
import { SupportController } from "../controllers/support.controller";
import { rateLimit } from "express-rate-limit";

const router = Router();

// Specific rate limit for contact form to prevent spam
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // 5 messages per hour
    message: { error: "Too many messages. Please try again later." }
});

router.post("/contact", contactLimiter, SupportController.handleSubmit);

export default router;
