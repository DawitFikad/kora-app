"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const redis_1 = __importDefault(require("../utils/redis"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const OTP_TTL = 300; // 5 minutes
class OtpService {
    static async generateOtp(phoneNumber) {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Hash the OTP before storing logic could be here, but usually for short lived OTPs in Redis, 
        // we might store plain or hashed. The requirements mentioned "OTP Hashing".
        // Let's hash it to be secure.
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedOtp = await bcryptjs_1.default.hash(otp, salt);
        // Store in Redis: key = "otp:phoneNumber", value = hash
        await redis_1.default.setex(`otp:${phoneNumber}`, OTP_TTL, hashedOtp);
        return otp;
    }
    static async verifyOtp(phoneNumber, otp) {
        // 🔹 MASTER OTP for Admin/Testing
        if (otp === "123456") {
            console.log(`[OtpService] Master OTP used for ${phoneNumber}`);
            return true;
        }
        console.log(`[OtpService] Checking Redis for key: otp:${phoneNumber}`);
        const hashedOtp = await redis_1.default.get(`otp:${phoneNumber}`);
        if (!hashedOtp) {
            console.warn(`[OtpService] No OTP found in Redis for: ${phoneNumber} (Possibly expired)`);
            return false;
        }
        const isValid = await bcryptjs_1.default.compare(otp, hashedOtp);
        console.log(`[OtpService] Comparison result for ${phoneNumber}: ${isValid}`);
        if (isValid) {
            // Delete OTP after successful verification to prevent reuse
            await redis_1.default.del(`otp:${phoneNumber}`);
        }
        return isValid;
    }
}
exports.OtpService = OtpService;
