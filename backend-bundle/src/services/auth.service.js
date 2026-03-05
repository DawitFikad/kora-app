"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otp_service_1 = require("./otp.service");
const sms_service_1 = require("./sms.service");
const getAccessTokenSecret = () => process.env.JWT_SECRET || "default_access_secret";
const getRefreshTokenSecret = () => process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
// Note: User didn't specify separate refresh secret in env, but good practice. 
// I'll stick to one secret or I should update env. Let's use env if available.
class AuthService {
    static normalizeEthiopianPhone(input) {
        const trimmed = (input || '').trim();
        if (!trimmed)
            return '';
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
    static getPhoneVariants(normalized) {
        if (!normalized.startsWith('+251'))
            return [normalized];
        const local = normalized.replace('+251', '');
        const withZero = `0${local}`;
        return [normalized, withZero, local];
    }
    static async requestOtp(phoneNumber) {
        const cleanPhone = this.normalizeEthiopianPhone(phoneNumber);
        console.log(`[AuthService] Requesting OTP for: ${cleanPhone}`);
        // 🔹 BYPASS EVERYTHING for Admin & Test Numbers (No Redis, No SMS)
        // This avoids the connection error since Vercel doesn't have local Redis
        const testNumbers = ["910639875", "911111111", "922222222"];
        if (testNumbers.some(num => cleanPhone.includes(num))) {
            console.log(`[AuthService] Test/Admin number detected (${cleanPhone}). Skipping OTP generation/Redis.`);
            return { message: "OTP sent successfully" };
        }
        const otp = await otp_service_1.OtpService.generateOtp(cleanPhone);
        // Send real SMS (or fallback to console based on env)
        await sms_service_1.SmsService.sendOtp(cleanPhone, otp);
        return { message: "OTP sent successfully" };
    }
    static async verifyOtp(phoneNumber, otp) {
        const cleanPhone = this.normalizeEthiopianPhone(phoneNumber);
        const cleanOtp = String(otp).trim();
        console.log(`[AuthService] Verifying OTP for: ${cleanPhone}, Input OTP: ${cleanOtp}`);
        const isValid = await otp_service_1.OtpService.verifyOtp(cleanPhone, cleanOtp);
        if (!isValid) {
            console.warn(`[AuthService] OTP Verification FAILED for ${cleanPhone}`);
            throw new Error("Invalid or expired OTP");
        }
        console.log(`[AuthService] OTP Verification SUCCESS for ${cleanPhone}`);
        try {
            // Check if user exists
            console.log(`[AuthService] Looking up user in DB: ${cleanPhone}`);
            const phoneVariants = this.getPhoneVariants(cleanPhone);
            const existingUser = await prisma_1.prisma.user.findFirst({
                where: { phoneNumber: { in: phoneVariants } },
                include: { organizer: true }
            });
            let user = existingUser;
            if (!user) {
                console.log(`[AuthService] New user detected, creating account for: ${cleanPhone}`);
                // Create new user (B2C default)
                user = await prisma_1.prisma.user.create({
                    data: {
                        phoneNumber: cleanPhone,
                        role: client_1.Role.USER,
                        status: client_1.AccountStatus.ACTIVE,
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
            }
            else {
                console.log(`[AuthService] Existing user found with ID: ${user.id}, Role: ${user.role}`);
                if (user.phoneNumber !== cleanPhone) {
                    const normalizedExists = await prisma_1.prisma.user.findUnique({ where: { phoneNumber: cleanPhone } });
                    if (!normalizedExists) {
                        user = await prisma_1.prisma.user.update({
                            where: { id: user.id },
                            data: { phoneNumber: cleanPhone },
                            include: { organizer: true }
                        });
                    }
                }
            }
            if (user.status === client_1.AccountStatus.SUSPENDED) {
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
            await prisma_1.prisma.refreshToken.create({
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
        }
        catch (error) {
            console.error(`[AuthService ERROR] Failed during post-verification for ${cleanPhone}:`, error);
            throw error;
        }
    }
    static async registerOrganizer(data) {
        const { getFileUrl } = await Promise.resolve().then(() => __importStar(require("../config/upload.config")));
        const normalizedPhone = this.normalizeEthiopianPhone(data.phoneNumber);
        console.log(`[AuthService] Starting organizer registration for phone: ${normalizedPhone || data.phoneNumber}`);
        const email = data.email && data.email.trim() !== '' ? data.email.trim() : null;
        // Process files
        const businessLicenseFile = data.files?.find(f => f.fieldname === 'businessLicense');
        const eventPosterFile = data.files?.find(f => f.fieldname === 'eventPoster');
        const businessLicenseUrl = businessLicenseFile ? getFileUrl(businessLicenseFile) : null;
        const eventPosterUrl = eventPosterFile ? getFileUrl(eventPosterFile) : null;
        const phoneVariants = this.getPhoneVariants(normalizedPhone || data.phoneNumber);
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: { phoneNumber: { in: phoneVariants } },
            include: { organizer: true }
        });
        // Check for email uniqueness if email is provided
        if (email) {
            const userWithEmail = await prisma_1.prisma.user.findUnique({
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
                    const normalizedExists = await prisma_1.prisma.user.findUnique({ where: { phoneNumber: normalizedPhone } });
                    if (normalizedExists && normalizedExists.id !== existingUser.id) {
                        safePhoneNumber = existingUser.phoneNumber;
                    }
                }
                user = await prisma_1.prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        phoneNumber: safePhoneNumber,
                        role: client_1.Role.ORGANIZER,
                        status: client_1.AccountStatus.PENDING,
                        email: email || existingUser.email, // Update email if provided, otherwise keep existing
                        profile: {
                            update: {
                                fullName: data.name, // Update profile name
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
                console.log(`[AuthService] Successfully upgraded user to organizer`);
            }
            catch (updateError) {
                console.error(`[AuthService] Error upgrading user to organizer:`, updateError);
                throw new Error(`Failed to upgrade user: ${updateError.message}`);
            }
        }
        else {
            console.log(`[AuthService] Creating new organizer user`);
            // Create brand new user as Organizer
            try {
                user = await prisma_1.prisma.user.create({
                    data: {
                        phoneNumber: normalizedPhone || data.phoneNumber,
                        email: email,
                        role: client_1.Role.ORGANIZER,
                        status: client_1.AccountStatus.PENDING,
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
            }
            catch (createError) {
                console.error(`[AuthService] Error creating new organizer:`, createError);
                throw new Error(`Failed to create organizer: ${createError.message}`);
            }
        }
        // Get the organizerId from the newly created organizer profile
        const organizerId = user.organizer?.id;
        console.log(`[AuthService] Organizer ID: ${organizerId}`);
        // Generate tokens
        console.log(`[AuthService] Generating tokens for organizer`);
        const accessToken = this.generateAccessToken(user.id, user.role, organizerId);
        const refreshToken = this.generateRefreshToken(user.id);
        // Store refresh token - delete any existing ones first to avoid unique constraint
        try {
            // Delete any existing refresh tokens for this user
            await prisma_1.prisma.refreshToken.deleteMany({
                where: { userId: user.id }
            });
            // Create new refresh token
            await prisma_1.prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            console.log(`[AuthService] Refresh token stored successfully`);
        }
        catch (tokenError) {
            console.error(`[AuthService] Error storing refresh token:`, tokenError);
            throw new Error(`Failed to store refresh token: ${tokenError.message}`);
        }
        console.log(`[AuthService] Organizer registration completed successfully`);
        return { user, accessToken, refreshToken };
    }
    static async refreshAccessToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, getRefreshTokenSecret());
            // Check if token exists in DB and is not expired
            const storedToken = await prisma_1.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: { include: { organizer: true } } }
            });
            if (!storedToken || storedToken.expiresAt < new Date()) {
                if (storedToken) {
                    await prisma_1.prisma.refreshToken.delete({ where: { id: storedToken.id } });
                }
                throw new Error("Invalid or expired refresh token");
            }
            // Get organizerId if user is an organizer
            const organizerId = storedToken.user.organizer?.id;
            // Generate new access token
            const accessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.role, organizerId);
            return { accessToken };
        }
        catch (error) {
            throw new Error("Invalid refresh token");
        }
    }
    static generateAccessToken(userId, role, organizerId) {
        return jsonwebtoken_1.default.sign({ userId, id: userId, role, organizerId }, getAccessTokenSecret(), { expiresIn: "24h" });
    }
    static generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, getRefreshTokenSecret(), { expiresIn: "7d" });
    }
    static async getMe(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
exports.AuthService = AuthService;
