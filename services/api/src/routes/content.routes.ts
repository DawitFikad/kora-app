import { Router } from "express";
import { ContentController } from "../controllers/content.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Routes for both Public and Admin
router.get("/categories", ContentController.getCategories);
router.get("/cities", ContentController.getCities);

// Admin Only Routes
router.post("/categories", authenticate, authorize([Role.ADMIN]), ContentController.addCategory);
router.delete("/categories/:id", authenticate, authorize([Role.ADMIN]), ContentController.removeCategory);

router.post("/cities", authenticate, authorize([Role.ADMIN]), ContentController.addCity);
router.delete("/cities/:id", authenticate, authorize([Role.ADMIN]), ContentController.removeCity);

export default router;
