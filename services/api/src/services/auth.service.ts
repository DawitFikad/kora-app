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
    private static normalizeEthiopianPhone(input: string) {
        const trimmed = (input || '').trim();
        if (!trimmed) return '';
        const hasPlus = trimmed.startsWith('+');
        const digits = trimmed.replace(/\D/g, '');

        if (hasPlus && digits.startsWith('251')) {
            return `+${digits}`;
        }

        if (digits.startsWith('251')) {
            return `+${digits}`;
        }

        if (digits.startsWith('0') && digits.length === 10) {
            return `+251${digits.slice(1)}`;
        }

        if (digits.startsWith('9') && digits.length === 9) {
            return `+251${digits}`;
        }

        return trimmed;
    }

    private static getPhoneVariants(normalized: string) {
        if (!normalized.startsWith('+251')) return [normalized];
        const local = normalized.replace('+251', '');
        const withZero = `0${local}`;
        return [normalized, withZero, local];
    }

    static async requestOtp(phoneNumber: string) {
        const cleanPhone = this.normalizeEthiopianPhone(phoneNumber);
        console.log(`[AuthService] Requesting OTP for: ${cleanPhone}`);

        // 🔹 BYPASS EVERYTHING for Admin & Test Numbers (No Redis, No SMS)
        // This avoids the connection error since Vercel doesn't have local Redis
        const testNumbers = ["910639875", "911111111", "922222222"];
        if (testNumbers.some(num => cleanPhone.includes(num))) {
            console.log(`[AuthService] Test/Admin number detected (${cleanPhone}). Skipping OTP generation/Redis.`);
            return { message: "OTP sent successfully" };
        }

        const otp = await OtpService.generateOtp(cleanPhone);

        // Send real SMS (or fallback to console based on env)
        await SmsService.sendOtp(cleanPhone, otp);

        return { message: "OTP sent successfully" };
    }

    static async verifyOtp(phoneNumber: string, otp: string) {
        const cleanPhone = this.normalizeEthiopianPhone(phoneNumber);
        const cleanOtp = String(otp).trim();
        console.log(`[AuthService] Verifying OTP for: ${cleanPhone}, Input OTP: ${cleanOtp}`);
        const adminNumbers = ["910639875", "922222222"];

        const isValid = await OtpService.verifyOtp(cleanPhone, cleanOtp);
        if (!isValid) {
            console.warn(`[AuthService] OTP Verification FAILED for ${cleanPhone}`);
            throw new Error("Invalid or expired OTP");
        }
        console.log(`[AuthService] OTP Verification SUCCESS for ${cleanPhone}`);

        try {
            // Check if user exists
            console.log(`[AuthService] Looking up user in DB: ${cleanPhone}`);
            const phoneVariants = this.getPhoneVariants(cleanPhone);
            const existingUser = await prisma.user.findFirst({
                where: { phoneNumber: { in: phoneVariants } },
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
                if (user.phoneNumber !== cleanPhone) {
                    const normalizedExists = await prisma.user.findUnique({ where: { phoneNumber: cleanPhone } });
                    if (!normalizedExists) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { phoneNumber: cleanPhone },
                            include: { organizer: true }
                        });
                    }
                }
            }

            if (user.status === AccountStatus.SUSPENDED) {
                console.warn(`[AuthService] Account suspended for ID: ${user.id}`);
                throw new Error("Account is suspended");
            }

            const isAdminPhone = adminNumbers.some((n) => cleanPhone.includes(n));
            if (isAdminPhone && user.role !== Role.ADMIN) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { role: Role.ADMIN, status: AccountStatus.ACTIVE },
                    include: { organizer: true },
                });
                console.log(`[AuthService] Elevated ${cleanPhone} to ADMIN role for development.`);
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

    static async registerOrganizer(data: {
        phoneNumber: string;
        email?: string | null;
        name: string;
        city: string;
        payoutDetails: string;
        organizerType?: string;
        shortDescription?: string;
        categories?: string;
        operatingCities?: string;
        files?: Express.Multer.File[];
    }) {
        const { getFileUrl } = await import("../config/upload.config");
        const normalizedPhone = this.normalizeEthiopianPhone(data.phoneNumber);
        console.log(`[AuthService] Starting organizer registration for phone: ${normalizedPhone || data.phoneNumber}`);

        const email = data.email && data.email.trim() !== '' ? data.email.trim() : null;

        // Process files
        const businessLicenseFile = data.files?.find(f => f.fieldname === 'businessLicense');
        const eventPosterFile = data.files?.find(f => f.fieldname === 'eventPoster');

        const businessLicenseUrl = businessLicenseFile ? getFileUrl(businessLicenseFile) : null;
        const eventPosterUrl = eventPosterFile ? getFileUrl(eventPosterFile) : null;

        const phoneVariants = this.getPhoneVariants(normalizedPhone || data.phoneNumber);
        const existingUser = await prisma.user.findFirst({
            where: { phoneNumber: { in: phoneVariants } },
            include: { organizer: true }
        });

        // Check for email uniqueness if email is provided
        if (email) {
            const userWithEmail = await prisma.user.findUnique({
                where: { email }
            });
            if (userWithEmail && userWithEmail.id !== existingUser?.id) {
                throw new Error(`The email ${email} is already associated with another account.`);
            }
        }

        if (existingUser?.organizer) {
            console.log(`[AuthService] User ${existingUser.id} already has organizer profile`);
            throw new Error("User is already an organizer or has a pending application.");
        }

        let user;
        if (existingUser) {
            console.log(`[AuthService] Upgrading existing user ${existingUser.id} to organizer`);
            // Update existing user to Organizer role
            try {
                let safePhoneNumber = normalizedPhone || data.phoneNumber;
                if (normalizedPhone && existingUser.phoneNumber !== normalizedPhone) {
                    const normalizedExists = await prisma.user.findUnique({ where: { phoneNumber: normalizedPhone } });
                    if (normalizedExists && normalizedExists.id !== existingUser.id) {
                        safePhoneNumber = existingUser.phoneNumber;
                    }
                }
                user = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        phoneNumber: safePhoneNumber,
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
                                description: data.shortDescription,
                                contactPhone: normalizedPhone || data.phoneNumber,
                                contactEmail: email,
                                city: data.city,
                                payoutDetails: data.payoutDetails,
                                status: "PENDING",
                                businessLicense: businessLicenseUrl,
                                eventPoster: eventPosterUrl,
                                categoryFocus: data.categories ? data.categories.split(',').map(c => c.trim()) : [],
                                operatingCities: data.operatingCities ? data.operatingCities.split(',').map(c => c.trim()) : [data.city],
                            }
                        }
                    },
                    include: { organizer: true }
                });
                console.log(`[AuthService] Successfully upgraded user to organizer`);
            } catch (updateError: any) {
                console.error(`[AuthService] Error upgrading user to organizer:`, updateError);
                throw new Error(`Failed to upgrade user: ${updateError.message}`);
            }
        } else {
            console.log(`[AuthService] Creating new organizer user`);
            // Create brand new user as Organizer
            try {
                user = await prisma.user.create({
                    data: {
                        phoneNumber: normalizedPhone || data.phoneNumber,
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
                                description: data.shortDescription,
                                contactPhone: normalizedPhone || data.phoneNumber,
                                contactEmail: email,
                                city: data.city,
                                payoutDetails: data.payoutDetails,
                                status: "PENDING",
                                businessLicense: businessLicenseUrl,
                                eventPoster: eventPosterUrl,
                                categoryFocus: data.categories ? data.categories.split(',').map(c => c.trim()) : [],
                                operatingCities: data.operatingCities ? data.operatingCities.split(',').map(c => c.trim()) : [data.city],
                            }
                        }
                    },
                    include: { organizer: true }
                });
                console.log(`[AuthService] Successfully created new organizer user`);
            } catch (createError: any) {
                console.error(`[AuthService] Error creating new organizer:`, createError);
                throw new Error(`Failed to create organizer: ${createError.message}`);
            }
        }

        // Get the organizerId from the newly created organizer profile
        const organizerId = (user as any).organizer?.id;
        console.log(`[AuthService] Organizer ID: ${organizerId}`);

        // Generate tokens
        console.log(`[AuthService] Generating tokens for organizer`);
        const accessToken = this.generateAccessToken(user.id, user.role, organizerId);
        const refreshToken = this.generateRefreshToken(user.id);

        // Store refresh token - delete any existing ones first to avoid unique constraint
        try {
            // Delete any existing refresh tokens for this user
            await prisma.refreshToken.deleteMany({
                where: { userId: user.id }
            });

            // Create new refresh token
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            console.log(`[AuthService] Refresh token stored successfully`);
        } catch (tokenError: any) {
            console.error(`[AuthService] Error storing refresh token:`, tokenError);
            throw new Error(`Failed to store refresh token: ${tokenError.message}`);
        }

        console.log(`[AuthService] Organizer registration completed successfully`);
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
        return jwt.sign({ userId, id: userId, role, organizerId }, getAccessTokenSecret(), { expiresIn: "24h" });
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
