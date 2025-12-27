import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    static async requestOtp(req: Request, res: Response) {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ error: "Phone number is required" });
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
            const { phoneNumber, email, name, city, payoutDetails } = req.body;
            if (!phoneNumber || !name || !city || !payoutDetails) {
                return res.status(400).json({ error: "Required fields missing: phoneNumber, name, city, payoutDetails" });
            }

            const result = await AuthService.registerOrganizer({ phoneNumber, email, name, city, payoutDetails });
            res.json(result);
        } catch (error: any) {
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
