import nodemailer, { Transporter } from 'nodemailer';

export class EmailService {
    private static transporter: Transporter | null = null;
    private static initialized = false;

    /**
     * Creates a professional HTML email template
     */
    private static createEmailTemplate(options: {
        title: string;
        content: string;
        footerText?: string;
        isConfirmation?: boolean;
    }): string {
        const { title, content, footerText, isConfirmation } = options;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1D90F5 0%, #0d6efd 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                ${isConfirmation ? '✓' : '📧'} ${title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                                ${content}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                                ${footerText || 'ET-Ticket Support Team'}
                            </p>
                            <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                                © ${new Date().getFullYear()} ET-Ticket. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }

    /**
     * Creates HTML for support notification email (to support team)
     */
    static createSupportNotificationTemplate(data: {
        organizationName: string;
        organizerId: number;
        contactEmail?: string;
        contactPhone?: string;
        subject: string;
        message: string;
    }): string {
        const content = `
            <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #1D90F5; font-size: 22px; font-weight: 600;">
                    New Support Request
                </h2>
                <p style="margin: 0 0 15px 0; color: #495057;">
                    You have received a new support request from an organizer.
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #1D90F5; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6c757d; font-weight: 600; width: 140px;">Organization:</td>
                        <td style="padding: 8px 0; color: #212529;">${data.organizationName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Organizer ID:</td>
                        <td style="padding: 8px 0; color: #212529;">#${data.organizerId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Contact Email:</td>
                        <td style="padding: 8px 0; color: #212529;">${data.contactEmail || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Contact Phone:</td>
                        <td style="padding: 8px 0; color: #212529;">${data.contactPhone || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Subject:</td>
                        <td style="padding: 8px 0; color: #212529; font-weight: 600;">${data.subject}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 18px; font-weight: 600;">
                    Message:
                </h3>
                <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; color: #212529; white-space: pre-wrap; line-height: 1.6;">
${data.message}
                </div>
            </div>
        `;

        return this.createEmailTemplate({
            title: 'Support Request',
            content,
            footerText: 'Please respond to this request within 24 hours.'
        });
    }

    /**
     * Creates HTML for confirmation email (to organizer)
     */
    static createConfirmationTemplate(data: {
        organizationName: string;
        subject: string;
        message: string;
    }): string {
        const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <span style="color: #ffffff; font-size: 40px;">✓</span>
                </div>
                <h2 style="margin: 0 0 10px 0; color: #10B981; font-size: 24px; font-weight: 700;">
                    Request Received!
                </h2>
                <p style="margin: 0; color: #6c757d; font-size: 16px;">
                    We've received your support request and will get back to you soon.
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 15px 0; color: #495057; font-weight: 600;">
                    Dear ${data.organizationName},
                </p>
                <p style="margin: 0 0 15px 0; color: #495057; line-height: 1.6;">
                    Thank you for contacting ET-Ticket support. We have successfully received your request and our team will review it shortly.
                </p>
                <p style="margin: 0 0 20px 0; color: #495057; line-height: 1.6;">
                    We typically respond within <strong style="color: #1D90F5;">24 hours</strong> during business days.
                </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #dee2e6;">
                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px; font-weight: 600;">
                    Your Request Details:
                </h3>
                <div style="background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Subject:</p>
                    <p style="margin: 0 0 20px 0; color: #212529; font-size: 16px;">${data.subject}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Message:</p>
                    <div style="color: #212529; white-space: pre-wrap; line-height: 1.6;">${data.message}</div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, rgba(29, 144, 245, 0.1) 0%, rgba(29, 144, 245, 0.05) 100%); border-radius: 6px; border-left: 4px solid #1D90F5;">
                <p style="margin: 0; color: #495057; line-height: 1.6;">
                    <strong style="color: #1D90F5;">Need urgent assistance?</strong><br>
                    You can also reach us directly if your issue requires immediate attention.
                </p>
            </div>
        `;

        return this.createEmailTemplate({
            title: 'Support Request Confirmation',
            content,
            footerText: 'Thank you for using ET-Ticket!',
            isConfirmation: true
        });
    }

    static createAdminInvitationTemplate(data: {
        fullName: string;
        role: string;
        phoneNumber: string;
        portalUrl: string;
    }): string {
        const content = `
            <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #1D90F5; font-size: 22px; font-weight: 600;">
                    Welcome to the Admin Team
                </h2>
                <p style="margin: 0 0 15px 0; color: #495057;">
                    Hello <strong>${data.fullName}</strong>,
                </p>
                <p style="margin: 0 0 15px 0; color: #495057;">
                    You have been invited to join the <strong>ET-Ticket</strong> administration platform as a <strong>${data.role.toUpperCase()}</strong>.
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #1D90F5; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px; font-weight: 600;">
                    Your Access Credentials:
                </h3>
                <p style="margin: 0 0 8px 0; color: #212529;"><strong>Registered Phone:</strong> ${data.phoneNumber}</p>
                <p style="margin: 0 0 8px 0; color: #212529;"><strong>Assigned Role:</strong> ${data.role}</p>
                <p style="margin: 0; color: #6c757d; font-size: 13px; font-style: italic;">
                    * You can login using your phone number via the OTP verification system.
                </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${data.portalUrl}" style="background-color: #1D90F5; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px rgba(29, 144, 245, 0.2);">
                    Access Admin Portal
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
                If you were not expecting this invitation, please contact the system administrator immediately.
            </p>
        `;

        return this.createEmailTemplate({
            title: 'Admin Platform Invitation',
            content,
            footerText: 'Internal Administrative Communication'
        });
    }

    static initialize() {
        if (this.initialized) return;

        const host = process.env.EMAIL_HOST;
        const port = Number(process.env.EMAIL_PORT);
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (host && port && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // true for 465, false for others
                auth: {
                    user,
                    pass,
                },
            });

            this.initialized = true;
            console.log("✅ Email Service initialized (Nodemailer)");
        } else {
            console.warn("⚠️ Email config missing. Service running in MOCK mode.");
        }
    }

    static async sendEmail(
        to: string,
        subject: string,
        text: string,
        html?: string
    ) {
        if (!this.initialized || !this.transporter) {
            console.log("\n=================================");
            console.log(`📧 [MOCK EMAIL]`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${text}`);
            console.log("=================================\n");
            return;
        }

        try {
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'support@ettickets.com',
                to,
                subject,
                text,
                html: html || text.replace(/\n/g, '<br>'),
            });

            console.log(`📧 Email sent successfully to ${to}`);
            console.log(`   Message ID: ${result.messageId}`);
            return result;
        } catch (error: any) {
            console.error('❌ Email send failed:');
            console.error(`   To: ${to}`);
            console.error(`   Subject: ${subject}`);
            console.error(`   Error: ${error.message}`);
            if (error.response) {
                console.error(`   Response: ${JSON.stringify(error.response)}`);
            }
            // Do not throw → prevents breaking main flow
            return null;
        }
    }
}
