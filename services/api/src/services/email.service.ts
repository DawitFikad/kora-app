import nodemailer, { Transporter } from 'nodemailer';

export class EmailService {
    private static transporter: Transporter | null = null;
    private static initialized = false;

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
