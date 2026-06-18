import { Twilio } from "twilio";
import axios from "axios";

export class SmsService {
    private static twilioClient: Twilio | null = null;

    private static allowTestNumberBypass() {
        const flag = (process.env.ALLOW_TEST_OTP_BYPASS || "").toLowerCase();
        if (flag === "1" || flag === "true" || flag === "yes") return true;
        const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
        const hasAfro = !!(process.env.AFROMESSAGE_TOKEN);
        if (!hasTwilio && !hasAfro) return true;
        return false;
    }

    private static shouldExposeOtpForTesting() {
        const explicit = (process.env.EXPOSE_OTP_IN_DOCKER || process.env.EXPOSE_OTP_IN_LOGS || "").toLowerCase();
        if (explicit === "1" || explicit === "true" || explicit === "yes") return true;
        return process.env.NODE_ENV !== "production";
    }

    private static getTwilioClient() {
        if (!this.twilioClient) {
            const sid = process.env.TWILIO_ACCOUNT_SID;
            const token = process.env.TWILIO_AUTH_TOKEN;
            if (!sid || !token) {
                console.warn("[SMS] Twilio credentials missing — falling back to console log");
                return null;
            }
            this.twilioClient = new Twilio(sid, token);
        }
        return this.twilioClient;
    }

    static async sendOtp(phoneNumber: string, otp: string) {
        const message = `Your ET-Ticket verification code is: ${otp}. Valid for 5 minutes.`;

        if (this.shouldExposeOtpForTesting()) {
            console.log("\n=========================================");
            console.log(`[OTP TEST] PHONE: ${phoneNumber}`);
            console.log(`[OTP TEST] CODE : ${otp}`);
            console.log("=========================================\n");
        }

        return this.sendSms(phoneNumber, message);
    }

    static async sendSms(phoneNumber: string, message: string) {
        // Optional bypass for specific test numbers (disabled by default).
        if (this.allowTestNumberBypass() && phoneNumber.includes("910639875")) {
            console.log(`[SMS BYPASS] Admin login detected for ${phoneNumber}. Skipping real SMS.`);
            return;
        }

        const provider = process.env.SMS_PROVIDER || "console";

        if (provider === "afromessage") {
            try {
                const token = process.env.AFROMESSAGE_TOKEN;
                const identifierId = process.env.AFROMESSAGE_IDENTIFIER_ID;
                const senderName = process.env.AFROMESSAGE_SENDER_NAME || "ET-Ticket";

                if (!token || !identifierId) {
                    throw new Error("AfroMessage credentials missing in environment variables");
                }

                // AfroMessage sometimes prefers number without '+'
                const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

                const response = await axios.post("https://api.afromessage.com/api/send", {
                    from: identifierId,
                    sender: senderName,
                    to: cleanPhone,
                    message: message
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log(`[SMS] AfroMessage Response:`, response.data);

                if (response.data.acknowledge !== "success") {
                    const errorMsg = response.data.response?.errors?.[0] || 'Unknown error';
                    throw new Error(`AfroMessage failed: ${errorMsg}`);
                }

                console.log(`[SMS] Message successfully queued via AfroMessage to ${phoneNumber}`);
            } catch (error: any) {
                const errorData = error.response?.data || error.message;
                console.error("[SMS ERROR] AfroMessage failure:", errorData);
                throw new Error("Failed to send SMS via AfroMessage. Please check logs.");
            }
        } else if (provider === "twilio") {
            const client = this.getTwilioClient();
            if (!client) {
                console.log("\n-----------------------------------------");
                console.log(`[MOCK SMS] TO: ${phoneNumber}`);
                console.log(`[MOCK SMS] MESSAGE: ${message}`);
                console.log("-----------------------------------------\n");
            } else {
                try {
                    await client.messages.create({
                        body: message,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: phoneNumber,
                    });
                    console.log(`[SMS] Message sent via Twilio to ${phoneNumber}`);
                } catch (error: any) {
                    console.error("[SMS ERROR] Failed to send via Twilio:", error.message);
                    throw new Error("Failed to send SMS via Twilio. Please try again later.");
                }
            }
        } else {
            // Default: Console logging for development
            console.log("\n-----------------------------------------");
            console.log(`[MOCK SMS] TO: ${phoneNumber}`);
            console.log(`[MOCK SMS] MESSAGE: ${message}`);
            console.log("-----------------------------------------\n");
        }
    }
}
