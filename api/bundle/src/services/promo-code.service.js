"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCodeService = void 0;
const prisma_1 = require("../lib/prisma");
class PromoCodeService {
    /**
     * Validates a promo code and calculates the discount amount
     */
    static async validateAndCalculateDiscount(code, eventId, subtotal) {
        const promo = await prisma_1.prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() },
            select: {
                id: true,
                code: true,
                discount: true,
                type: true,
                expiresAt: true,
                maxUses: true,
                usedCount: true,
                isActive: true,
                eventId: true
            }
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
        }
        else {
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
    static async validate(code, eventId) {
        const result = await this.validateAndCalculateDiscount(code, eventId, 100);
        return { valid: result.valid, message: result.message };
    }
    /**
     * Increments the usage count of a promo code
     */
    static async incrementUsage(promoId) {
        await prisma_1.prisma.promoCode.update({
            where: { id: promoId },
            data: { usedCount: { increment: 1 } }
        });
    }
    /**
     * Decrements the usage count (used when a purchase is cancelled)
     */
    static async decrementUsage(promoId) {
        await prisma_1.prisma.promoCode.update({
            where: { id: promoId },
            data: { usedCount: { decrement: 1 } }
        });
    }
    /**
     * Creates a new promo code for an event (organizer use)
     */
    static async create(data) {
        // Normalize code to uppercase
        const normalizedCode = data.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (normalizedCode.length < 3 || normalizedCode.length > 20) {
            throw new Error("Promo code must be between 3 and 20 characters");
        }
        // Check if code already exists
        const existing = await prisma_1.prisma.promoCode.findUnique({
            where: { code: normalizedCode },
            select: { id: true }
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
        if (data.codeType === 'INFLUENCER' && !data.influencerName) {
            throw new Error("Influencer name is required for influencer codes");
        }
        const createData = {
            code: normalizedCode,
            eventId: data.eventId,
            discount: data.discount,
            type: data.type,
            codeType: data.codeType || 'STANDARD',
            campaignName: data.campaignName || null,
            influencerName: data.influencerName || null,
            expiresAt: data.expiresAt,
            maxUses: data.maxUses,
            isActive: true,
            usedCount: 0
        };
        try {
            return await prisma_1.prisma.promoCode.create({ data: createData });
        }
        catch (error) {
            const msg = (error?.message || '').toLowerCase();
            if ((msg.includes('column') && msg.includes('does not exist')) || msg.includes('unknown arg')) {
                delete createData.codeType;
                delete createData.campaignName;
                delete createData.influencerName;
                return prisma_1.prisma.promoCode.create({ data: createData });
            }
            throw error;
        }
    }
    /**
     * Gets all promo codes for an event
     */
    static async getByEvent(eventId) {
        return prisma_1.prisma.promoCode.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                code: true,
                discount: true,
                type: true,
                expiresAt: true,
                maxUses: true,
                usedCount: true,
                isActive: true,
                eventId: true,
                createdAt: true
            }
        });
    }
    /**
     * Toggles the active status of a promo code
     */
    static async toggleActive(promoId, isActive) {
        return prisma_1.prisma.promoCode.update({
            where: { id: promoId },
            data: { isActive }
        });
    }
    /**
     * Deletes a promo code (only if not used)
     */
    static async delete(promoId) {
        const promo = await prisma_1.prisma.promoCode.findUnique({
            where: { id: promoId },
            select: { id: true, usedCount: true }
        });
        if (!promo) {
            throw new Error("Promo code not found");
        }
        if (promo.usedCount > 0) {
            throw new Error("Cannot delete promo code that has been used. Deactivate it instead.");
        }
        return prisma_1.prisma.promoCode.delete({
            where: { id: promoId }
        });
    }
}
exports.PromoCodeService = PromoCodeService;
