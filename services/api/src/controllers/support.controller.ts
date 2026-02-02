import { Request, Response } from "express";
import { SupportService } from "../services/support.service";

export class SupportController {
    static async handleSubmit(req: Request, res: Response) {
        try {
            const { name, email, subject, message } = req.body;

            if (!name || !email || !subject || !message) {
                return res.status(400).json({ error: "All fields are required" });
            }

            const result = await SupportService.handleContactSubmission({
                name,
                email,
                subject,
                message
            });

            res.json(result);
        } catch (error: any) {
            console.error("[SupportController] Error:", error);
            res.status(500).json({ error: error.message || "Failed to process support request" });
        }
    }
}
