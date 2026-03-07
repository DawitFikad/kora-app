import { Router } from "express";
import { StaffController } from "../controllers/staff.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Public-ish / Logged in users: Accept invite
router.post("/accept", StaffController.acceptInvite);
router.get("/invite-status", StaffController.getMyInviteStatus);

// Organizer Only: Manage staff
router.use(authorize([Role.ORGANIZER]));

router.get("/", StaffController.listMyStaff);
router.post("/invite", StaffController.inviteManual);
router.delete("/:id", StaffController.removeStaff);

export default router;
