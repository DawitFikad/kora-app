import { prisma } from "../lib/prisma";

export class SystemConfigService {
    private static readonly CACHE_TTL_MS = 15_000;
    private static cachedMap: Map<string, string> | null = null;
    private static cacheExpiresAt = 0;

    private static async getMap(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.cachedMap && now < this.cacheExpiresAt) {
            return this.cachedMap;
        }

        const rows = await prisma.systemConfig.findMany({ select: { key: true, value: true } });
        this.cachedMap = new Map(rows.map((row) => [row.key, row.value]));
        this.cacheExpiresAt = now + this.CACHE_TTL_MS;
        return this.cachedMap;
    }

    private static parseBoolean(value: string | null | undefined, fallback = false) {
        if (typeof value !== "string") return fallback;
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
        return fallback;
    }

    static async getConfig(key: string) {
        return prisma.systemConfig.findUnique({
            where: { key }
        });
    }

    static async getAllConfigs() {
        return prisma.systemConfig.findMany();
    }

    static async setConfig(key: string, value: string, description?: string) {
        const config = await prisma.systemConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });
        this.cachedMap = null;
        this.cacheExpiresAt = 0;
        return config;
    }

    static async getString(key: string, fallback = "") {
        const map = await this.getMap();
        return map.get(key) ?? fallback;
    }

    static async getBoolean(key: string, fallback = false) {
        const map = await this.getMap();
        return this.parseBoolean(map.get(key), fallback);
    }

    static async getNumber(key: string, fallback: number) {
        const map = await this.getMap();
        const raw = map.get(key);
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    static async getSnapshot() {
        const map = await this.getMap();
        return Object.fromEntries(map.entries());
    }

    static async isMaintenanceMode() {
        return this.getBoolean("maintenance_mode", false);
    }
}
