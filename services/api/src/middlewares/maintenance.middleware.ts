import { Request, Response, NextFunction } from "express";
import { SystemConfigService } from "../services/system-config.service";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const EXEMPT_PATH_PREFIXES = [
    "/api/health-check-v3",
    "/api/public/health",
    "/api/admin/config",
    "/api/payments/webhook",
    "/api/payments/verify-callback",
    "/api/payments/completion",
];

function isExemptPath(path: string) {
    return EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const enforceMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (SAFE_METHODS.has(req.method) || isExemptPath(req.path)) {
            return next();
        }

        const enabled = await SystemConfigService.isMaintenanceMode();
        if (!enabled) return next();

        const platformName = await SystemConfigService.getString("general.platform_name", "ET-Ticket");
        const supportPhone = await SystemConfigService.getString("general.support_phone", "");

        return res.status(503).json({
            error: "Maintenance mode is enabled",
            platform: platformName,
            supportPhone: supportPhone || undefined,
            retryable: true,
        });
    } catch (error) {
        return next();
    }
};
