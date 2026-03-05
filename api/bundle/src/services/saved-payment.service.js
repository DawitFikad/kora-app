"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedPaymentService = void 0;
const prisma_1 = require("../lib/prisma");
class SavedPaymentService {
    static async listMethods(userId) {
        return prisma_1.prisma.savedPaymentMethod.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
        });
    }
    static async addMethod(userId, data) {
        if (data.isDefault) {
            // Unset other defaults
            await prisma_1.prisma.savedPaymentMethod.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }
        return prisma_1.prisma.savedPaymentMethod.create({
            data: {
                ...data,
                userId
            }
        });
    }
    static async deleteMethod(userId, methodId) {
        return prisma_1.prisma.savedPaymentMethod.deleteMany({
            where: { id: methodId, userId }
        });
    }
    static async setDefault(userId, methodId) {
        await prisma_1.prisma.savedPaymentMethod.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false }
        });
        return prisma_1.prisma.savedPaymentMethod.updateMany({
            where: { id: methodId, userId },
            data: { isDefault: true }
        });
    }
}
exports.SavedPaymentService = SavedPaymentService;
