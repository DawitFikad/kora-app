import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";

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
            const { paymentRef, status, externalRef } = req.body;
            // In a real app, verify signature here
            if (status === "SUCCESS") {
                await PaymentService.verifyPayment(paymentRef, externalRef);
            }
            res.json({ received: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Mock Payment Gateway Redirect (Simulates the provider UI)
     */
    static async mockGateway(req: Request, res: Response) {
        const { ref } = req.query;
        const provider = req.path.split("/").pop(); // chapa, telebirr, etc.

        res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5;">
                    <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
                        <h2 style="color: #1a73e8; margin-top: 0;">EtTicket Mock Payment</h2>
                        <p>You are paying via <strong>${provider?.toUpperCase()}</strong></p>
                        <p>Reference: <code>${ref}</code></p>
                        
                        <div style="margin: 2rem 0;">
                            <button onclick="pay('SUCCESS')" style="background: #34a853; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">Simulate Success</button>
                            <button onclick="pay('FAIL')" style="background: #ea4335; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Simulate Failure</button>
                        </div>
                    </div>

                    <script>
                        async function pay(status) {
                            const ref = "${ref}";
                            if (status === 'SUCCESS') {
                                // Simulate calling our verify endpoint
                                await fetch('/api/payments/verify', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ paymentRef: ref, externalRef: 'EXT-MOCK-' + Date.now() })
                                });
                                alert('Payment Successful! You can close this window.');
                            } else {
                                alert('Payment Failed.');
                            }
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
    }

    /**
     * Handles the return redirect from Payment Providers.
     */
    /**
     * Handles the return redirect from Payment Providers.
     */
    static async verifyCallback(req: Request, res: Response) {
        try {
            const { ref } = req.query;
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

            if (!ref) {
                res.redirect(`${clientUrl}/payment/callback?status=error&message=Missing+Payment+Reference`);
                return;
            }

            const result = await PaymentService.verifyPayment(ref as string);

            if (result.status === 'SUCCESS') {
                res.redirect(`${clientUrl}/payment/callback?status=success&ref=${ref}&purchaseId=${result.id}`);
            } else {
                res.redirect(`${clientUrl}/payment/callback?status=failed&ref=${ref}&reason=${encodeURIComponent(result.failureReason || 'Verification failed')}&purchaseId=${result.id}`);
            }
        } catch (error: any) {
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            res.redirect(`${clientUrl}/payment/callback?status=error&message=${encodeURIComponent(error.message)}`);
        }
    }
}
