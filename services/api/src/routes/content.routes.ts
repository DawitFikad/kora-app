import { Router } from "express";
import { ContentController } from "../controllers/content.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Routes for both Public and Admin
router.get("/categories", ContentController.getCategories);
router.get("/categories/list/main", ContentController.getMainCategories);
router.get("/categories/list/sub", ContentController.getSubCategories); // Query param ?parentId=X optional
router.get("/categories/:id", ContentController.getCategoryDetail);
router.get("/cities", ContentController.getCities);
router.get("/cities/:id", ContentController.getCityDetail);
router.get("/banners", ContentController.getBanners);
router.get("/banners/:id", ContentController.getBannerDetail);
router.post("/banners/:id/view", ContentController.trackBannerView);
router.post("/banners/:id/click", ContentController.trackBannerClick);

// Admin and Organizer Routes (allow organizers to manage their own content)
router.post("/categories", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.addCategory);
router.delete("/categories/:id", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.removeCategory);

router.post("/cities", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.addCity);
router.delete("/cities/:id", authenticate, authorize([Role.ADMIN, Role.ORGANIZER]), ContentController.removeCity);

router.post("/banners", authenticate, authorize([Role.ADMIN]), ContentController.addBanner);
router.put("/banners/:id", authenticate, authorize([Role.ADMIN]), ContentController.updateBanner);
router.delete("/banners/:id", authenticate, authorize([Role.ADMIN]), ContentController.removeBanner);

export default router;
