import { Router } from "express";
import { ValidationController } from "../controllers/validation.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Only ADMIN, ORGANIZER, and dedicated SCANNER accounts can validate
const scannerAuth = [authenticate, authorize(["ADMIN", "ORGANIZER", "SCANNER"])];

router.post("/scan", scannerAuth, ValidationController.scan);
router.post("/sync", scannerAuth, ValidationController.sync);
router.get("/sync-data/:eventId", scannerAuth, ValidationController.downloadSyncData);

export default router;
