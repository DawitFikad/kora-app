import { prisma } from "../lib/prisma";

export class SavedPaymentService {
    static async listMethods(userId: number) {
        return prisma.savedPaymentMethod.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
        });
    }

    static async addMethod(userId: number, data: { provider: string, accountNumber: string, accountName?: string, isDefault?: boolean }) {
        if (data.isDefault) {
            // Unset other defaults
            await prisma.savedPaymentMethod.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        return prisma.savedPaymentMethod.create({
            data: {
                ...data,
                userId
            }
        });
    }

    static async deleteMethod(userId: number, methodId: number) {
        return prisma.savedPaymentMethod.deleteMany({
            where: { id: methodId, userId }
        });
    }

    static async setDefault(userId: number, methodId: number) {
        await prisma.savedPaymentMethod.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false }
        });

        return prisma.savedPaymentMethod.updateMany({
            where: { id: methodId, userId },
            data: { isDefault: true }
        });
    }
}
