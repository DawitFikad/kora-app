"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapaProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../../utils/logger"));
const retry_1 = require("../../utils/retry");
class ChapaProvider {
    static shouldDebug() {
        return process.env.CHAPA_DEBUG === '1' || process.env.CHAPA_DEBUG === 'true';
    }
    /**
     * Get the appropriate base URL based on environment
     */
    static getBaseUrl() {
        return this.BASE_URL;
    }
    /**
     * Initialize Chapa payment
     */
    static async initialize(params) {
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
                    title: 'ET-Tickets',
                    description: 'Ticket Purchase Payment',
                },
                meta: params.meta,
            };
            if (this.shouldDebug()) {
                logger_1.default.info({
                    txRef: params.txRef,
                    payload,
                    hasChapaSecretKey: !!env_1.env.chapaSecretKey,
                    chapaSecretKeyLength: env_1.env.chapaSecretKey?.length || 0,
                    cwd: process.cwd(),
                }, 'CHAPA_DEBUG initialize()');
            }
            logger_1.default.info({ txRef: params.txRef }, 'Initializing Chapa payment');
            const response = await (0, retry_1.withRetry)(() => axios_1.default.post(`${this.getBaseUrl()}/transaction/initialize`, payload, {
                headers: {
                    Authorization: `Bearer ${env_1.env.chapaSecretKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }));
            if (response.data.status === 'success') {
                logger_1.default.info({ txRef: params.txRef }, 'Chapa payment initialized successfully');
                return {
                    checkoutUrl: response.data.data.checkout_url,
                    txRef: params.txRef,
                };
            }
            else {
                throw new Error(`Chapa initialization failed: ${response.data.message}`);
            }
        }
        catch (error) {
            logger_1.default.error({
                error: error.response?.data || error.message,
                txRef: params.txRef,
            }, 'Chapa initialization error');
            const errorMsg = error.response?.data?.message;
            const formattedError = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : (errorMsg || error.message);
            throw new Error(`Chapa payment initialization failed: ${formattedError}`);
        }
    }
    /**
     * Verify Chapa payment
     */
    static async verify(txRef) {
        try {
            logger_1.default.info({ txRef }, 'Verifying Chapa payment');
            const response = await (0, retry_1.withRetry)(() => axios_1.default.get(`${this.getBaseUrl()}/transaction/verify/${txRef}`, {
                headers: {
                    Authorization: `Bearer ${env_1.env.chapaSecretKey}`,
                },
                timeout: 30000,
            }));
            if (response.data.status === 'success' && response.data.data.status === 'success') {
                logger_1.default.info({
                    txRef,
                    reference: response.data.data.reference,
                    amount: response.data.data.amount,
                }, 'Chapa payment verified successfully');
                return {
                    success: true,
                    amount: parseFloat(response.data.data.amount),
                    currency: response.data.data.currency,
                    reference: response.data.data.reference,
                    method: response.data.data.method,
                    status: response.data.data.status,
                };
            }
            else {
                return {
                    success: false,
                    status: response.data.data?.status,
                    message: `Transaction status is ${response.data.data?.status || 'unknown'}`,
                };
            }
        }
        catch (error) {
            logger_1.default.error({
                error: error.response?.data || error.message,
                txRef,
            }, 'Chapa verification error');
            return {
                success: false,
                message: error.response?.data?.message || error.message,
            };
        }
    }
    /**
     * Validate webhook signature from Chapa
     */
    static validateWebhook(signature, payload, secret) {
        try {
            const crypto = require('crypto');
            const webhookSecret = secret || env_1.env.chapaSecretKey;
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            logger_1.default.error({ error }, 'Chapa webhook validation error');
            return false;
        }
    }
    /**
     * Get supported payment methods
     */
    static getSupportedMethods() {
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
    static isConfigured() {
        return !!(env_1.env.chapaSecretKey &&
            env_1.env.chapaSecretKey !== 'your_chapa_secret_key_or_mock' &&
            !env_1.env.chapaSecretKey.includes('mock'));
    }
}
exports.ChapaProvider = ChapaProvider;
ChapaProvider.BASE_URL = 'https://api.chapa.co/v1';
