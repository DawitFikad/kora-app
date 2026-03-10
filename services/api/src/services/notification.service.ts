import { prisma } from "../lib/prisma";
import { NotificationChannel } from "@prisma/client";
import { SmsService } from "./sms.service";
import { EmailService } from "./email.service";

export const NotificationTypes = {
    TICKET_CONFIRMATION: "TICKET_CONFIRMATION",
    EVENT_REMINDER: "EVENT_REMINDER",
    EVENT_UPDATE: "EVENT_UPDATE",
    NEW_EVENT: "NEW_EVENT",
    EVENT_CANCELLED: "EVENT_CANCELLED",
    EVENT_RATED_THANKS: "EVENT_RATED_THANKS",
    PERSONALIZED_EVENT: "PERSONALIZED_EVENT",
    EMAIL_REQUEST: "EMAIL_REQUEST",
    STAFF_INVITATION: "STAFF_INVITATION",
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

const CRITICAL_TYPES = new Set<NotificationType>([
    NotificationTypes.TICKET_CONFIRMATION,
    NotificationTypes.EVENT_CANCELLED,
    NotificationTypes.STAFF_INVITATION,
]);

const DEFAULT_THROTTLE_MINUTES: Partial<Record<NotificationType, number>> = {
    [NotificationTypes.NEW_EVENT]: 24 * 60,
    [NotificationTypes.PERSONALIZED_EVENT]: 7 * 24 * 60,
    [NotificationTypes.EMAIL_REQUEST]: 7 * 24 * 60,
};

export class NotificationService {
    private static getOrganizerPreferenceKey(type?: string): 'approval' | 'sales' | 'inventory' | 'refunds' | 'payouts' | null {
        const normalized = String(type || '').toUpperCase();

        if (['EVENT_STATUS', 'EVENT_APPROVED', 'EVENT_REJECTED'].includes(normalized)) return 'approval';
        if (['MILESTONE', 'SALES_MILESTONE', 'SOLD_OUT'].includes(normalized)) return 'sales';
        if (['INVENTORY_LOW', 'LOW_INVENTORY'].includes(normalized)) return 'inventory';
        if (['REFUND_REQUEST', 'REFUND_APPROVED', 'REFUND_REJECTED'].includes(normalized)) return 'refunds';
        if (['PAYOUT_SUCCESS', 'PAYOUT_FAILED', 'PAYOUT_UPDATE'].includes(normalized)) return 'payouts';

        return null;
    }

    private static applyOrganizerChannelPrefs(
        channels: NotificationChannel[],
        notificationPrefs: any,
        metadata?: any
    ): NotificationChannel[] {
        const prefKey = this.getOrganizerPreferenceKey(metadata?.type);
        if (!prefKey) return channels;

        const channelPrefs = notificationPrefs?.[prefKey];
        if (!channelPrefs || typeof channelPrefs !== 'object') return channels;

        return channels.filter((channel) => {
            if (channel === NotificationChannel.SMS) return !!channelPrefs.sms;
            if (channel === NotificationChannel.EMAIL) return !!channelPrefs.email;
            return true;
        });
    }

    private static async shouldThrottleInApp(options: {
        userId: number;
        title?: string;
        type?: NotificationType;
        dedupeMinutes?: number;
    }) {
        const { userId, title, type } = options;
        const dedupeMinutes =
            options.dedupeMinutes ?? (type ? DEFAULT_THROTTLE_MINUTES[type] : undefined);

        if (!dedupeMinutes || !type) return false;
        if (CRITICAL_TYPES.has(type)) return false;

        const createdAfter = new Date(Date.now() - dedupeMinutes * 60 * 1000);
        const recent = await prisma.notificationLog.findFirst({
            where: {
                userId,
                channel: NotificationChannel.PUSH,
                recipient: "APP",
                title,
                createdAt: { gte: createdAfter },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });

        return !!recent;
    }

    private static async maybePromptEmail(userId: number) {
        const throttle = await this.shouldThrottleInApp({
            userId,
            title: "Add your email for backup updates",
            type: NotificationTypes.EMAIL_REQUEST,
            dedupeMinutes: 7 * 24 * 60,
        });

        if (throttle) return;

        await (prisma as any).notificationLog.create({
            data: {
                userId,
                type: NotificationTypes.EMAIL_REQUEST,
                referenceId: "profile",
                channel: NotificationChannel.PUSH,
                recipient: "APP",
                title: "Add your email for backup updates",
                message:
                    "Add an email in your profile to receive ticket confirmations, receipts, and backup event updates.",
                content:
                    "Add an email in your profile to receive ticket confirmations, receipts, and backup event updates.",
                status: "DELIVERED",
                metadata: {
                    type: NotificationTypes.EMAIL_REQUEST,
                    referenceId: "profile",
                },
            },
        });
    }

    /**
     * Sends a notification to a specific user.
     */
    static async notifyUser(userId: number, options: {
        title?: string;
        content: string;
        channels: NotificationChannel[];
        type?: NotificationType;
        referenceId?: string | number;
        inApp?: boolean;
        dedupeMinutes?: number;
        metadata?: any;
    }) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) return;

        const throttled = await this.shouldThrottleInApp({
            userId,
            title: options.title,
            type: options.type,
            dedupeMinutes: options.dedupeMinutes,
        });
        if (throttled) {
            return [{ channel: NotificationChannel.PUSH, status: "SKIPPED", providerRef: null }];
        }

        const metadataPayload = {
            ...(options.metadata || {}),
            type: options.type,
            referenceId: options.referenceId?.toString(),
        };

        const wantsInApp = options.inApp ?? true;

        const results = [];
        for (const channel of options.channels) {
            let status = "FAILED";
            let providerRef = null;
            let recipient = user.phoneNumber;

            try {
                if (channel === NotificationChannel.SMS && user.phoneNumber) {
                    await SmsService.sendSms(user.phoneNumber, options.content);
                    status = "SENT";
                    recipient = user.phoneNumber;
                } else if (channel === NotificationChannel.EMAIL) {
                    if (user.email) {
                        await EmailService.sendEmail(
                            user.email,
                            options.title || "ET-Ticket Update",
                            options.content
                        );
                        status = "SENT";
                        recipient = user.email;
                    } else {
                        status = "SKIPPED";
                        await this.maybePromptEmail(userId);
                    }
                } else if (channel === NotificationChannel.PUSH) {
                    // Push provider integration can be plugged in later; keep in-app delivery log now.
                    status = "SENT";
                    recipient = "APP";
                }
                results.push({ channel, status, providerRef });
            } catch (error) {
                console.error(`Failed to send ${channel} to user ${userId}:`, error);
                results.push({ channel, status: "FAILED", metadata: { error: (error as any).message } });
            }

            // Log the notification
            await (prisma as any).notificationLog.create({
                data: {
                    userId,
                    type: options.type,
                    referenceId: options.referenceId?.toString(),
                    channel,
                    recipient,
                    title: options.title,
                    message: options.content,
                    content: options.content,
                    status,
                    providerRef,
                    metadata: metadataPayload
                }
            });
        }

        // Ensure in-app notification exists even when PUSH channel is not requested.
        if (wantsInApp && !options.channels.includes(NotificationChannel.PUSH)) {
            await (prisma as any).notificationLog.create({
                data: {
                    userId,
                    type: options.type,
                    referenceId: options.referenceId?.toString(),
                    channel: NotificationChannel.PUSH,
                    recipient: "APP",
                    title: options.title,
                    message: options.content,
                    content: options.content,
                    status: "DELIVERED",
                    metadata: metadataPayload,
                },
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
            where: { id: organizerId },
            include: { user: { select: { email: true, phoneNumber: true } } }
        });

        if (!organizer) return;

        const effectiveChannels = this.applyOrganizerChannelPrefs(
            options.channels,
            organizer.notificationPrefs,
            options.metadata
        );

        for (const channel of effectiveChannels) {
            let status = "FAILED";
            let recipient = organizer.contactPhone || organizer.user?.phoneNumber || "UNKNOWN";
            let providerRef: string | null = null;
            let errorMessage: string | null = null;

            try {
                if (channel === NotificationChannel.SMS) {
                    const phone = organizer.contactPhone || organizer.user?.phoneNumber;
                    if (phone) {
                        await SmsService.sendSms(phone, options.content);
                        status = "SENT";
                        recipient = phone;
                    } else {
                        status = "SKIPPED";
                        recipient = "NO_PHONE";
                    }
                } else if (channel === NotificationChannel.EMAIL) {
                    const email = organizer.contactEmail || organizer.user?.email;
                    if (email) {
                        await EmailService.sendEmail(
                            email,
                            options.title || "ET-Ticket Organizer Update",
                            options.content
                        );
                        status = "SENT";
                        recipient = email;
                    } else {
                        status = "SKIPPED";
                        recipient = "NO_EMAIL";
                    }
                } else if (channel === NotificationChannel.PUSH) {
                    // In-app log-backed delivery; push provider can be integrated later.
                    status = "DELIVERED";
                    recipient = "APP";
                } else {
                    status = "SKIPPED";
                }
            } catch (error: any) {
                status = "FAILED";
                errorMessage = error?.message || "Unknown delivery error";
            }

            await prisma.notificationLog.create({
                data: {
                    organizerId,
                    type: (options.metadata?.type as any) || undefined,
                    channel,
                    recipient,
                    title: options.title,
                    message: options.content,
                    content: options.content,
                    status,
                    providerRef,
                    metadata: {
                        ...(options.metadata || {}),
                        deliveryError: errorMessage,
                    }
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
