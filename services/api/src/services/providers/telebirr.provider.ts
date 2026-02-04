// telebirr.provider.ts
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

export class TelebirrProvider {
    // Use the URL from your environment variable
    private static getGatewayUrl(): string {
        return env.teleBirrApiUrl || 'https://196.188.120.3:38443/apiaccess/payment/gateway';
    }

    // H5 Checkout base URL
    private static readonly H5_CHECKOUT_BASE = 'https://196.188.120.3:38443';

    /**
     * Format private key for crypto operations
     */
    private static formatPrivateKey(): string {
        try {
            const key = env.teleBirrPrivateKey;

            if (!key) {
                throw new Error('Private key is not configured');
            }

            // Check if already formatted
            if (key.includes('-----BEGIN PRIVATE KEY-----')) {
                return key;
            }

            // Clean the key - remove any quotes and extra spaces
            let cleanKey = key.trim().replace(/["']/g, '').replace(/\s+/g, '');

            // Format as PEM
            const chunked = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;

            return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;

        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to format private key');
            throw new Error(`Private key error: ${error.message}`);
        }
    }

    /**
     * Generate Telebirr signature
     */
    private static generateSignature(params: Record<string, any>): string {
        try {
            // Remove sign and sign_type from signature calculation
            const { sign, sign_type, ...paramsToSign } = params;

            // Sort keys alphabetically
            const sortedKeys = Object.keys(paramsToSign).sort();

            // Create signature string
            const signString = sortedKeys
                .map(key => `${key}=${paramsToSign[key]}`)
                .join('&');

            logger.debug({
                signString: signString.substring(0, 200)
            }, 'Signature string');

            // Get formatted private key
            const privateKey = this.formatPrivateKey();

            // Create signature using RSA-SHA256
            const signer = crypto.createSign('RSA-SHA256');
            signer.update(signString);
            signer.end();

            // Generate signature with PKCS#1 padding (RSA_PKCS1_PADDING)
            const signature = signer.sign({
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_PADDING
            }, 'base64');

            return signature;

        } catch (error: any) {
            logger.error({ error: error.message, params }, 'Signature generation failed');
            throw new Error(`Signature error: ${error.message}`);
        }
    }

    /**
     * Get Telebirr Fabric Token
     */
    private static async getToken(): Promise<string> {
        try {
            logger.info('Requesting Telebirr fabric token');

            const gatewayUrl = this.getGatewayUrl();

            // Create HTTPS agent
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false, // Important for Telebirr's self-signed cert
                keepAlive: true
            });

            const response = await axios.post(
                `${gatewayUrl}/payment/v1/token`,
                {
                    appSecret: env.teleBirrAppSecret
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-APP-Key': env.teleBirrFabricAppId
                    },
                    httpsAgent,
                    timeout: 30000
                }
            );

            logger.debug({
                tokenResponse: response.data,
                status: response.status
            }, 'Token response');

            if (response.data && response.data.token) {
                logger.info('Telebirr token obtained successfully');
                return response.data.token;
            }

            throw new Error(`Invalid token response: ${JSON.stringify(response.data)}`);

        } catch (error: any) {
            logger.error({
                error: error.message,
                url: this.getGatewayUrl() + '/payment/v1/token',
                status: error.response?.status,
                data: error.response?.data
            }, 'Telebirr token request failed');
            throw new Error(`Token request failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Initialize Telebirr payment
     */
    static async initialize(params: TelebirrInitializeParams): Promise<{ checkoutUrl: string; prepayId: string }> {
        try {
            if (this.isTestMode()) {
                const prepayId = `TEST_PREPAY_${Date.now()}`;
                const checkoutUrl = `${this.H5_CHECKOUT_BASE}/payment/web/paygate?test=true&prepay_id=${encodeURIComponent(prepayId)}`;
                logger.info({ prepayId }, 'Telebirr test mode initialization');
                return { checkoutUrl, prepayId };
            }

            // Check configuration
            if (!this.isConfigured()) {
                throw new Error('Telebirr is not properly configured');
            }

            logger.info({
                outTradeNo: params.outTradeNo,
                amount: params.amount,
                appId: env.teleBirrMerchantAppId
            }, 'Initializing Telebirr payment');

            // Get token
            const token = await this.getToken();

            // Prepare request data (Telebirr specific format)
            const bizContent = {
                appid: env.teleBirrMerchantAppId || '',
                merch_code: env.teleBirrShortCode || '',
                merch_order_id: params.outTradeNo,
                trade_type: 'H5',
                title: this.sanitizeString((params.subject || 'Ticket Purchase').substring(0, 100)),
                total_amount: Math.round(params.amount).toString(), // Amount in ETB (not cents)
                trans_currency: 'ETB',
                notify_url: params.notifyUrl,
                return_url: params.returnUrl,
                timeout_express: '30m'
            };

            const requestData = {
                appid: env.teleBirrMerchantAppId,
                biz_content: JSON.stringify(bizContent),
                nonce_str: crypto.randomBytes(32).toString('hex'),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                method: 'payment.preorder',
                version: '1.0'
            };

            // Generate signature
            const sign = this.generateSignature(requestData);

            // Add signature to request
            const finalRequestData = {
                ...requestData,
                sign,
                sign_type: 'SHA256WithRSA'
            };

            logger.debug({
                request: finalRequestData,
                bizContent,
                tokenPreview: token.substring(0, 20) + '...'
            }, 'Sending Telebirr preorder request');

            // Send request
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });

            const gatewayUrl = this.getGatewayUrl();
            const response = await axios.post(
                `${gatewayUrl}/payment/v1/merchant/preOrder`,
                finalRequestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-APP-Key': env.teleBirrFabricAppId,
                        'Authorization': token
                    },
                    httpsAgent,
                    timeout: 30000
                }
            );

            logger.info({
                responseCode: response.data?.code,
                responseMessage: response.data?.msg
            }, 'Telebirr preorder response');

            // Parse response
            if (response.data && response.data.code === '0') {
                let bizResponse = response.data.biz_content;

                // Parse if it's a string
                if (typeof bizResponse === 'string') {
                    try {
                        bizResponse = JSON.parse(bizResponse);
                    } catch (e) {
                        logger.warn({ bizResponse }, 'Failed to parse biz_content as JSON');
                    }
                }

                const prepayId = bizResponse?.prepay_id || bizResponse?.prepayId;

                if (prepayId) {
                    // Construct checkout URL according to Telebirr H5 documentation
                    const checkoutParams = new URLSearchParams({
                        appid: env.teleBirrMerchantAppId || '',
                        merch_code: env.teleBirrShortCode || '',
                        prepay_id: prepayId,
                        nonce_str: crypto.randomBytes(16).toString('hex'),
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        sign_type: 'SHA256WithRSA',
                        version: '1.0'
                    });

                    // Generate signature for checkout URL
                    const urlSignParams = Object.fromEntries(checkoutParams);
                    const urlSign = this.generateSignature(urlSignParams);
                    checkoutParams.append('sign', urlSign);

                    const checkoutUrl = `${this.H5_CHECKOUT_BASE}/payment/web/paygate?${checkoutParams.toString()}`;

                    logger.info({
                        checkoutUrl: checkoutUrl.substring(0, 100) + '...',
                        prepayId
                    }, 'Telebirr payment initialized successfully');

                    return { checkoutUrl, prepayId };
                }

                throw new Error(`No prepay_id in response: ${JSON.stringify(bizResponse)}`);
            }

            throw new Error(`Preorder failed: ${JSON.stringify(response.data)}`);

        } catch (error: any) {
            logger.error({
                error: error.message,
                stack: error.stack,
                params,
                appId: env.teleBirrMerchantAppId,
                responseData: error.response?.data,
                responseStatus: error.response?.status
            }, 'Telebirr initialization error');

            throw new Error(`Telebirr payment failed: ${error.response?.data?.msg || error.message}`);
        }
    }

    /**
     * Verify Telebirr payment
     */
    static async verify(outTradeNo: string): Promise<{
        success: boolean;
        transactionId?: string;
        message?: string;
        data?: any;
    }> {
        try {
            if (this.isTestMode()) {
                const isFail = outTradeNo.toLowerCase().includes('fail');
                return {
                    success: !isFail,
                    transactionId: isFail ? undefined : `TEST_TX_${outTradeNo}`,
                    message: isFail ? 'Test mode: simulated failure' : 'Test mode: simulated success',
                    data: { outTradeNo, testMode: true }
                };
            }

            logger.info({ outTradeNo }, 'Verifying Telebirr payment');

            if (!this.isConfigured()) {
                return {
                    success: false,
                    message: 'Telebirr not configured'
                };
            }

            // Get token
            const token = await this.getToken();

            // Prepare query request
            const bizContent = {
                appid: env.teleBirrMerchantAppId,
                merch_code: env.teleBirrShortCode,
                merch_order_id: outTradeNo
            };

            const requestData = {
                appid: env.teleBirrMerchantAppId,
                biz_content: JSON.stringify(bizContent),
                nonce_str: crypto.randomBytes(32).toString('hex'),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                method: 'payment.queryorder',
                version: '1.0'
            };

            // Generate signature
            const sign = this.generateSignature(requestData);

            const finalRequestData = {
                ...requestData,
                sign,
                sign_type: 'SHA256WithRSA'
            };

            logger.debug({
                verifyRequest: finalRequestData
            }, 'Sending verification request');

            // Send query request
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false
            });

            const gatewayUrl = this.getGatewayUrl();
            const response = await axios.post(
                `${gatewayUrl}/payment/v1/merchant/queryOrder`,
                finalRequestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-APP-Key': env.teleBirrFabricAppId,
                        'Authorization': token
                    },
                    httpsAgent,
                    timeout: 30000
                }
            );

            logger.info({
                responseCode: response.data?.code,
                responseMessage: response.data?.msg
            }, 'Telebirr verification response');

            // Parse response
            if (response.data && response.data.code === '0') {
                let bizResponse = response.data.biz_content;

                // Parse if it's a string
                if (typeof bizResponse === 'string') {
                    try {
                        bizResponse = JSON.parse(bizResponse);
                    } catch (e) {
                        // If parsing fails, check if it contains success status
                        if (bizResponse.includes('SUCCESS')) {
                            return {
                                success: true,
                                message: 'Payment successful',
                                data: bizResponse
                            };
                        }
                    }
                }

                // Check status
                const status = bizResponse?.trade_status ||
                    bizResponse?.order_status ||
                    bizResponse?.status ||
                    bizResponse?.result;

                logger.debug({ status, bizResponse }, 'Payment status check');

                if (status === 'SUCCESS' || status === 'PAY_SUCCESS' || status === '0') {
                    return {
                        success: true,
                        transactionId: bizResponse?.transaction_id ||
                            bizResponse?.payment_order_id ||
                            bizResponse?.out_trade_no,
                        message: 'Payment successful',
                        data: bizResponse
                    };
                } else if (status === 'PENDING' || status === 'PROCESSING') {
                    return {
                        success: false,
                        message: `Payment is ${status}. Please wait or check again later.`,
                        data: bizResponse
                    };
                } else {
                    return {
                        success: false,
                        message: `Payment status: ${status || 'UNKNOWN'}`,
                        data: bizResponse
                    };
                }
            }

            return {
                success: false,
                message: response.data?.msg || 'Verification failed',
                data: response.data
            };

        } catch (error: any) {
            logger.error({
                error: error.message,
                response: error.response?.data,
                outTradeNo
            }, 'Telebirr verification error');

            return {
                success: false,
                message: error.response?.data?.msg || error.message
            };
        }
    }

    /**
     * Check if Telebirr is properly configured
     */
    static isConfigured(): boolean {
        try {
            if (this.isTestMode()) {
                logger.info('Telebirr running in test mode');
                return true;
            }

            const requiredVars = [
                'teleBirrMerchantAppId',
                'teleBirrFabricAppId',
                'teleBirrShortCode',
                'teleBirrAppSecret',
                'teleBirrPrivateKey'
            ];

            // Check all required variables exist and are not placeholders
            for (const varName of requiredVars) {
                const value = env[varName as keyof typeof env];

                if (!value) {
                    logger.warn({ missingVar: varName }, 'Telebirr configuration missing');
                    return false;
                }

                // Check for placeholder values
                if (typeof value === 'string') {
                    const lowerValue = value.toLowerCase();
                    if (lowerValue.includes('your_') ||
                        lowerValue.includes('example') ||
                        lowerValue.includes('test_') &&
                        !lowerValue.includes('1547579123609609')) { // Your actual app ID
                        logger.warn({
                            varName,
                            value: value.substring(0, 20) + '...'
                        }, 'Telebirr configuration has placeholder');
                        return false;
                    }
                }
            }

            // Validate private key length
            if (env.teleBirrPrivateKey && env.teleBirrPrivateKey.length < 100) {
                logger.warn({
                    keyLength: env.teleBirrPrivateKey.length
                }, 'Telebirr private key seems too short');
                return false;
            }

            logger.debug('Telebirr configuration check passed');
            return true;

        } catch (error) {
            logger.error({ error }, 'Telebirr configuration check error');
            return false;
        }
    }

    /**
     * Check if Telebirr test mode is enabled
     */
    static isTestMode(): boolean {
        const value = (env.teleBirrTestMode || '').toLowerCase();
        return value === 'true' || value === '1' || value === 'yes';
    }

    /**
     * Sanitize string for Telebirr API
     */
    private static sanitizeString(str: string): string {
        return str.replace(/[^a-zA-Z0-9\s\-_.,:;!?@#$%&*()+=]/g, '');
    }

    /**
     * Test connectivity
     */
    static async testConnection(): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }> {
        try {
            logger.info('Testing Telebirr connection');

            if (this.isTestMode()) {
                return {
                    success: true,
                    message: 'Test mode enabled - no network call performed',
                    details: {
                        testMode: true,
                        gatewayUrl: this.getGatewayUrl()
                    }
                };
            }

            if (!this.isConfigured()) {
                return {
                    success: false,
                    message: 'Telebirr not properly configured'
                };
            }

            // Try to get a token
            const token = await this.getToken();

            return {
                success: true,
                message: 'Connection successful',
                details: {
                    hasToken: !!token,
                    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
                    appId: env.teleBirrMerchantAppId ? '***' + env.teleBirrMerchantAppId.slice(-4) : 'missing',
                    shortCode: env.teleBirrShortCode,
                    gatewayUrl: this.getGatewayUrl()
                }
            };

        } catch (error: any) {
            logger.error({
                error: error.message,
                response: error.response?.data,
                url: this.getGatewayUrl() + '/payment/v1/token'
            }, 'Telebirr connection test failed');

            // Check if it's a network issue
            const isNetworkError = error.message.includes('ENOTFOUND') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT');

            return {
                success: false,
                message: isNetworkError ?
                    `Cannot connect to Telebirr API at ${this.getGatewayUrl()}. Check network/firewall.` :
                    error.message,
                details: {
                    error: error.message,
                    url: this.getGatewayUrl(),
                    suggestion: isNetworkError ?
                        'Verify the API URL is correct and accessible from your server' :
                        'Check your credentials and API documentation'
                }
            };
        }
    }

    /**
     * Get supported payment methods
     */
    static getSupportedMethods(): string[] {
        return ['telebirr', 'TELEBIRR'];
    }

    /**
     * Validate webhook signature
     */
    static validateWebhook(signature: string, payload: any): boolean {
        try {
            logger.info({
                signature: signature?.substring(0, 50) + '...',
                payload: typeof payload
            }, 'Telebirr webhook validation');

            // TODO: Implement proper validation with Telebirr public key
            // For development/testing, you can accept all webhooks
            // In production, you MUST validate the signature

            return true; // Placeholder - implement proper validation

        } catch (error) {
            logger.error({ error }, 'Webhook validation error');
            return false;
        }
    }
}