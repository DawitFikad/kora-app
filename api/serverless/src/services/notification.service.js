"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const sms_service_1 = require("./sms.service");
class NotificationService {
    /**
     * Sends a notification to a specific user.
     */
    static async notifyUser(userId, options) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });
        if (!user)
            return;
        const results = [];
        for (const channel of options.channels) {
            let status = "FAILED";
            let providerRef = null;
            try {
                if (channel === client_1.NotificationChannel.SMS && user.phoneNumber) {
                    const smsRes = await sms_service_1.SmsService.sendSms(user.phoneNumber, options.content);
                    status = "SENT";
                }
                // Push & Email placeholders
                results.push({ channel, status, providerRef });
            }
            catch (error) {
                console.error(`Failed to send ${channel} to user ${userId}:`, error);
                results.push({ channel, status: "FAILED", metadata: { error: error.message } });
            }
            // Log the notification
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId,
                    channel,
                    recipient: user.phoneNumber, // Fallback to phone for now
                    title: options.title,
                    content: options.content,
                    status,
                    providerRef,
                    metadata: options.metadata
                }
            });
        }
        return results;
    }
    /**
     * Sends a notification to an organizer.
     */
    static async notifyOrganizer(organizerId, options) {
        const organizer = await prisma_1.prisma.organizerProfile.findUnique({
            where: { id: organizerId }
        });
        if (!organizer)
            return;
        for (const channel of options.channels) {
            let status = "SENT"; // Mock success
            if (channel === client_1.NotificationChannel.SMS && organizer.contactPhone) {
                await sms_service_1.SmsService.sendSms(organizer.contactPhone, options.content).catch(() => status = "FAILED");
            }
            await prisma_1.prisma.notificationLog.create({
                data: {
                    organizerId,
                    channel,
                    recipient: organizer.contactPhone,
                    title: options.title,
                    content: options.content,
                    status,
                    metadata: options.metadata
                }
            });
        }
    }
    /**
     * Internal system alerts for Admins.
     */
    static async alertAdmin(message, priority) {
        console.log(`[ADMIN ALERT] [${priority}] ${message}`);
        // Log to database as a system notification
        await prisma_1.prisma.notificationLog.create({
            data: {
                channel: client_1.NotificationChannel.SMS, // Or system dashboard
                recipient: "SYSTEM",
                title: `Admin Alert: ${priority}`,
                content: message,
                status: "INTERNAL",
                metadata: { priority }
            }
        });
        // If CRITICAL, notify all admins via SMS (Optional/Future)
    }
}
exports.NotificationService = NotificationService;
