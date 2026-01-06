import axios from 'axios';
import https from 'https';
import crypto from 'crypto';
import { env } from '../../config/env';
import logger from '../../utils/logger';

interface TelebirrInitializeParams {
    amount: number;
    orderId: string;
    returnUrl: string;
    notifyUrl: string;
    subject: string;
    outTradeNo: string;
}

interface TelebirrResponse {
    code: string;
    msg: string;
    data?: {
        toPayUrl: string;
        prepayId: string;
    };
}

export class TelebirrProvider {
    private static readonly BASE_URL = `${env.teleBirrApiUrl}/service-openup/toTradeWebPay`;
    private static readonly QUERY_URL = `${env.teleBirrApiUrl}/service-openup/query`;

    /**
     * Format private key with PEM headers if missing
     */
    private static formatPrivateKey(key: string): string {
        try {
            if (!key) return '';

            // Remove existing headers/footers and newlines to get clean base64
            let cleanKey = key
                .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
                .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
                .replace(/\s+/g, '');

            // Chunk into 64 characters
            const chunked = cleanKey.match(/.{1,64}/g)?.join('\n');

            return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
        } catch (error) {
            logger.error({ error }, 'Error formatting private key');
            return key;
        }
    }

    /**
     * Generate signature for Telebirr API requests
     */
    private static generateSignature(data: any): string {
        const sortedKeys = Object.keys(data).sort();
        const signString = sortedKeys
            .map(key => `${key}=${data[key]}`)
            .join('&');

        const sign = crypto
            .createSign('RSA-SHA256')
            .update(signString)
            .sign(this.formatPrivateKey(env.teleBirrPrivateKey), 'base64');

        return sign;
    }

    /**
     * Encrypt request data for Telebirr
     */
    private static encryptData(data: any): string {
        const jsonString = JSON.stringify(data);
        const cipher = crypto.createCipheriv(
            'aes-128-ecb',
            Buffer.from(env.teleBirrAppSecret.substring(0, 16)),
            ''
        );
        let encrypted = cipher.update(jsonString, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    /**
     * Decrypt response data from Telebirr
     */
    private static decryptData(encryptedData: string): any {
        const decipher = crypto.createDecipheriv(
            'aes-128-ecb',
            Buffer.from(env.teleBirrAppSecret.substring(0, 16)),
            ''
        );
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }

    /**
     * Initialize Telebirr payment
     */
    static async initialize(params: TelebirrInitializeParams): Promise<{ checkoutUrl: string; prepayId: string }> {
        try {
            const timestamp = Date.now().toString();
            const nonce = crypto.randomBytes(16).toString('hex');

            const requestData = {
                appid: env.teleBirrFabricAppId,
                merAppid: env.teleBirrMerchantAppId,
                nonce,
                notifyUrl: params.notifyUrl,
                outTradeNo: params.outTradeNo,
                returnUrl: params.returnUrl,
                shortCode: env.teleBirrShortCode,
                subject: params.subject,
                timeoutExpress: '30', // 30 minutes
                timestamp,
                totalAmount: params.amount.toFixed(2),
                tradeType: 'InApp',
            };

            const signature = this.generateSignature(requestData);
            const encryptedData = this.encryptData(requestData);

            const payload = {
                appid: env.teleBirrFabricAppId,
                sign: signature,
                ussd: encryptedData,
            };

            logger.info({ outTradeNo: params.outTradeNo }, 'Initializing Telebirr payment');

            const agent = new https.Agent({
                rejectUnauthorized: false
            });

            const response = await axios.post<TelebirrResponse>(this.BASE_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                httpsAgent: agent,
                timeout: 30000,
            });

            if (response.data.code === '0' && response.data.data) {
                logger.info({ outTradeNo: params.outTradeNo }, 'Telebirr payment initialized successfully');
                return {
                    checkoutUrl: response.data.data.toPayUrl,
                    prepayId: response.data.data.prepayId,
                };
            } else {
                throw new Error(`Telebirr initialization failed: ${response.data.msg}`);
            }
        } catch (error: any) {
            logger.error({ error: error.message, outTradeNo: params.outTradeNo }, 'Telebirr initialization error');
            throw new Error(`Telebirr payment initialization failed: ${error.message}`);
        }
    }

    /**
     * Verify Telebirr payment
     */
    static async verify(outTradeNo: string): Promise<{ success: boolean; transactionId?: string; message?: string }> {
        try {
            const timestamp = Date.now().toString();
            const nonce = crypto.randomBytes(16).toString('hex');

            const requestData = {
                appid: env.teleBirrFabricAppId,
                merAppid: env.teleBirrMerchantAppId,
                nonce,
                outTradeNo,
                timestamp,
            };

            const signature = this.generateSignature(requestData);
            const encryptedData = this.encryptData(requestData);

            const payload = {
                appid: env.teleBirrFabricAppId,
                sign: signature,
                ussd: encryptedData,
            };

            logger.info({ outTradeNo }, 'Verifying Telebirr payment');

            const agent = new https.Agent({
                rejectUnauthorized: false
            });

            const response = await axios.post<TelebirrResponse>(this.QUERY_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                httpsAgent: agent,
                timeout: 30000,
            });

            if (response.data.code === '0' && response.data.data) {
                const decryptedData = this.decryptData(response.data.data as any);

                if (decryptedData.tradeStatus === 'SUCCESS') {
                    logger.info({ outTradeNo, transactionId: decryptedData.transactionNo }, 'Telebirr payment verified successfully');
                    return {
                        success: true,
                        transactionId: decryptedData.transactionNo,
                    };
                } else {
                    return {
                        success: false,
                        message: `Payment status: ${decryptedData.tradeStatus}`,
                    };
                }
            } else {
                return {
                    success: false,
                    message: response.data.msg || 'Verification failed',
                };
            }
        } catch (error: any) {
            logger.error({ error: error.message, outTradeNo }, 'Telebirr verification error');
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Validate webhook signature from Telebirr
     */
    static validateWebhook(signature: string, data: any): boolean {
        try {
            const expectedSignature = this.generateSignature(data);
            return signature === expectedSignature;
        } catch (error) {
            logger.error({ error }, 'Telebirr webhook validation error');
            return false;
        }
    }
}
