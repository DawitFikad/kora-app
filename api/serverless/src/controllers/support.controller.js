"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const support_service_1 = require("../services/support.service");
class SupportController {
    static async handleSubmit(req, res) {
        try {
            const { name, email, subject, message } = req.body;
            if (!name || !email || !subject || !message) {
                return res.status(400).json({ error: "All fields are required" });
            }
            const result = await support_service_1.SupportService.handleContactSubmission({
                name,
                email,
                subject,
                message
            });
            res.json(result);
        }
        catch (error) {
            console.error("[SupportController] Error:", error);
            res.status(500).json({ error: error.message || "Failed to process support request" });
        }
    }
}
exports.SupportController = SupportController;
