import { prisma } from "../lib/prisma";

export class SystemConfigService {
    static async getConfig(key: string) {
        return prisma.systemConfig.findUnique({
            where: { key }
        });
    }

    static async getAllConfigs() {
        return prisma.systemConfig.findMany();
    }

    static async setConfig(key: string, value: string, description?: string) {
        return prisma.systemConfig.upsert({
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
