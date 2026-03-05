"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async requestOtp(req, res) {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
            }
            // 🔹 CONTROLLER-LEVEL BYPASS for Admin
            // Guaranteed to work even if Service/Redis crashes
            if (phoneNumber.includes("910639875")) {
                console.log("[AuthController] Admin Bypass triggered");
                return res.json({ message: "OTP sent successfully" });
            }
            const result = await auth_service_1.AuthService.requestOtp(phoneNumber);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async verifyOtp(req, res) {
        try {
            const { phoneNumber, otp } = req.body;
            if (!phoneNumber || !otp) {
                return res.status(400).json({ error: "Phone number and OTP are required" });
            }
            const result = await auth_service_1.AuthService.verifyOtp(phoneNumber, otp);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async registerOrganizer(req, res) {
        try {
            console.log('[AuthController] Register Organizer Request Body:', req.body);
            console.log('[AuthController] Register Organizer Request Files:', req.files);
            const { phoneNumber, email, name, city, payoutDetails } = req.body;
            if (!phoneNumber || !name || !city || !payoutDetails) {
                return res.status(400).json({ error: "Required fields missing: phoneNumber, name, city, payoutDetails" });
            }
            const result = await auth_service_1.AuthService.registerOrganizer({
                phoneNumber,
                email,
                name,
                city,
                payoutDetails,
                files: req.files
            });
            res.json(result);
        }
        catch (error) {
            console.error('[AuthController] Register Organizer Error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: "Refresh token is required" });
            }
            const result = await auth_service_1.AuthService.refreshAccessToken(refreshToken);
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    static async getMe(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const userId = req.user.userId;
            const user = await auth_service_1.AuthService.getMe(userId);
            res.json({ user });
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
