import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/otp/request", AuthController.requestOtp);
router.post("/otp/verify", AuthController.verifyOtp);
router.post("/organizer/register", AuthController.registerOrganizer);

export default router;
