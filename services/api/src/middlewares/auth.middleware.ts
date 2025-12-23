import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include user info
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "default_access_secret";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        // Proceed as guest even if token is invalid
        next();
    }
};
