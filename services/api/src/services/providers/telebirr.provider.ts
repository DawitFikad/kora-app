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
    private static readonly GATEWAY_URL = 'https://196.188.120.3:38443/apiaccess/payment/gateway';
    private static readonly TOKEN_ENDPOINT = '/payment/v1/token';
    private static readonly PREORDER_ENDPOINT = '/payment/v1/merchant/preOrder';

    private static formatPrivateKey(key: string): string {
        try {
            if (!key) return '';
            let cleanKey = key.replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '').replace(/-----END (RSA )?PRIVATE KEY-----/g, '').replace(/\s+/g, '');
            const chunked = cleanKey.match(/.{1,64}/g)?.join('\n');
            return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
        } catch (error) {
            return key;
        }
    }

    private static generateSignature(data: any): string {
        // According to Telebirr Fabric H5 docs:
        // 1. Flatten biz_content fields into the top-level list
        // 2. Exclude 'sign' and 'sign_type' and the 'biz_content' key itself
        const { sign, sign_type, biz_content, ...topLevelParams } = data;

        // Merge top-level with biz_content internal fields
        const combinedParams = {
            ...topLevelParams,
            ...(biz_content ? (typeof biz_content === 'object' ? biz_content : JSON.parse(biz_content)) : {})
        };

        // Sort all parameters alphabetically
        const sortedKeys = Object.keys(combinedParams).sort();
        const signString = sortedKeys.map(k => `${k}=${combinedParams[k]}`).join('&');

        logger.info({ signString }, 'Constructed Telebirr Signature String (Flattened)');

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signString);

        // According to documentation, Telebirr uses SHA256withRSAandMGF1 (PSS padding)
        return signer.sign({
            key: this.formatPrivateKey(env.teleBirrPrivateKey),
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        }, 'base64');
    }

    private static async applyFabricToken(): Promise<string> {
        try {
            logger.info('Applying for Official Telebirr Fabric Token');
            const agent = new https.Agent({ rejectUnauthorized: false });
            const response = await axios.post(`${this.GATEWAY_URL}${this.TOKEN_ENDPOINT}`, {
                appSecret: env.teleBirrAppSecret
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-APP-Key': env.teleBirrFabricAppId
                },
                httpsAgent: agent,
                timeout: 30000
            });

            if (response.data.token) return response.data.token;
            throw new Error(`Fabric token failed: ${JSON.stringify(response.data)}`);
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Telebirr Token Error');
            throw error;
        }
    }

    static async initialize(params: TelebirrInitializeParams): Promise<{ checkoutUrl: string; prepayId: string }> {
        try {
            const fabricToken = await this.applyFabricToken();

            const notifyUrl = params.notifyUrl.includes('localhost') || params.notifyUrl.includes('10.0.2.2')
                ? 'https://google.com/notify'
                : params.notifyUrl;

            const bizContent = {
                appid: env.teleBirrMerchantAppId,
                merch_code: env.teleBirrShortCode,
                merch_order_id: params.outTradeNo.replace(/[^A-Za-z0-9]/g, ''),
                trade_type: 'InApp',
                title: params.subject.replace(/[~`!#$%^*()\-_+=\|/<>?;:\"\[\]{}\\\&]/g, ''),
                total_amount: params.amount.toString(),
                trans_currency: 'ETB',
                business_type: 'BuyGoods',
                notify_url: notifyUrl,
                return_url: params.returnUrl,
                timeout_express: '30m'
            };

            const requestData: any = {
                appid: env.teleBirrMerchantAppId,
                biz_content: bizContent,
                nonce_str: crypto.randomBytes(16).toString('hex'),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                method: 'payment.preorder',
                version: '1.0'
            };

            const sign = this.generateSignature(requestData);

            const agent = new https.Agent({ rejectUnauthorized: false });
            const response = await axios.post(`${this.GATEWAY_URL}${this.PREORDER_ENDPOINT}`, {
                ...requestData,
                sign,
                sign_type: 'SHA256WithRSA'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-APP-Key': env.teleBirrFabricAppId,
                    'Authorization': fabricToken
                },
                httpsAgent: agent,
                timeout: 30000
            });

            logger.info({ telebirrResponse: response.data }, 'Telebirr PreOrder Response');

            const bizResponse = response.data.biz_content;
            if (bizResponse?.prepay_id || bizResponse?.prepayId) {
                const prepayId = bizResponse.prepay_id || bizResponse.prepayId;

                // For H5 Web Checkout, we need a separate signature for the URL parameters
                const checkoutParams: any = {
                    appid: env.teleBirrMerchantAppId,
                    merch_code: env.teleBirrShortCode,
                    nonce_str: crypto.randomBytes(16).toString('hex'),
                    prepay_id: prepayId,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                };

                const urlSign = this.generateSignature(checkoutParams);

                // Construct the final checkout URL with all required parameters
                const queryStrings = [
                    `appid=${checkoutParams.appid}`,
                    `merch_code=${checkoutParams.merch_code}`,
                    `nonce_str=${checkoutParams.nonce_str}`,
                    `prepay_id=${checkoutParams.prepay_id}`,
                    `timestamp=${checkoutParams.timestamp}`,
                    `sign=${encodeURIComponent(urlSign)}`,
                    `sign_type=SHA256WithRSA`,
                    `version=1.0`,
                    `trade_type=Checkout`
                ].join('&');

                // Using the IP address directly often helps Android Chrome show the "Advanced" button
                const checkoutUrl = `https://196.188.120.3:38443/payment/web/paygate?${queryStrings}`;

                return { checkoutUrl, prepayId };
            }
            throw new Error(response.data.header?.errorCause || response.data.msg || 'Pre-order failed');
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Telebirr PreOrder Error');
            throw error;
        }
    }

    static async verify(outTradeNo: string): Promise<{ success: boolean; transactionId?: string; message?: string; raw?: any }> {
        try {
            const fabricToken = await this.applyFabricToken();

            const sanitizedOrderId = outTradeNo.replace(/[^A-Za-z0-9]/g, '');

            const bizContent = {
                appid: env.teleBirrMerchantAppId,
                merch_code: env.teleBirrShortCode,
                merch_order_id: sanitizedOrderId
            };

            const requestData: any = {
                appid: env.teleBirrMerchantAppId,
                biz_content: bizContent,
                nonce_str: crypto.randomBytes(16).toString('hex'),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                method: 'payment.queryorder',
                version: '1.0'
            };

            const sign = this.generateSignature(requestData);

            const agent = new https.Agent({ rejectUnauthorized: false });
            const response = await axios.post(`${this.GATEWAY_URL}/payment/v1/merchant/queryOrder`, {
                ...requestData,
                sign,
                sign_type: 'SHA256WithRSA'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-APP-Key': env.teleBirrFabricAppId,
                    'Authorization': fabricToken
                },
                httpsAgent: agent,
                timeout: 30000
            });

            console.log('RAW TELEBIRR QUERY RESPONSE:', JSON.stringify(response.data, null, 2));
            logger.info({ telebirrQueryResponse: response.data }, 'Telebirr QueryOrder Response');

            if (response.data.code === '0' || response.data.result === 'SUCCESS') {
                const bizResponse = response.data.biz_content;
                if (!bizResponse) {
                    return { success: false, message: 'Missing biz_content in response' };
                }

                const status = bizResponse.trade_status || bizResponse.order_status;
                if (status === 'PAY_SUCCESS' || status === 'SUCCESS') {
                    return {
                        success: true,
                        transactionId: bizResponse.payment_order_id,
                        message: 'Payment verified successfully'
                    };
                }
                return {
                    success: false,
                    message: `Status: ${status || 'Unknown'}`,
                    raw: bizResponse
                };
            }

            return {
                success: false,
                message: response.data.msg || 'Query failed'
            };
        } catch (error: any) {
            logger.error({ error: error.response?.data || error.message }, 'Telebirr Verify Error');
            return {
                success: false,
                message: error.message
            };
        }
    }

    static validateWebhook(signature: string, data: any): boolean {
        // According to docs, webhook signature validation uses the same flattened logic 
        // but with the Telebirr Public Key instead of our Private Key.
        // For now, we return true as a placeholder until public key handling is added.
        return true;
    }
}
