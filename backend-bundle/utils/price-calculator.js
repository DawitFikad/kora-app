"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCalculator = void 0;
/**
 * Price calculation utilities for ticket booking
 */
class PriceCalculator {
    /**
     * Calculates commission based on event fee settings
     * @param subtotal - Total before fees
     * @param feeType - 'PERCENTAGE', 'FIXED', or 'HYBRID'
     * @param feeFixed - Fixed fee amount
     * @param feePercentage - Percentage fee (as whole number, e.g., 5 for 5%)
     */
    static calculateCommission(subtotal, feeType, feeFixed, feePercentage) {
        switch (feeType) {
            case 'FIXED':
                return feeFixed;
            case 'PERCENTAGE':
                return (subtotal * feePercentage) / 100;
            case 'HYBRID':
                return feeFixed + (subtotal * feePercentage) / 100;
            default:
                return 0;
        }
    }
    /**
     * Calculates convenience fee
     * @param subtotal - Total before convenience fee
     * @param percentage - Convenience fee percentage (e.g., 2.5 for 2.5%)
     */
    static calculateConvenienceFee(subtotal, percentage) {
        return (subtotal * percentage) / 100;
    }
    /**
     * Rounds a number to 2 decimal places
     */
    static round(value) {
        return Math.round(value * 100) / 100;
    }
    /**
     * Formats a price for display in ETB
     */
    static formatPrice(amount) {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
        }).format(amount);
    }
    /**
     * Calculates the organizer's net amount after platform fees
     */
    static calculateOrganizerNet(subtotal, feeType, feeFixed, feePercentage) {
        const commission = this.calculateCommission(subtotal, feeType, feeFixed, feePercentage);
        return this.round(subtotal - commission);
    }
    /**
     * Validates that a price is within acceptable bounds
     */
    static isValidPrice(price) {
        return price >= 0 && price <= 1000000 && Number.isFinite(price);
    }
}
exports.PriceCalculator = PriceCalculator;
