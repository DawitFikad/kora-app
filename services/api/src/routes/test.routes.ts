import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Test protected route (any authenticated user)
router.get("/protected", authenticate, (req, res) => {
    res.json({
        message: "Access granted",
        user: req.user
    });
});

// Test organizer-only route
router.get("/organizer-only", authenticate, authorize([Role.ORGANIZER, Role.ADMIN]), (req, res) => {
    res.json({
        message: "Organizer access granted",
        user: req.user
    });
});

// Test admin-only route
router.get("/admin-only", authenticate, authorize([Role.ADMIN]), (req, res) => {
    res.json({
        message: "Admin access granted",
        user: req.user
    });
});

export default router;
