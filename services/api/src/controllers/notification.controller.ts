import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class NotificationController {
    /**
     * GET /api/notifications
     * List my notifications.
     */
    static async getMyNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const notifications = await prisma.notificationLog.findMany({
                where: {
                    userId,
                    channel: "PUSH",
                    recipient: "APP",
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            const payload = notifications.map((n) => ({
                ...n,
                message: (n as any).message ?? n.content,
            }));
            res.json({ success: true, data: payload });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/notifications/stream
     * SSE stream for near real-time user notification updates.
     */
    static async streamMyNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders?.();

            const writeEvent = (event: string, payload: any) => {
                res.write(`event: ${event}\n`);
                res.write(`data: ${JSON.stringify(payload)}\n\n`);
            };

            const fetchSnapshot = async () => {
                const where = {
                    userId,
                    channel: "PUSH",
                    recipient: "APP",
                } as const;

                const [latest, unreadCount] = await Promise.all([
                    prisma.notificationLog.findFirst({
                        where,
                        orderBy: { createdAt: "desc" },
                        select: { id: true, createdAt: true },
                    }),
                    prisma.notificationLog.count({
                        where: {
                            ...where,
                            isRead: false,
                        },
                    }),
                ]);

                return {
                    latestId: latest?.id || 0,
                    latestAt: latest?.createdAt || null,
                    unreadCount,
                };
            };

            let last = await fetchSnapshot();
            writeEvent("connected", { ok: true, ...last });

            const tick = setInterval(async () => {
                try {
                    const next = await fetchSnapshot();
                    if (next.latestId !== last.latestId || next.unreadCount !== last.unreadCount) {
                        last = next;
                        writeEvent("notifications", next);
                    }
                } catch (error: any) {
                    writeEvent("error", { message: error?.message || "Stream check failed" });
                }
            }, 2000);

            const keepAlive = setInterval(() => {
                res.write(": ping\n\n");
            }, 15000);

            req.on("close", () => {
                clearInterval(tick);
                clearInterval(keepAlive);
                res.end();
            });
        } catch (error: any) {
            console.error("Notification stream error:", error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    }

    /**
     * POST /api/notifications/mark-all-read
     */
    static async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            await prisma.notificationLog.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
            res.json({ success: true, message: "All notifications marked as read" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/notifications/:id/read
     */
    static async markAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;

            await prisma.notificationLog.updateMany({
                where: { id: parseInt(id), userId },
                data: { isRead: true }
            });
            res.json({ success: true, message: "Notification marked as read" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * DELETE /api/notifications/:id
     */
    static async deleteNotification(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;

            const result = await prisma.notificationLog.deleteMany({
                where: { id: parseInt(id), userId }
            });

            if (result.count === 0) {
                return res.status(404).json({ success: false, message: "Notification not found" });
            }

            res.json({ success: true, message: "Notification deleted" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Internal Template Engine
     */
    static getTemplate(key: string, lang: 'en' | 'am', vars: Record<string, string>) {
        const templates: any = {
            'confirm_purchase': {
                'en': 'Success! Your tickets for {eventTitle} have been confirmed. View them in the app.',
                'am': 'እንኳን ደስ አለዎት! ለ{eventTitle} የገዙት ቲኬት ተረጋግጧል። በሞባይል መተግበሪያው ላይ ማየት ይችላሉ።'
            },
            'refund_approved': {
                'en': 'Your refund of {amount} ETB for {eventTitle} has been approved.',
                'am': 'ከ{eventTitle} ጋር የተያያዘው {amount} ETB ተመላሽ ተረጋግጧል።'
            },
            'event_cancelled': {
                'en': 'Urgent: {eventTitle} has been cancelled. A refund of {amount} ETB is being processed.',
                'am': 'አስቸኳይ መረጃ፡ {eventTitle} ተሰርዟል። የ{amount} ብር ተመላሽ እየተሰራ ነው።'
            }
        };

        let template = templates[key]?.[lang] || templates[key]?.['en'] || key;

        Object.entries(vars).forEach(([k, v]) => {
            template = template.replace(`{${k}}`, v);
        });

        return template;
    }
}
