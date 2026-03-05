"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const content_controller_1 = require("../controllers/content.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Routes for both Public and Admin
router.get("/categories", content_controller_1.ContentController.getCategories);
router.get("/categories/list/main", content_controller_1.ContentController.getMainCategories);
router.get("/categories/list/sub", content_controller_1.ContentController.getSubCategories); // Query param ?parentId=X optional
router.get("/categories/:id", content_controller_1.ContentController.getCategoryDetail);
router.get("/cities", content_controller_1.ContentController.getCities);
router.get("/cities/:id", content_controller_1.ContentController.getCityDetail);
router.get("/banners", content_controller_1.ContentController.getBanners);
router.get("/banners/:id", content_controller_1.ContentController.getBannerDetail);
router.post("/banners/:id/view", content_controller_1.ContentController.trackBannerView);
router.post("/banners/:id/click", content_controller_1.ContentController.trackBannerClick);
// Admin and Organizer Routes (allow organizers to manage their own content)
router.post("/categories", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN, client_1.Role.ORGANIZER]), content_controller_1.ContentController.addCategory);
router.delete("/categories/:id", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN, client_1.Role.ORGANIZER]), content_controller_1.ContentController.removeCategory);
router.post("/cities", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN, client_1.Role.ORGANIZER]), content_controller_1.ContentController.addCity);
router.delete("/cities/:id", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN, client_1.Role.ORGANIZER]), content_controller_1.ContentController.removeCity);
router.post("/banners", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), content_controller_1.ContentController.addBanner);
router.put("/banners/:id", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), content_controller_1.ContentController.updateBanner);
router.delete("/banners/:id", auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)([client_1.Role.ADMIN]), content_controller_1.ContentController.removeBanner);
exports.default = router;
