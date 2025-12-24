import { prisma } from "../lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { TicketService } from "./ticket.service";
import crypto from "crypto";
import { env } from "../config/env";
import logger from "../utils/logger";
import axios from "axios";

export class PaymentService {
    /**
     * Initializes payment with the selected provider.
     * Simulates provider-specific payload generation.
     */
    static async initializePayment(purchaseId: number) {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { user: { include: { profile: true } } }
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
                    appid: env.teleBirrMerchantAppId,
                    fabricAppId: env.teleBirrFabricAppId,
                    shortCode: env.teleBirrShortCode,
                    outTradeNo: purchase.paymentRef,
                    receiver: "PLATFORM_MERCHANT_ID", // This might also come from env if it varies
                    nonce: crypto.randomBytes(16).toString("hex"),
                    timestamp: Date.now().toString(),
                    // In a real implementation, you would sign this payload using your private key (env.teleBirrPrivateKey)
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

            case "CHAPA":
                // Real Chapa Integration
                try {
                    const tx_ref = purchase.paymentRef;
                    const return_url = `http://localhost:4000/api/payments/verify-callback?ref=${tx_ref}`; // We will add this route

                    const chapaPayload = {
                        amount: purchase.totalAmount.toString(),
                        currency: "ETB",
                        email: purchase.user.email || "no-email@et-ticket.com",
                        first_name: purchase.user.profile?.fullName?.split(" ")[0] || "Customer",
                        last_name: purchase.user.profile?.fullName?.split(" ").slice(1).join(" ") || "Valued",
                        tx_ref: tx_ref,
                        callback_url: `http://localhost:4000/api/payments/webhook`,
                        return_url: return_url,
                        customization: {
                            title: "Ticket Purchase",
                            description: `Payment for Purchase #${purchase.id}`
                        }
                    };

                    logger.info({ tx_ref }, "Initializing Chapa payment");
                    const response = await axios.post("https://api.chapa.co/v1/transaction/initialize", chapaPayload, {
                        headers: {
                            Authorization: `Bearer ${env.chapaSecretKey}`,
                            "Content-Type": "application/json"
                        }
                    });

                    if (response.data.status === 'success') {
                        checkoutUrl = response.data.data.checkout_url;
                        providerPayload = chapaPayload;
                    } else {
                        throw new Error("Chapa initialization failed: " + response.data.message);
                    }
                } catch (error: any) {
                    logger.error("Chapa Error:", error.response?.data || error.message);
                    // Fallback to mock if real fails (or just throw? User asked for real so let's throw if config is wrong but maybe fallback for safety if key is invalid? No, explicit failure is better for debugging)
                    // throw new Error("Payment Provider Error");

                    // For smoother dev experience if key is invalid, we could revert to mock... 
                    // But user said "mock to real", so let's stick to real.
                    throw new Error(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
                }
                break;

            default:
                // Keep other providers as mock for now because we don't have keys
                checkoutUrl = `${baseUrl}/mock?ref=${purchase.paymentRef}`;
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

        if (purchase.paymentMethod === "CHAPA") {
            try {
                const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${paymentRef}`, {
                    headers: { Authorization: `Bearer ${env.chapaSecretKey}` }
                });

                if (response.data.status === 'success') {
                    isValid = true;
                    externalRef = response.data.data.reference; // Chapa transaction ID
                    logger.info(`Chapa verification success for ${paymentRef}`);
                } else {
                    isValid = false;
                    logger.warn(`Chapa verification failed for ${paymentRef}: Status ${response.data.status}`);
                }
            } catch (error: any) {
                logger.error(`Chapa verification error for ${paymentRef}`, error.message);
                // If network error, maybe don't fail immediately? But for now, safe to fail.
                isValid = false;
            }
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
