"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getAccessTokenSecret = () => process.env.JWT_SECRET || "default_access_secret";
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, getAccessTokenSecret());
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, getAccessTokenSecret());
        req.user = payload;
        next();
    }
    catch (error) {
        // Proceed as guest even if token is invalid
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }
        next();
    };
};
exports.authorize = authorize;
