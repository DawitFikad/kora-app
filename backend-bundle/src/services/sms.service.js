"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const twilio_1 = require("twilio");
const axios_1 = __importDefault(require("axios"));
class SmsService {
    static getTwilioClient() {
        if (!this.twilioClient) {
            const sid = process.env.TWILIO_ACCOUNT_SID;
            const token = process.env.TWILIO_AUTH_TOKEN;
            if (!sid || !token) {
                throw new Error("Twilio credentials missing in environment variables");
            }
            this.twilioClient = new twilio_1.Twilio(sid, token);
        }
        return this.twilioClient;
    }
    static async sendOtp(phoneNumber, otp) {
        const message = `Your ET-Ticket verification code is: ${otp}. Valid for 5 minutes.`;
        return this.sendSms(phoneNumber, message);
    }
    static async sendSms(phoneNumber, message) {
        // 🔹 BYPASS SMS for Admin/Test Number (0910639875 / +251910639875)
        if (phoneNumber.includes("910639875")) {
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
                const response = await axios_1.default.post("https://api.afromessage.com/api/send", {
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
            }
            catch (error) {
                const errorData = error.response?.data || error.message;
                console.error("[SMS ERROR] AfroMessage failure:", errorData);
                throw new Error("Failed to send SMS via AfroMessage. Please check logs.");
            }
        }
        else if (provider === "twilio") {
            try {
                const client = this.getTwilioClient();
                await client.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phoneNumber,
                });
                console.log(`[SMS] Message sent via Twilio to ${phoneNumber}`);
            }
            catch (error) {
                console.error("[SMS ERROR] Failed to send via Twilio:", error.message);
                throw new Error("Failed to send SMS via Twilio. Please try again later.");
            }
        }
        else {
            // Default: Console logging for development
            console.log("\n-----------------------------------------");
            console.log(`[MOCK SMS] TO: ${phoneNumber}`);
            console.log(`[MOCK SMS] MESSAGE: ${message}`);
            console.log("-----------------------------------------\n");
        }
    }
}
exports.SmsService = SmsService;
SmsService.twilioClient = null;
