import redis from "../utils/redis";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const OTP_TTL = 300; // 5 minutes

export class OtpService {
    private static isMasterOtpEnabled(): boolean {
        const flag = (process.env.ALLOW_MASTER_OTP || "").toLowerCase();
        return flag === "1" || flag === "true" || flag === "yes";
    }

    private static getMasterOtpCode(): string {
        const configured = (process.env.MASTER_OTP_CODE || "").trim();
        return configured || "123456";
    }

    static async generateOtp(phoneNumber: string): Promise<string> {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the OTP before storing logic could be here, but usually for short lived OTPs in Redis, 
        // we might store plain or hashed. The requirements mentioned "OTP Hashing".
        // Let's hash it to be secure.
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Store in Redis: key = "otp:phoneNumber", value = hash
        await redis.setex(`otp:${phoneNumber}`, OTP_TTL, hashedOtp);

        return otp;
    }

    static async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
        // Optional master OTP for emergency/testing only (disabled by default).
        if (this.isMasterOtpEnabled() && otp === this.getMasterOtpCode()) {
            console.log(`[OtpService] Master OTP used for ${phoneNumber}`);
            return true;
        }

        console.log(`[OtpService] Checking Redis for key: otp:${phoneNumber}`);
        const hashedOtp = await redis.get(`otp:${phoneNumber}`);

        if (!hashedOtp) {
            console.warn(`[OtpService] No OTP found in Redis for: ${phoneNumber} (Possibly expired)`);
            return false;
        }

        const isValid = await bcrypt.compare(otp, hashedOtp);
        console.log(`[OtpService] Comparison result for ${phoneNumber}: ${isValid}`);

        if (isValid) {
            // Delete OTP after successful verification to prevent reuse
            await redis.del(`otp:${phoneNumber}`);
        }
        return isValid;
    }
}
