import { prisma } from "../lib/prisma";
import { NotificationChannel } from "@prisma/client";
import { SmsService } from "./sms.service";

export class NotificationService {
    /**
     * Sends a notification to a specific user.
     */
    static async notifyUser(userId: number, options: {
        title?: string;
        content: string;
        channels: NotificationChannel[];
        metadata?: any;
    }) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) return;

        const results = [];
        for (const channel of options.channels) {
            let status = "FAILED";
            let providerRef = null;

            try {
                if (channel === NotificationChannel.SMS && user.phoneNumber) {
                    const smsRes = await SmsService.sendSms(user.phoneNumber, options.content);
                    status = "SENT";
                }
                // Push & Email placeholders
                results.push({ channel, status, providerRef });
            } catch (error) {
                console.error(`Failed to send ${channel} to user ${userId}:`, error);
                results.push({ channel, status: "FAILED", metadata: { error: (error as any).message } });
            }

            // Log the notification
            await prisma.notificationLog.create({
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
    static async notifyOrganizer(organizerId: number, options: {
        title?: string;
        content: string;
        channels: NotificationChannel[];
        metadata?: any;
    }) {
        const organizer = await prisma.organizerProfile.findUnique({
            where: { id: organizerId }
        });

        if (!organizer) return;

        for (const channel of options.channels) {
            let status = "SENT"; // Mock success

            if (channel === NotificationChannel.SMS && organizer.contactPhone) {
                await SmsService.sendSms(organizer.contactPhone, options.content).catch(() => status = "FAILED");
            }

            await prisma.notificationLog.create({
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
    static async alertAdmin(message: string, priority: "LOW" | "HIGH" | "CRITICAL") {
        console.log(`[ADMIN ALERT] [${priority}] ${message}`);

        // Log to database as a system notification
        await prisma.notificationLog.create({
            data: {
                channel: NotificationChannel.SMS, // Or system dashboard
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
