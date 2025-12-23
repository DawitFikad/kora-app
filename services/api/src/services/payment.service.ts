import { prisma } from "../lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { TicketService } from "./ticket.service";
import crypto from "crypto";

export class PaymentService {
    /**
     * Initializes payment with the selected provider.
     * Simulates provider-specific payload generation.
     */
    static async initializePayment(purchaseId: number) {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId }
        });

        if (!purchase) throw new Error("Purchase not found");

        // Allow re-initialization if PENDING or FAILED (retry)
        if (purchase.status !== PaymentStatus.PENDING && purchase.status !== PaymentStatus.FAILED) {
            throw new Error(`Cannot initialize payment for purchase in status: ${purchase.status}`);
        }

        // If it was FAILED, reset to PENDING for the retry attempt
        if (purchase.status === PaymentStatus.FAILED) {
            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { status: PaymentStatus.PENDING, failureReason: null }
            });
        }

        const baseUrl = "http://localhost:4000/api/payments/mock-gateways";
        let checkoutUrl = "";
        let providerPayload: any = {};

        switch (purchase.paymentMethod) {
            case "TELEBIRR":
                // TeleBirr usually requires an encrypted/signed payload
                providerPayload = {
                    appId: "MOCK_APP_ID",
                    outTradeNo: purchase.paymentRef,
                    receiver: "PLATFORM_MERCHANT_ID",
                    nonce: crypto.randomBytes(16).toString("hex"),
                    timestamp: Date.now().toString()
                };
                checkoutUrl = `${baseUrl}/telebirr?ref=${purchase.paymentRef}&payload=${Buffer.from(JSON.stringify(providerPayload)).toString('base64')}`;
                break;

            case "CBE_BIRR":
                // CBE Birr often uses a different merchant ID and callback structure
                providerPayload = {
                    merchantId: "CBE_MOCK_123",
                    orderId: purchase.paymentRef,
                    amount: purchase.totalAmount.toString(),
                    currency: "ETB"
                };
                checkoutUrl = `${baseUrl}/cbe?ref=${purchase.paymentRef}&data=${Buffer.from(JSON.stringify(providerPayload)).toString('base64')}`;
                break;

            case "AMOLE":
                checkoutUrl = `${baseUrl}/amole?ref=${purchase.paymentRef}`;
                break;

            default:
                checkoutUrl = `${baseUrl}/chapa?ref=${purchase.paymentRef}`;
        }

        return {
            checkoutUrl,
            paymentRef: purchase.paymentRef,
            amount: purchase.totalAmount,
            method: purchase.paymentMethod,
            mockPayload: providerPayload
        };
    }

    /**
     * Verifies payment status and issues tickets on success.
     * Simulates signature/decryption verification for providers.
     */
    static async verifyPayment(paymentRef: string, externalRef?: string, rawProviderData?: string) {
        const purchase = await prisma.purchase.findUnique({
            where: { paymentRef }
        });

        if (!purchase) throw new Error("Purchase record not found");
        if (purchase.status === PaymentStatus.SUCCESS) return purchase;

        console.log(`[PaymentService] Verifying ${purchase.paymentMethod} payment for Ref: ${paymentRef}`);

        // Mock verification logic
        let isValid = !paymentRef.includes("fail");

        // Simulate provider-specific verification logic
        if (purchase.paymentMethod === "TELEBIRR" && rawProviderData) {
            console.log("[Mock] Decrypting TeleBirr response...");
            // In real app: decrypt(rawProviderData, telebirrPublicKey)
        }

        if (isValid) {
            const updatedPurchase = await prisma.purchase.update({
                where: { id: purchase.id },
                data: {
                    status: PaymentStatus.SUCCESS,
                    externalRef: externalRef || `EXT-${purchase.paymentMethod}-${Date.now()}`
                }
            });

            // Trigger Ticket Issuance
            await TicketService.completePurchase(updatedPurchase.id);

            // Record Financial Transaction & Update Organizer Wallet
            try {
                const { FinancialService } = require("./financial.service");
                await FinancialService.recordTicketPurchase(updatedPurchase.id);
            } catch (error) {
                console.error("[PaymentService] Failed to record financial transaction:", error);
                // Note: In production, we might want to queue this for retry to ensure ledger consistency
            }

            return updatedPurchase;
        } else {
            return prisma.purchase.update({
                where: { id: purchase.id },
                data: {
                    status: PaymentStatus.FAILED,
                    failureReason: "Payment verification failed or was cancelled"
                }
            });
        }
    }
}
