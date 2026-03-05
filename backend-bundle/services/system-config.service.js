"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigService = void 0;
const prisma_1 = require("../lib/prisma");
class SystemConfigService {
    static async getConfig(key) {
        return prisma_1.prisma.systemConfig.findUnique({
            where: { key }
        });
    }
    static async getAllConfigs() {
        return prisma_1.prisma.systemConfig.findMany();
    }
    static async setConfig(key, value, description) {
        return prisma_1.prisma.systemConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });
    }
    static async isMaintenanceMode() {
        const config = await this.getConfig("maintenance_mode");
        return config?.value === "true";
    }
}
exports.SystemConfigService = SystemConfigService;
