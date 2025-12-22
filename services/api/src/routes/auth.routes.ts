import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { AuthController } from "../controllers/auth.controller";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Limit each IP to 5 requests per window (strict for OTP)
    message: { error: "Too many authentication attempts, please try again in 15 minutes." }
});

const router = Router();

router.post("/otp/request", authLimiter, AuthController.requestOtp);
router.post("/otp/verify", authLimiter, AuthController.verifyOtp);
router.post("/refresh", AuthController.refreshToken);
router.post("/organizer/register", AuthController.registerOrganizer);

export default router;
