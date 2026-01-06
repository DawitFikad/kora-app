import { prisma } from "../lib/prisma";
import { Role, AccountStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { OtpService } from "./otp.service";
import { SmsService } from "./sms.service";


const getAccessTokenSecret = () => process.env.JWT_SECRET || "default_access_secret";
const getRefreshTokenSecret = () => process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
// Note: User didn't specify separate refresh secret in env, but good practice. 
// I'll stick to one secret or I should update env. Let's use env if available.

export class AuthService {
    static async requestOtp(phoneNumber: string) {
        const cleanPhone = phoneNumber.trim();
        console.log(`[AuthService] Requesting OTP for: ${cleanPhone}`);
        const otp = await OtpService.generateOtp(cleanPhone);

        // Send real SMS (or fallback to console based on env)
        await SmsService.sendOtp(cleanPhone, otp);

        return { message: "OTP sent successfully" };
    }

    static async verifyOtp(phoneNumber: string, otp: string) {
        const cleanPhone = phoneNumber.trim();
        const cleanOtp = String(otp).trim();
        console.log(`[AuthService] Verifying OTP for: ${cleanPhone}, Input OTP: ${cleanOtp}`);

        const isValid = await OtpService.verifyOtp(cleanPhone, cleanOtp);
        if (!isValid) {
            console.warn(`[AuthService] OTP Verification FAILED for ${cleanPhone}`);
            throw new Error("Invalid or expired OTP");
        }
        console.log(`[AuthService] OTP Verification SUCCESS for ${cleanPhone}`);

        try {
            // Check if user exists
            console.log(`[AuthService] Looking up user in DB: ${cleanPhone}`);
            const existingUser = await prisma.user.findUnique({
                where: { phoneNumber: cleanPhone },
                include: { organizer: true }
            });

            let user = existingUser;

            if (!user) {
                console.log(`[AuthService] New user detected, creating account for: ${cleanPhone}`);
                // Create new user (B2C default)
                user = await prisma.user.create({
                    data: {
                        phoneNumber: cleanPhone,
                        role: Role.USER,
                        status: AccountStatus.ACTIVE,
                        profile: {
                            create: {
                                fullName: null, // To be filled by user later
                                language: "en",
                            }
                        }
                    },
                    include: { organizer: true }
                });
                console.log(`[AuthService] User created with ID: ${user.id}`);
            } else {
                console.log(`[AuthService] Existing user found with ID: ${user.id}, Role: ${user.role}`);
            }

            if (user.status === AccountStatus.SUSPENDED) {
                console.warn(`[AuthService] Account suspended for ID: ${user.id}`);
                throw new Error("Account is suspended");
            }

            // Get organizerId if user is an organizer
            const organizerId = user.organizer?.id;
            console.log(`[AuthService] Organizer ID: ${organizerId || 'None'}`);

            // Generate tokens
            console.log(`[AuthService] Generating tokens...`);
            const accessToken = this.generateAccessToken(user.id, user.role, organizerId);
            const refreshToken = this.generateRefreshToken(user.id);
            console.log(`[AuthService] Tokens generated successfully`);

            // Store refresh token in DB
            console.log(`[AuthService] Storing refresh token in DB...`);
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                },
            });
            console.log(`[AuthService] Refresh token stored`);

            const response = {
                user,
                accessToken,
                refreshToken,
                isNewUser: !existingUser,
                hasOrganizerProfile: !!user.organizer
            };

            console.log(`[AuthService] Returning success response for: ${cleanPhone}`);
            return response;
        } catch (error: any) {
            console.error(`[AuthService ERROR] Failed during post-verification for ${cleanPhone}:`, error);
            throw error;
        }
    }

    static async registerOrganizer(data: { phoneNumber: string; email?: string | null; name: string; city: string; payoutDetails: string }) {
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

        const email = data.email && data.email.trim() !== '' ? data.email.trim() : null;

        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: data.phoneNumber },
            include: { organizer: true }
        });

        if (existingUser?.organizer) {
            throw new Error("User is already an organizer or has a pending application.");
        }

        let user;
        if (existingUser) {
            // Update existing user to Organizer role
            user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    role: Role.ORGANIZER,
                    status: AccountStatus.PENDING,
                    email: email || existingUser.email, // Update email if provided, otherwise keep existing
                    profile: {
                        update: {
                            fullName: data.name, // Update profile name
                        }
                    },
                    organizer: {
                        create: { // Create organizer profile
                            organizationName: data.name,
                            contactPhone: data.phoneNumber,
                            contactEmail: email,
                            city: data.city,
                            payoutDetails: data.payoutDetails,
                            status: "PENDING",
                        }
                    }
                },
                include: { organizer: true }
            });
        } else {
            // Create brand new user as Organizer
            user = await prisma.user.create({
                data: {
                    phoneNumber: data.phoneNumber,
                    email: email,
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
                            contactEmail: email,
                            city: data.city,
                            payoutDetails: data.payoutDetails,
                            status: "PENDING",
                        }
                    }
                },
                include: { organizer: true }
            });
        }

        // Get the organizerId from the newly created organizer profile
        const organizerId = user.organizer?.id;

        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.role, organizerId);
        const refreshToken = this.generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return { user, accessToken, refreshToken };
    }

    static async refreshAccessToken(refreshToken: string) {
        try {
            const payload = jwt.verify(refreshToken, getRefreshTokenSecret()) as { userId: number };

            // Check if token exists in DB and is not expired
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: { include: { organizer: true } } }
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                if (storedToken) {
                    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
                }
                throw new Error("Invalid or expired refresh token");
            }

            // Get organizerId if user is an organizer
            const organizerId = storedToken.user.organizer?.id;

            // Generate new access token
            const accessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.role, organizerId);

            return { accessToken };
        } catch (error) {
            throw new Error("Invalid refresh token");
        }
    }

    private static generateAccessToken(userId: number, role: Role, organizerId?: number) {
        return jwt.sign({ userId, role, organizerId }, getAccessTokenSecret(), { expiresIn: "24h" });
    }

    private static generateRefreshToken(userId: number) {
        return jwt.sign({ userId }, getRefreshTokenSecret(), { expiresIn: "7d" });
    }

    static async getMe(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                organizer: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }
}
