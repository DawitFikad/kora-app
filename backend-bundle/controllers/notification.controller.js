"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_1 = require("../lib/prisma");
class NotificationController {
    /**
     * GET /api/notifications
     * List my notifications.
     */
    static async getMyNotifications(req, res) {
        try {
            const userId = req.user.userId;
            const notifications = await prisma_1.prisma.notificationLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            res.json({ success: true, data: notifications });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * POST /api/notifications/mark-all-read
     */
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.userId;
            await prisma_1.prisma.notificationLog.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
            res.json({ success: true, message: "All notifications marked as read" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * PATCH /api/notifications/:id/read
     */
    static async markAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            await prisma_1.prisma.notificationLog.updateMany({
                where: { id: parseInt(id), userId },
                data: { isRead: true }
            });
            res.json({ success: true, message: "Notification marked as read" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * DELETE /api/notifications/:id
     */
    static async deleteNotification(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const result = await prisma_1.prisma.notificationLog.deleteMany({
                where: { id: parseInt(id), userId }
            });
            if (result.count === 0) {
                return res.status(404).json({ success: false, message: "Notification not found" });
            }
            res.json({ success: true, message: "Notification deleted" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Internal Template Engine
     */
    static getTemplate(key, lang, vars) {
        const templates = {
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
exports.NotificationController = NotificationController;
