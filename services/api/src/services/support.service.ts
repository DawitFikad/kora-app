import { EmailService } from "./email.service";
import { NotificationService } from "./notification.service";

export class SupportService {
    /**
     * Handles a general contact form submission
     */
    static async handleContactSubmission(data: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }) {
        console.log(`[SupportService] New contact request from ${data.email}`);

        // 1. Send notification to internal support team (using EmailService)
        const adminEmail = process.env.SUPPORT_EMAIL || 'support@et-tickets.com';

        await EmailService.sendEmail(
            adminEmail,
            `[Support Request] ${data.subject}`,
            `New contact message from ${data.name} (${data.email}):\n\n${data.message}`,
            EmailService.createSupportNotificationTemplate({
                organizationName: data.name,
                organizerId: 0, // Guest/User
                contactEmail: data.email,
                subject: data.subject,
                message: data.message
            })
        );

        // 2. Send confirmation receipt to the user
        await EmailService.sendEmail(
            data.email,
            `We received your request: ${data.subject}`,
            `Hello ${data.name},\n\nThank you for contacting ET-TICKETS. We have received your message and will get back to you within 24 hours.\n\nYour message:\n${data.message}`,
            EmailService.createConfirmationTemplate({
                organizationName: data.name,
                subject: data.subject,
                message: data.message
            })
        );

        return { success: true, message: "Support request sent successfully." };
    }
}
