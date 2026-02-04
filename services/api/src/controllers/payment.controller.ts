import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { env } from "../config/env";

export class PaymentController {
    /**
     * Starts the payment process for a pending purchase.
     */
    static async initialize(req: Request, res: Response) {
        try {
            const { purchaseId } = req.body;
            const result = await PaymentService.initializePayment(parseInt(purchaseId));
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
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
            let status = "";
            let externalRef = "";

            // 1. Detection & Signature Verification
            const chapaSignature = req.headers['chapa-signature'] as string;

            if (chapaSignature) {
                // Handle Chapa Webhook using Raw Body for precise Signature verification
                const payload = (req as any).rawBody || JSON.stringify(body);
                const isValid = PaymentService.validateChapaWebhook(chapaSignature, payload.toString());
                if (!isValid) return res.status(401).send("Invalid Signature");

                paymentRef = body.tx_ref;
                status = body.status === "success" ? "SUCCESS" : "FAILED";
                externalRef = body.reference;
            } else {
                // Fallback for Telebirr / Generic
                paymentRef = body.paymentRef || body.outTradeNo || body.merch_order_id;
                status = body.status || "SUCCESS";
                externalRef = body.externalRef || body.transactionId;
            }

            // 2. Processing
            if (status === "SUCCESS" && paymentRef) {
                await PaymentService.verifyPayment(paymentRef, externalRef);
            }

            res.json({ received: true });
        } catch (error: any) {
            console.error("Webhook Error:", error.message);
            res.status(500).json({ error: error.message });
        }
    }



    /**
     * Handles the return redirect from Payment Providers.
     */
    static async verifyCallback(req: Request, res: Response) {
        try {
            const { ref } = req.query;
            const defaultUrl = `${env.apiUrl}/api/payments/completion`;
            const clientUrl = process.env.CLIENT_URL || defaultUrl;

            if (!ref) {
                res.redirect(`${clientUrl}?status=error&message=Missing+Payment+Reference`);
                return;
            }

            const result = await PaymentService.verifyPayment(ref as string);

            if (result.status === 'SUCCESS') {
                res.redirect(`${clientUrl}?status=success&ref=${ref}&purchaseId=${result.id}`);
            } else {
                res.redirect(`${clientUrl}?status=failed&ref=${ref}&reason=${encodeURIComponent(result.failureReason || 'Verification failed')}&purchaseId=${result.id}`);
            }
        } catch (error: any) {
            const defaultUrl = `${env.apiUrl}/api/payments/completion`;
            const clientUrl = process.env.CLIENT_URL || defaultUrl;
            res.redirect(`${clientUrl}?status=error&message=${encodeURIComponent(error.message)}`);
        }
    }

    /**
     * Renders a simple completion page (to avoid localhost redirect issues on mobile).
     */
    static async completion(req: Request, res: Response) {
        const { status, message, purchaseId, ref } = req.query;
        const isSuccess = status === 'success';
        const color = isSuccess ? '#34a853' : '#ea4335';
        const title = isSuccess ? 'Payment Successful' : 'Payment Failed';
        const msg = message || (isSuccess ? 'Your payment has been verified. Redirecting to app...' : 'Something went wrong.');

        // Deep link to return to app
        const deepLink = isSuccess
            ? `etticket://payment/success?purchaseId=${purchaseId}&ref=${ref}`
            : `etticket://payment/failed?reason=${encodeURIComponent(message as string || 'Payment failed')}`;

        res.send(`
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${title}</title>
                    <script>
                        // Auto-redirect to app after 2 seconds
                        setTimeout(function() {
                            window.location.href = '${deepLink}';
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
                        
                        <a href="${deepLink}" style="background: ${color}; color: white; border: none; padding: 16px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; display: block; width: 100%; text-decoration: none; font-size: 16px; box-sizing: border-box;">
                           Return to App
                        </a>
                        <p style="margin-top: 1rem; color: #999; font-size: 13px;">Redirecting automatically in 2 seconds...</p>
                    </div>
                </body>
            </html>
        `);
    }
}
