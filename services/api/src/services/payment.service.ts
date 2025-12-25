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
            case "CBE_BIRR":
            case "AMOLE":
            case "CHAPA":
                // Real Chapa Integration (Aggregator for all)
                const tx_ref = purchase.paymentRef;
                const return_url = `http://localhost:4000/api/payments/verify-callback?ref=${tx_ref}`;

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
                        title: `Ticket Purchase (${purchase.paymentMethod})`,
                        description: `Payment for Purchase #${purchase.id}`
                    }
                };

                logger.info({ tx_ref, method: purchase.paymentMethod }, "Initializing Chapa payment");

                const isMockMode = !env.chapaSecretKey || env.chapaSecretKey.includes("mock") || env.chapaSecretKey === "your_chapa_secret_key_or_mock";

                if (isMockMode) {
                    logger.warn("Using MOCK Chapa Gateway (Key not configured for live)");
                    checkoutUrl = `${baseUrl}/mock?ref=${tx_ref}`;
                    providerPayload = chapaPayload;
                } else {
                    try {
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

                        // Fallback to Mock if Dev/Test and Auth/Net error
                        // 'development' or 'test' env, or just assume if status is 401
                        const isDev = process.env.NODE_ENV !== 'production';
                        const isAuthOrNetError = error.response?.status === 401 || !error.response || error.code === 'ENOTFOUND';

                        if (isDev && isAuthOrNetError) {
                            logger.warn("Chapa Initialization Failed (Network/Auth). Falling back to MOCK mode.");
                            checkoutUrl = `${baseUrl}/mock?ref=${tx_ref}`;
                            providerPayload = chapaPayload;
                        } else {
                            throw new Error(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
                        }
                    }
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

        // Check for Mock Mode (Key missing or mock, OR ref indicates mock)
        if (env.chapaSecretKey && !env.chapaSecretKey.includes("mock") && env.chapaSecretKey !== "your_chapa_secret_key_or_mock" && ["CHAPA", "TELEBIRR", "CBE_BIRR", "AMOLE"].includes(purchase.paymentMethod)) {
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

                // Fallback to Mock if Dev/Test and Auth/Net error
                const isDev = process.env.NODE_ENV !== 'production';
                const isAuthOrNetError = error.response?.status === 401 || !error.response || error.code === 'ENOTFOUND';

                if (isDev && isAuthOrNetError) {
                    logger.warn("Chapa Verification Failed (Network/Auth). Falling back to MOCK verification.");
                    // Mock Verification Logic: Success unless ref contains 'fail'
                    isValid = !paymentRef.includes("fail") && !paymentRef.includes("FAIL");
                } else {
                    isValid = false;
                }
            }
        } else {
            // Mock Verification Logic
            // If manual mock or key is mock, usage simple logic:
            // If ref contains 'fail', it fails. Else success.
            isValid = !paymentRef.includes("fail") && !paymentRef.includes("FAIL");
            if (isValid) logger.info(`Mock verification success for ${paymentRef}`);
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
