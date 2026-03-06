import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EventService } from "../../src/services/event.service";

const isAuthorized = (req: VercelRequest) => {
    if (!process.env.CRON_SECRET) return true;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    return token === process.env.CRON_SECRET;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized cron request" });
    }

    try {
        await EventService.sendReminders();
        return res.status(200).json({ success: true, message: "Reminders dispatched" });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
