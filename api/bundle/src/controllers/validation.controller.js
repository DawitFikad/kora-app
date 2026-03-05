"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationController = void 0;
const validation_service_1 = require("../services/validation.service");
class ValidationController {
    /**
     * Handles real-time (Online) ticket scanning.
     */
    static async scan(req, res) {
        try {
            const { qrPayload, gateId, deviceId } = req.body;
            console.log("Validating Ticket:", qrPayload);
            if (!qrPayload) {
                return res.status(400).json({ message: "QR payload is required" }); // Key changed
            }
            const result = await validation_service_1.ValidationService.validateOnline(qrPayload, gateId, deviceId);
            if (!result.success) {
                return res.status(400).json(result); // Result has 'message'
            }
            res.json(result);
        }
        catch (error) {
            console.error("Validation Controller Error:", error);
            res.status(500).json({ message: error.message }); // Key changed
        }
    }
    /**
     * Downloads ALL valid ticket IDs for an event to prepare for offline scanning.
     */
    static async downloadSyncData(req, res) {
        try {
            const { eventId } = req.params;
            const data = await validation_service_1.ValidationService.getOfflineSyncData(parseInt(eventId));
            res.json({ success: true, data });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    /**
     * Reconciles offline scan logs with the backend database.
     */
    static async sync(req, res) {
        try {
            const { logs } = req.body;
            if (!Array.isArray(logs)) {
                return res.status(400).json({ success: false, error: "Logs array is required" });
            }
            const { results, syncedIds } = await validation_service_1.ValidationService.syncOfflineLogs(logs);
            res.json({ success: true, message: "Sync complete", results, syncedIds });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.ValidationController = ValidationController;
