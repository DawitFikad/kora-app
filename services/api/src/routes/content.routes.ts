import { Router } from "express";
import { ContentController } from "../controllers/content.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Routes for both Public and Admin
router.get("/categories", ContentController.getCategories);
router.get("/categories/:id", ContentController.getCategoryDetail);
router.get("/cities", ContentController.getCities);
router.get("/cities/:id", ContentController.getCityDetail);

// Admin and Organizer Routes (allow organizers to manage their own content)
router.post("/categories", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.addCategory);
router.delete("/categories/:id", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.removeCategory);

router.post("/cities", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.addCity);
router.delete("/cities/:id", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.removeCity);

export default router;
