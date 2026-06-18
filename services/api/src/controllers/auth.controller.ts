import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    static async requestOtp(req: Request, res: Response) {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
            }

            // Optional controller-level bypass when no SMS provider is configured.
            const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
            const hasAfro = !!(process.env.AFROMESSAGE_API_KEY);
            const smsConfigured = hasTwilio || hasAfro;
            const allowBypassFlag = (process.env.ALLOW_TEST_OTP_BYPASS || "").toLowerCase();
            const allowBypass = allowBypassFlag === "1" || allowBypassFlag === "true" || allowBypassFlag === "yes" || !smsConfigured;
            if (allowBypass) {
                console.log(`[AuthController] OTP bypass active for ${phoneNumber}`);
                const otp = (process.env.MASTER_OTP_CODE || "123456").trim();
                const explicit = (process.env.EXPOSE_OTP_IN_DOCKER || process.env.EXPOSE_OTP_IN_LOGS || "").toLowerCase();
                const shouldExpose = explicit === "1" || explicit === "true" || explicit === "yes" || process.env.NODE_ENV !== "production";
                if (shouldExpose) {
                    console.log(`[OTP TEST] PHONE: ${phoneNumber} | CODE: ${otp} (master test OTP)`);
                    return res.json({ message: "OTP sent successfully", otp });
                }
                return res.json({ message: "OTP sent successfully" });
            }

            const result = await AuthService.requestOtp(phoneNumber);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async verifyOtp(req: Request, res: Response) {
        try {
            const { phoneNumber, otp } = req.body;
            if (!phoneNumber || !otp) {
                return res.status(400).json({ error: "Phone number and OTP are required" });
            }
            const result = await AuthService.verifyOtp(phoneNumber, otp);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async registerOrganizer(req: Request, res: Response) {
        try {
            console.log('[AuthController] Register Organizer Request Body:', req.body);
            console.log('[AuthController] Register Organizer Request Files:', req.files);

            const { phoneNumber, email, name, city, payoutDetails } = req.body;

            if (!phoneNumber || !name || !city || !payoutDetails) {
                return res.status(400).json({ error: "Required fields missing: phoneNumber, name, city, payoutDetails" });
            }

            const result = await AuthService.registerOrganizer({
                phoneNumber,
                email,
                name,
                city,
                payoutDetails,
                files: req.files as Express.Multer.File[]
            });
            res.json(result);
        } catch (error: any) {
            console.error('[AuthController] Register Organizer Error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: "Refresh token is required" });
            }
            const result = await AuthService.refreshAccessToken(refreshToken);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    static async getMe(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const userId = req.user.userId;
            const user = await AuthService.getMe(userId);
            res.json({ user });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
}
