import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// User Profiles (Available to all authenticated users)
router.get("/me", authenticate, ProfileController.getMyProfile);
router.patch("/me", authenticate, ProfileController.updateMyProfile);

// Organizer Profiles (Organizer Only)
router.get("/organizer", authenticate, authorize([Role.ORGANIZER, Role.ADMIN]), ProfileController.getMyOrganizerProfile);
router.patch("/organizer", authenticate, authorize([Role.ORGANIZER]), ProfileController.updateMyOrganizerProfile);

// Admin Actions
router.get("/admin/organizers", authenticate, authorize([Role.ADMIN]), ProfileController.listOrganizers);
router.post("/admin/organizers/:id/review", authenticate, authorize([Role.ADMIN]), ProfileController.reviewOrganizer);

export default router;
