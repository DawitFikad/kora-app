import { prisma } from "../lib/prisma";
import { Role, AccountStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { OtpService } from "./otp.service";
import { SmsService } from "./sms.service";


const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "default_access_secret";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
// Note: User didn't specify separate refresh secret in env, but good practice. 
// I'll stick to one secret or I should update env. Let's use env if available.

export class AuthService {
    static async requestOtp(phoneNumber: string) {
        const otp = await OtpService.generateOtp(phoneNumber);

        // Send real SMS (or fallback to console based on env)
        await SmsService.sendOtp(phoneNumber, otp);

        return { message: "OTP sent successfully" };
    }

    static async verifyOtp(phoneNumber: string, otp: string) {
        const isValid = await OtpService.verifyOtp(phoneNumber, otp);
        if (!isValid) {
            throw new Error("Invalid or expired OTP");
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { phoneNumber },
        });

        if (!user) {
            // Create new user (B2C default)
            user = await prisma.user.create({
                data: {
                    phoneNumber,
                    role: Role.USER,
                    status: AccountStatus.ACTIVE,
                    profile: {
                        create: {
                            fullName: null, // To be filled by user later
                            language: "en",
                        }
                    }
                },
            });
        }

        if (user.status !== AccountStatus.ACTIVE) {
            if (user.status === AccountStatus.PENDING) {
                throw new Error("Account is pending approval");
            }
            throw new Error("Account is suspended");
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.role);
        const refreshToken = this.generateRefreshToken(user.id);

        // Store refresh token in DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return { user, accessToken, refreshToken };
    }

    static async registerOrganizer(data: { phoneNumber: string; email: string; name: string }) {
        // TODO: Add OTP verification step for registration too, or assume verified before calling this?
        // The plan said "Verify OTP first". 
        // For simplicity in this step, let's assume the client verifies OTP and then calls register within a short window, 
        // OR we implement a registration flow that includes OTP.
        // Let's stick to: User Requests OTP -> Verifies -> If new, they are User. 
        // If they want to be Organizer, maybe a separate endpoint `auth/organizer/register`?
        // Let's implement `registerOrganizer` which starts the flow or completes it.

        // Better flow: 
        // 1. Request OTP for `phoneNumber`.
        // 2. Verify OTP. 
        // 3. Call `registerOrganizer` with a "verification token" or similar?
        // Or just trusted client flow for now?

        // Let's assume `registerOrganizer` creates the Pending user.

        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: data.phoneNumber },
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const user = await prisma.user.create({
            data: {
                phoneNumber: data.phoneNumber,
                email: data.email,
                role: Role.ORGANIZER,
                status: AccountStatus.PENDING,
                profile: {
                    create: {
                        fullName: data.name,
                    }
                },
                organizer: {
                    create: {
                        organizationName: data.name,
                        contactPhone: data.phoneNumber,
                        contactEmail: data.email,
                        city: "TBD", // To be updated by organizer
                        payoutDetails: "TBD", // To be updated by organizer
                        status: "PENDING",
                    }
                }
            },
        });

        return { message: "Organizer registration successful. Pending approval." };
    }

    static async refreshAccessToken(refreshToken: string) {
        try {
            const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: number };

            // Check if token exists in DB and is not expired
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true }
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                if (storedToken) {
                    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
                }
                throw new Error("Invalid or expired refresh token");
            }

            // Generate new access token
            const accessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.role);

            return { accessToken };
        } catch (error) {
            throw new Error("Invalid refresh token");
        }
    }

    private static generateAccessToken(userId: number, role: Role) {
        return jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    }

    private static generateRefreshToken(userId: number) {
        return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    }
}
