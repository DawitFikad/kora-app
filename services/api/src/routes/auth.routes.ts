import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { error: "Too many authentication attempts, please try again in 15 minutes." }
});

const router = Router();

router.post("/otp/request", authLimiter, AuthController.requestOtp);
router.post("/otp/verify", authLimiter, AuthController.verifyOtp);
router.post("/refresh", AuthController.refreshToken);
router.post("/organizer/register", AuthController.registerOrganizer);
router.get("/me", authenticate, AuthController.getMe);

export default router;
