/**
 * Price calculation utilities for ticket booking
 */
export class PriceCalculator {
    /**
     * Calculates commission based on event fee settings
     * @param subtotal - Total before fees
     * @param feeType - 'PERCENTAGE', 'FIXED', or 'HYBRID'
     * @param feeFixed - Fixed fee amount
     * @param feePercentage - Percentage fee (as whole number, e.g., 5 for 5%)
     */
    static calculateCommission(
        subtotal: number,
        feeType: string,
        feeFixed: number,
        feePercentage: number
    ): number {
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
    static calculateConvenienceFee(subtotal: number, percentage: number): number {
        return (subtotal * percentage) / 100;
    }

    /**
     * Rounds a number to 2 decimal places
     */
    static round(value: number): number {
        return Math.round(value * 100) / 100;
    }

    /**
     * Formats a price for display in ETB
     */
    static formatPrice(amount: number): string {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Calculates the organizer's net amount after platform fees
     */
    static calculateOrganizerNet(
        subtotal: number,
        feeType: string,
        feeFixed: number,
        feePercentage: number
    ): number {
        const commission = this.calculateCommission(subtotal, feeType, feeFixed, feePercentage);
        return this.round(subtotal - commission);
    }

    /**
     * Validates that a price is within acceptable bounds
     */
    static isValidPrice(price: number): boolean {
        return price >= 0 && price <= 1000000 && Number.isFinite(price);
    }
}
