import 'dotenv/config';
import { AuthService } from "../src/services/auth.service";
import redis from "../src/utils/redis";
import { prisma } from "../src/lib/prisma";
import { Role, AccountStatus, OrganizerStatus } from "@prisma/client";

async function main() {
    console.log("Starting Auth Verification...");

    const phoneNumber = "+1234567890";

    // 1. Request OTP
    console.log("\n1. Requesting OTP...");
    try {
        await AuthService.requestOtp(phoneNumber);
    } catch (e: any) {
        console.log("Note: requestOtp failed (likely due to SMS provider):", e.message);
    }

    // Retrieve OTP from Redis to simulate user receiving it
    const hashedOtp = await redis.get(`otp:${phoneNumber}`);
    console.log(`Debug: Hashed OTP in Redis: ${hashedOtp ? "Found" : "Not Found"}`);

    // Note: We can't easily get the plain OTP unless we mock the generator or return it in dev mode.
    // For this script, let's manually inject a known OTP into Redis for testing verify.
    const testOtp = "123456";
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testOtp, salt);
    await redis.set(`otp:${phoneNumber}`, hash, "EX", 300);
    console.log(`Debug: Injected test OTP ${testOtp} into Redis`);

    // 2. Verify OTP (New User)
    console.log("\n2. Verifying OTP (New User)...");
    try {
        const result = await AuthService.verifyOtp(phoneNumber, testOtp);
        console.log("Success! Token received:", !!result.accessToken);
        console.log("User Role:", result.user.role);
    } catch (error: any) {
        console.error("Verification Failed:", error.message);
    }

    // 3. Register Organizer
    console.log("\n3. Registering Organizer...");
    const orgPhone = "+9876543210";
    try {
        // Cleanup first
        await prisma.user.deleteMany({ where: { phoneNumber: orgPhone } });

        const result = await AuthService.registerOrganizer({
            phoneNumber: orgPhone,
            email: "org@test.com",
            name: "Test Organizer"
        });
        console.log(result.message);

        // Validate in DB
        const org = await prisma.user.findUnique({ where: { phoneNumber: orgPhone } });
        console.log("Organizer Status:", org?.status);
    } catch (error: any) {
        console.error("Organizer Registration Failed:", error.message);
    }

    console.log("\nDone.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
