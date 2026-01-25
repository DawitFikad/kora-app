import axios from 'axios';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { withRetry } from '../../utils/retry';

interface ChapaInitializeParams {
    amount: number;
    email: string;
    firstName: string;
    lastName: string;
    txRef: string;
    callbackUrl: string;
    returnUrl: string;
    currency?: string;
    customization?: {
        title?: string;
        description?: string;
        logo?: string;
    };
    meta?: Record<string, any>;
}

interface ChapaInitializeResponse {
    message: string;
    status: string;
    data: {
        checkout_url: string;
    };
}

interface ChapaVerifyResponse {
    message: string;
    status: string;
    data: {
        first_name: string;
        last_name: string;
        email: string;
        currency: string;
        amount: string;
        charge: string;
        mode: string;
        method: string;
        type: string;
        status: string;
        reference: string;
        tx_ref: string;
        customization: {
            title: string;
            description: string;
        };
        meta: any;
        created_at: string;
        updated_at: string;
    };
}

export class ChapaProvider {
    private static readonly BASE_URL = 'https://api.chapa.co/v1';

    /**
     * Get the appropriate base URL based on environment
     */
    private static getBaseUrl(): string {
        return this.BASE_URL;
    }

    /**
     * Initialize Chapa payment
     */
    static async initialize(params: ChapaInitializeParams): Promise<{ checkoutUrl: string; txRef: string }> {
        try {
            const payload = {
                amount: params.amount.toString(),
                currency: params.currency || 'ETB',
                email: params.email,
                first_name: params.firstName,
                last_name: params.lastName,
                tx_ref: params.txRef,
                callback_url: params.callbackUrl,
                return_url: params.returnUrl,
                customization: params.customization || {
                    title: 'ET-Tickets Payment',
                    description: 'Ticket Purchase Payment',
                },
                meta: params.meta,
            };

            logger.info({ txRef: params.txRef }, 'Initializing Chapa payment');

            const response = await withRetry<any>(() => axios.post(
                `${this.getBaseUrl()}/transaction/initialize`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${env.chapaSecretKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            ));

            if (response.data.status === 'success') {
                logger.info({ txRef: params.txRef }, 'Chapa payment initialized successfully');
                return {
                    checkoutUrl: response.data.data.checkout_url,
                    txRef: params.txRef,
                };
            } else {
                throw new Error(`Chapa initialization failed: ${response.data.message}`);
            }
        } catch (error: any) {
            logger.error(
                {
                    error: error.response?.data || error.message,
                    txRef: params.txRef,
                },
                'Chapa initialization error'
            );
            const errorMsg = error.response?.data?.message;
            const formattedError = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : (errorMsg || error.message);
            throw new Error(`Chapa payment initialization failed: ${formattedError}`);
        }
    }

    /**
     * Verify Chapa payment
     */
    static async verify(txRef: string): Promise<{
        success: boolean;
        amount?: number;
        currency?: string;
        reference?: string;
        method?: string;
        status?: string;
        message?: string;
    }> {
        try {
            logger.info({ txRef }, 'Verifying Chapa payment');

            const response = await withRetry<any>(() => axios.get(
                `${this.getBaseUrl()}/transaction/verify/${txRef}`,
                {
                    headers: {
                        Authorization: `Bearer ${env.chapaSecretKey}`,
                    },
                    timeout: 30000,
                }
            ));

            if (response.data.status === 'success' && response.data.data.status === 'success') {
                logger.info(
                    {
                        txRef,
                        reference: response.data.data.reference,
                        amount: response.data.data.amount,
                    },
                    'Chapa payment verified successfully'
                );

                return {
                    success: true,
                    amount: parseFloat(response.data.data.amount),
                    currency: response.data.data.currency,
                    reference: response.data.data.reference,
                    method: response.data.data.method,
                    status: response.data.data.status,
                };
            } else {
                return {
                    success: false,
                    status: response.data.data?.status,
                    message: `Transaction status is ${response.data.data?.status || 'unknown'}`,
                };
            }
        } catch (error: any) {
            logger.error(
                {
                    error: error.response?.data || error.message,
                    txRef,
                },
                'Chapa verification error'
            );

            return {
                success: false,
                message: error.response?.data?.message || error.message,
            };
        }
    }

    /**
     * Validate webhook signature from Chapa
     */
    static validateWebhook(signature: string, payload: string, secret?: string): boolean {
        try {
            const crypto = require('crypto');
            const webhookSecret = secret || env.chapaSecretKey;

            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            logger.error({ error }, 'Chapa webhook validation error');
            return false;
        }
    }

    /**
     * Get supported payment methods
     */
    static getSupportedMethods(): string[] {
        return [
            'telebirr',
            'cbebirr',
            'ebirr',
            'mpesa',
            'amole',
            'awash_wallet',
            'card',
        ];
    }

    /**
     * Check if Chapa is properly configured
     */
    static isConfigured(): boolean {
        return !!(
            env.chapaSecretKey &&
            env.chapaSecretKey !== 'your_chapa_secret_key_or_mock' &&
            !env.chapaSecretKey.includes('mock')
        );
    }
}
