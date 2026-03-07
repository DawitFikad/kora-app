import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { env } from "../config/env";
import logger from "../utils/logger";

function getSafeWebReturn(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.toString();
    } catch {
        return null;
    }
}

function buildCompletionUrl(base: string, params: Record<string, string | undefined>): string {
    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== "") {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
}

function getRequestBaseUrl(req: Request): string | null {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)
        ?.split(',')[0]
        ?.trim();
    const forwardedHost = (req.headers['x-forwarded-host'] as string | undefined)
        ?.split(',')[0]
        ?.trim();
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get('host');

    if (!host) return null;
    return `${protocol}://${host}`;
}

function resolveClientCompletionUrl(requestBaseUrl: string): string {
    const defaultUrl = `${requestBaseUrl}/api/payments/completion`;
    const configured = getSafeWebReturn(process.env.CLIENT_URL);
    if (!configured) return defaultUrl;

    try {
        const configuredHost = new URL(configured).host.toLowerCase();
        const requestHost = new URL(requestBaseUrl).host.toLowerCase();

        // Guard against stale local config (common after port changes).
        if (
            (configuredHost === 'localhost:4000' || configuredHost === '127.0.0.1:4000') &&
            configuredHost !== requestHost
        ) {
            return defaultUrl;
        }

        return configured;
    } catch {
        return defaultUrl;
    }
}

function normalizeWebhookStatus(rawStatus: unknown, isChapa: boolean): "SUCCESS" | "FAILED" | "PENDING" | "UNKNOWN" {
    if (typeof rawStatus !== "string" || !rawStatus.trim()) return "UNKNOWN";
    const normalized = rawStatus.trim().toUpperCase();

    if (isChapa) {
        if (normalized === "SUCCESS") return "SUCCESS";
        if (normalized === "FAILED" || normalized === "CANCELLED" || normalized === "EXPIRED") return "FAILED";
        if (normalized === "PENDING") return "PENDING";
        return "UNKNOWN";
    }

    if (normalized === "SUCCESS") return "SUCCESS";
    if (normalized === "FAILED" || normalized === "CANCELLED" || normalized === "EXPIRED") return "FAILED";
    if (normalized === "PENDING") return "PENDING";
    return "UNKNOWN";
}

export class PaymentController {
    /**
     * Starts the payment process for a pending purchase.
     */
    static async initialize(req: Request, res: Response) {
        try {
            const { purchaseId } = req.body;
            console.log(`[Payment] Initializing payment for purchaseId: ${purchaseId}`);

            if (!purchaseId) {
                return res.status(400).json({ error: "Purchase ID is required" });
            }

            const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
            const protocol = forwardedProto || req.protocol;
            const host = req.get('host');
            const requestBaseUrl = host ? `${protocol}://${host}` : undefined;

            const result = await PaymentService.initializePayment(parseInt(purchaseId), requestBaseUrl);
            res.json(result);
        } catch (error: any) {
            console.error("❌ Payment Initialization Failed:", error);
            const status = Number(error.status || 400);
            res.status(status).json({
                error: "Initialization Failed",
                message: error.message || "Unknown error during initialization",
                detail: error.stack?.split('\n')[0].replace(/C:.*\\/g, ''),
                purchaseId: req.body?.purchaseId
            });
        }
    }

    /**
     * Diagnostic endpoint to check configuration without sensitive data
     */
    static async healthCheck(req: Request, res: Response) {
        try {
            const config = {
                chapaConfigured: !!(env.chapaSecretKey && !env.chapaSecretKey.includes('your_')),
                telebirrConfigured: !!(env.teleBirrMerchantAppId && !env.teleBirrMerchantAppId.includes('your_')),
                apiUrl: env.apiUrl,
                nodeEnv: process.env.NODE_ENV,
                vercelUrl: process.env.VERCEL_URL
            };
            res.json({ status: "ok", config });
        } catch (error: any) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    /**
     * Verifies a payment and issues tickets.
     */
    static async verify(req: Request, res: Response) {
        try {
            const { paymentRef, externalRef } = req.body;
            const result = await PaymentService.verifyPayment(paymentRef, externalRef);
            res.json({
                message: `Payment ${result.status}`,
                status: result.status,
                purchaseId: result.id
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Webhook receiver for payment providers.
     */
    static async webhook(req: Request, res: Response) {
        try {
            const body = req.body;
            let paymentRef = "";
            let status: "SUCCESS" | "FAILED" | "PENDING" | "UNKNOWN" = "UNKNOWN";
            let externalRef = "";

            // 1. Detection & Signature Verification
            const chapaSignature = (req.headers['chapa-signature'] || req.headers['x-chapa-signature']) as string | undefined;
            const isChapaWebhook = !!chapaSignature;

            if (isChapaWebhook) {
                // Handle Chapa Webhook using Raw Body for precise Signature verification
                const payload = (req as any).rawBody || JSON.stringify(body);
                const isValid = PaymentService.validateChapaWebhook(chapaSignature, payload.toString());
                if (!isValid) {
                    logger.warn(
                        { provider: "CHAPA", eventType: "WEBHOOK", reason: "INVALID_SIGNATURE" },
                        "Rejected payment webhook"
                    );
                    return res.status(401).send("Invalid Signature");
                }

                paymentRef = body.tx_ref;
                status = normalizeWebhookStatus(body.status, true);
                externalRef = body.reference;
            } else {
                // Fallback for Telebirr / Generic
                paymentRef = body.paymentRef || body.outTradeNo || body.merch_order_id;
                status = normalizeWebhookStatus(body.status, false);
                externalRef = body.externalRef || body.transactionId;
            }

            logger.info(
                {
                    provider: isChapaWebhook ? "CHAPA" : "GENERIC",
                    eventType: "WEBHOOK_RECEIVED",
                    paymentRef,
                    status,
                    externalRef,
                },
                "Payment webhook received"
            );

            // 2. Processing
            if (status === "SUCCESS" && paymentRef) {
                try {
                    const verified = await PaymentService.verifyPayment(paymentRef, externalRef);
                    logger.info(
                        {
                            provider: isChapaWebhook ? "CHAPA" : "GENERIC",
                            eventType: "WEBHOOK_VERIFIED",
                            paymentRef,
                            resultingStatus: verified.status,
                            purchaseId: verified.id,
                        },
                        "Payment webhook processed"
                    );
                } catch (error: any) {
                    if ((error?.message || "").includes("Purchase record not found")) {
                        logger.warn(
                            {
                                provider: isChapaWebhook ? "CHAPA" : "GENERIC",
                                eventType: "WEBHOOK_SKIPPED",
                                reason: "UNKNOWN_PAYMENT_REF",
                                paymentRef,
                            },
                            "Payment webhook ignored for unknown reference"
                        );
                        return res.status(202).json({ received: true, ignored: "unknown_payment_ref" });
                    }
                    throw error;
                }
            } else if (status === "UNKNOWN" || !paymentRef) {
                logger.warn(
                    {
                        provider: isChapaWebhook ? "CHAPA" : "GENERIC",
                        eventType: "WEBHOOK_SKIPPED",
                        reason: !paymentRef ? "MISSING_PAYMENT_REF" : "UNKNOWN_STATUS",
                        status,
                    },
                    "Payment webhook ignored"
                );
            } else {
                logger.info(
                    {
                        provider: isChapaWebhook ? "CHAPA" : "GENERIC",
                        eventType: "WEBHOOK_NON_SUCCESS",
                        paymentRef,
                        status,
                    },
                    "Payment webhook acknowledged without verification"
                );
            }

            res.json({ received: true });
        } catch (error: any) {
            logger.error({ error: error.message }, "Payment webhook error");
            res.status(500).json({ error: error.message });
        }
    }



    /**
     * Handles the return redirect from Payment Providers.
     */
    static async verifyCallback(req: Request, res: Response) {
        try {
            const { ref } = req.query;
            const requestBaseUrl = getRequestBaseUrl(req) || env.apiUrl;
            const clientUrl = resolveClientCompletionUrl(requestBaseUrl);
            const webReturn = getSafeWebReturn(req.query.web_return);

            if (!ref) {
                res.redirect(buildCompletionUrl(clientUrl, {
                    status: 'error',
                    message: 'Missing Payment Reference',
                    web_return: webReturn || undefined,
                }));
                return;
            }

            const result = await PaymentService.verifyPayment(ref as string);

            if (result.status === 'SUCCESS') {
                res.redirect(buildCompletionUrl(clientUrl, {
                    status: 'success',
                    ref: ref as string,
                    purchaseId: String(result.id),
                    web_return: webReturn || undefined,
                }));
            } else {
                res.redirect(buildCompletionUrl(clientUrl, {
                    status: 'failed',
                    ref: ref as string,
                    reason: result.failureReason || 'Verification failed',
                    purchaseId: String(result.id),
                    web_return: webReturn || undefined,
                }));
            }
        } catch (error: any) {
            const requestBaseUrl = getRequestBaseUrl(req) || env.apiUrl;
            const clientUrl = resolveClientCompletionUrl(requestBaseUrl);
            const webReturn = getSafeWebReturn(req.query.web_return);
            res.redirect(buildCompletionUrl(clientUrl, {
                status: 'error',
                message: error.message,
                web_return: webReturn || undefined,
            }));
        }
    }

    /**
     * Renders a simple completion page (to avoid localhost redirect issues on mobile).
     */
    static async completion(req: Request, res: Response) {
        const { status, message, purchaseId, ref } = req.query;
        const webReturnBase = getSafeWebReturn(req.query.web_return);
        const isSuccess = status === 'success';
        const color = isSuccess ? '#34a853' : '#ea4335';
        const title = isSuccess ? 'Payment Successful' : 'Payment Failed';
        const msg = message || (isSuccess ? 'Your payment has been verified. Redirecting to app...' : 'Something went wrong.');

        // Deep link to return to app
        const deepLink = isSuccess
            ? `etticket://payment/success?purchaseId=${purchaseId}&ref=${ref}`
            : `etticket://payment/failed?reason=${encodeURIComponent(message as string || 'Payment failed')}`;

        const webReturnUrl = (() => {
            if (!webReturnBase) return null;
            try {
                const url = new URL(webReturnBase);
                url.searchParams.set('paymentStatus', isSuccess ? 'success' : 'failed');
                if (purchaseId) url.searchParams.set('purchaseId', String(purchaseId));
                if (ref) url.searchParams.set('ref', String(ref));
                return url.toString();
            } catch {
                return null;
            }
        })();

        res.send(`
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${title}</title>
                    <script>
                        const deepLink = ${JSON.stringify(deepLink)};
                        const webReturnUrl = ${JSON.stringify(webReturnUrl)};

                        function goToApp() {
                            window.location.href = deepLink;
                            if (webReturnUrl) {
                                setTimeout(function() {
                                    window.location.href = webReturnUrl;
                                }, 1200);
                            }
                        }

                        // Auto-redirect to app after 2 seconds
                        setTimeout(function() {
                            goToApp();
                        }, 2000);
                        
                        // Fallback: try to close window after 5 seconds if still open
                        setTimeout(function() {
                            window.close();
                        }, 5000);
                    </script>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; margin: 0; padding: 20px; text-align: center;">
                    <div style="background: white; padding: 2.5rem 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 400px; box-sizing: border-box;">
                        <div style="width: 80px; height: 80px; background: ${color}20; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                            <span style="font-size: 40px; color: ${color};">${isSuccess ? '✓' : '✕'}</span>
                        </div>
                        <h2 style="color: #1a1a1a; margin: 0 0 0.5rem; font-size: 24px; font-weight: 700;">${title}</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 2rem;">${msg}</p>
                        
                        <a href="${deepLink}" onclick="setTimeout(function(){ if (${JSON.stringify(!!webReturnUrl)}) { window.location.href = ${JSON.stringify(webReturnUrl)}; } }, 1200);" style="background: ${color}; color: white; border: none; padding: 16px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; display: block; width: 100%; text-decoration: none; font-size: 16px; box-sizing: border-box;">
                           Return to App
                        </a>
                        ${webReturnUrl ? `<a href="${webReturnUrl}" style="margin-top: 0.75rem; background: #f3f4f6; color: #111827; border: 1px solid #d1d5db; padding: 14px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; display: block; width: 100%; text-decoration: none; font-size: 15px; box-sizing: border-box;">Continue in Browser</a>` : ''}
                        <p style="margin-top: 1rem; color: #999; font-size: 13px;">Redirecting automatically in 2 seconds...</p>
                    </div>
                </body>
            </html>
        `);
    }
}
