import { Request, Response } from "express";
import { ValidationService } from "../services/validation.service";

export class ValidationController {
    /**
     * Handles real-time (Online) ticket scanning.
     */
    static async scan(req: Request, res: Response) {
        try {
            const { qrPayload, gateId, deviceId } = req.body;
            console.log("Validating Ticket:", qrPayload);

            if (!qrPayload) {
                return res.status(400).json({ message: "QR payload is required" }); // Key changed
            }

            const result = await ValidationService.validateOnline(qrPayload, gateId, deviceId);

            if (!result.success) {
                return res.status(400).json(result); // Result has 'message'
            }

            res.json(result);
        } catch (error: any) {
            console.error("Validation Controller Error:", error);
            res.status(500).json({ message: error.message }); // Key changed
        }
    }

    /**
     * Downloads ALL valid ticket IDs for an event to prepare for offline scanning.
     */
    static async downloadSyncData(req: Request, res: Response) {
        try {
            const { eventId } = req.params;
            const data = await ValidationService.getOfflineSyncData(parseInt(eventId));
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Reconciles offline scan logs with the backend database.
     */
    static async sync(req: Request, res: Response) {
        try {
            const { logs } = req.body;
            if (!Array.isArray(logs)) {
                return res.status(400).json({ error: "Logs array is required" });
            }

            const results = await ValidationService.syncOfflineLogs(logs);
            res.json({ message: "Sync complete", results });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
