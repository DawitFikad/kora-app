import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Public Metadata
router.get("/meta", EventController.getMetadata);

// Public Discovery (Optional Auth)
router.get("/", optionalAuthenticate, EventController.getAllEvents);
router.get("/best-this-week", optionalAuthenticate, EventController.getBestThisWeek);
router.get("/trending-now", optionalAuthenticate, EventController.getTrendingNow);
router.get("/personalized-picks", optionalAuthenticate, EventController.getPersonalizedPicks);
router.get("/upcoming-awards", optionalAuthenticate, EventController.getUpcomingAwards);
router.get("/workshops-short-courses", optionalAuthenticate, EventController.getWorkshopsShortCourses);
router.get("/city-spotlight", optionalAuthenticate, EventController.getCitySpotlight);
router.get("/last-minute-today", optionalAuthenticate, EventController.getLastMinuteTodayEvents);
router.get("/offers-deals", optionalAuthenticate, EventController.getOffersDeals);
router.get("/new-upcoming-experiences", optionalAuthenticate, EventController.getNewUpcomingExperiences);
router.get("/recommended-movies", optionalAuthenticate, EventController.getRecommendedMovies);
router.get("/:id", optionalAuthenticate, EventController.getEvent);

// Organizer Management
router.post("/", authenticate, authorize([Role.ORGANIZER]), EventController.createEvent);
router.put("/:id", authenticate, authorize([Role.ORGANIZER]), EventController.updateEvent);

// Admin Moderation
router.get("/admin/list", authenticate, authorize([Role.ADMIN]), EventController.listAllEvents);
router.post("/:id/review", authenticate, authorize([Role.ADMIN]), EventController.reviewEvent);

export default router;
