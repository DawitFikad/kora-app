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

const getAccessTokenSecret = () => process.env.JWT_SECRET || "default_access_secret";

const extractBearerOrQueryToken = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }

    const queryToken = req.query.token;
    if (typeof queryToken === "string" && queryToken.trim()) {
        return queryToken.trim();
    }

    return null;
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, getAccessTokenSecret());
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
        const payload = jwt.verify(token, getAccessTokenSecret());
        req.user = payload;
        next();
    } catch (error) {
        // Proceed as guest even if token is invalid
        next();
    }
};

export const authenticateWithQueryToken = (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerOrQueryToken(req);
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const payload = jwt.verify(token, getAccessTokenSecret());
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }

        next();
    };
};
