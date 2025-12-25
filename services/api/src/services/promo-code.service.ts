import { prisma } from "../lib/prisma";

export interface PromoValidationResult {
    valid: boolean;
    discountAmount: number;
    message?: string;
    promoId?: number;
    type?: string;
    value?: number;
}

export class PromoCodeService {
    /**
     * Validates a promo code and calculates the discount amount
     */
    static async validateAndCalculateDiscount(
        code: string,
        eventId: number,
        subtotal: number
    ): Promise<PromoValidationResult> {
        const promo = await prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() }
        });

        // Check if promo exists
        if (!promo) {
            return { valid: false, discountAmount: 0, message: "Invalid promo code" };
        }

        // Check if promo is active
        if (!promo.isActive) {
            return { valid: false, discountAmount: 0, message: "Promo code is no longer active" };
        }

        // Check if promo is for the correct event
        if (promo.eventId !== eventId) {
            return { valid: false, discountAmount: 0, message: "Promo code is not valid for this event" };
        }

        // Check if promo has expired
        if (promo.expiresAt && new Date() > promo.expiresAt) {
            return { valid: false, discountAmount: 0, message: "Promo code has expired" };
        }

        // Check usage limits
        if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
            return { valid: false, discountAmount: 0, message: "Promo code usage limit reached" };
        }

        // Calculate discount
        let discountAmount = 0;
        const discountValue = promo.discount.toNumber();

        if (promo.type === "PERCENTAGE") {
            discountAmount = (subtotal * discountValue) / 100;
            // Cap percentage discount to avoid negative totals
            discountAmount = Math.min(discountAmount, subtotal * 0.9); // Max 90% discount
        } else {
            // FIXED discount
            discountAmount = Math.min(discountValue, subtotal * 0.9); // Max 90% off
        }

        return {
            valid: true,
            discountAmount: Math.round(discountAmount * 100) / 100,
            promoId: promo.id,
            type: promo.type,
            value: discountValue
        };
    }

    /**
     * Validates promo code without calculating discount (for quick validation)
     */
    static async validate(code: string, eventId: number): Promise<{ valid: boolean; message?: string }> {
        const result = await this.validateAndCalculateDiscount(code, eventId, 100);
        return { valid: result.valid, message: result.message };
    }

    /**
     * Increments the usage count of a promo code
     */
    static async incrementUsage(promoId: number): Promise<void> {
        await prisma.promoCode.update({
            where: { id: promoId },
            data: { usedCount: { increment: 1 } }
        });
    }

    /**
     * Decrements the usage count (used when a purchase is cancelled)
     */
    static async decrementUsage(promoId: number): Promise<void> {
        await prisma.promoCode.update({
            where: { id: promoId },
            data: { usedCount: { decrement: 1 } }
        });
    }

    /**
     * Creates a new promo code for an event (organizer use)
     */
    static async create(data: {
        code: string;
        eventId: number;
        discount: number;
        type: 'PERCENTAGE' | 'FIXED';
        expiresAt?: Date;
        maxUses?: number;
    }) {
        // Normalize code to uppercase
        const normalizedCode = data.code.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (normalizedCode.length < 3 || normalizedCode.length > 20) {
            throw new Error("Promo code must be between 3 and 20 characters");
        }

        // Check if code already exists
        const existing = await prisma.promoCode.findUnique({
            where: { code: normalizedCode }
        });

        if (existing) {
            throw new Error("Promo code already exists");
        }

        // Validate discount value
        if (data.type === 'PERCENTAGE' && (data.discount < 1 || data.discount > 100)) {
            throw new Error("Percentage discount must be between 1 and 100");
        }

        if (data.type === 'FIXED' && data.discount < 1) {
            throw new Error("Fixed discount must be at least 1 ETB");
        }

        return prisma.promoCode.create({
            data: {
                code: normalizedCode,
                eventId: data.eventId,
                discount: data.discount,
                type: data.type,
                expiresAt: data.expiresAt,
                maxUses: data.maxUses,
                isActive: true,
                usedCount: 0
            }
        });
    }

    /**
     * Gets all promo codes for an event
     */
    static async getByEvent(eventId: number) {
        return prisma.promoCode.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Toggles the active status of a promo code
     */
    static async toggleActive(promoId: number, isActive: boolean) {
        return prisma.promoCode.update({
            where: { id: promoId },
            data: { isActive }
        });
    }

    /**
     * Deletes a promo code (only if not used)
     */
    static async delete(promoId: number) {
        const promo = await prisma.promoCode.findUnique({
            where: { id: promoId }
        });

        if (!promo) {
            throw new Error("Promo code not found");
        }

        if (promo.usedCount > 0) {
            throw new Error("Cannot delete promo code that has been used. Deactivate it instead.");
        }

        return prisma.promoCode.delete({
            where: { id: promoId }
        });
    }
}
