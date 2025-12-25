import api from './client';

export interface InitializePaymentResponse {
    checkoutUrl: string;
    paymentRef: string;
    amount: number;
    method: string;
    mockPayload?: any;
}

export interface VerifyPaymentResponse {
    message: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    purchaseId: number;
}

export const paymentService = {
    /**
     * Initializes a payment for a purchase
     */
    initializePayment: async (purchaseId: number): Promise<InitializePaymentResponse> => {
        const response: any = await api.post('/payments/initialize', { purchaseId });
        return response;
    },

    /**
     * Manually verify a payment (if callback fails or polling)
     */
    verifyPayment: async (paymentRef: string, externalRef?: string): Promise<VerifyPaymentResponse> => {
        const response: any = await api.post('/payments/verify', { paymentRef, externalRef });
        return response;
    }
};
