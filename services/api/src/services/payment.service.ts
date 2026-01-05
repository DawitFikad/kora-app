import { prisma } from "../lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { TicketService } from "./ticket.service";
import crypto from "crypto";
import { env } from "../config/env";
import logger from "../utils/logger";
import { TelebirrProvider } from "./providers/telebirr.provider";
import { ChapaProvider } from "./providers/chapa.provider";

export class PaymentService {
    /**
     * Initializes payment with the selected provider.
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

        const baseUrl = process.env.API_URL || "http://localhost:4000";
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        let checkoutUrl = "";
        let providerPayload: any = {};

        const tx_ref = purchase.paymentRef;
        const return_url = `${baseUrl}/api/payments/verify-callback?ref=${tx_ref}`;
        const callback_url = `${baseUrl}/api/payments/webhook`;

        try {
            switch (purchase.paymentMethod) {
                case "TELEBIRR":
                    // Check if Telebirr is properly configured
                    const isTelebirrConfigured = !!(
                        env.teleBirrMerchantAppId &&
                        env.teleBirrFabricAppId &&
                        env.teleBirrShortCode &&
                        env.teleBirrAppSecret &&
                        env.teleBirrPrivateKey &&
                        !env.teleBirrMerchantAppId.includes('your_')
                    );

                    if (isTelebirrConfigured) {
                        logger.info({ tx_ref }, "Initializing Telebirr payment");

                        const telebirrResult = await TelebirrProvider.initialize({
                            amount: Number(purchase.totalAmount),
                            orderId: purchase.id.toString(),
                            returnUrl: return_url,
                            notifyUrl: callback_url,
                            subject: `Ticket Purchase #${purchase.id}`,
                            outTradeNo: tx_ref,
                        });

                        checkoutUrl = telebirrResult.checkoutUrl;
                        providerPayload = { prepayId: telebirrResult.prepayId };
                    } else {
                        logger.warn("Telebirr not configured, using mock mode");
                        checkoutUrl = `${baseUrl}/api/payments/mock-gateways/mock?ref=${tx_ref}`;
                    }
                    break;

                case "CHAPA":
                case "CBE_BIRR":
                case "AMOLE":
                    // Use Chapa as aggregator for multiple payment methods
                    if (ChapaProvider.isConfigured()) {
                        logger.info({ tx_ref, method: purchase.paymentMethod }, "Initializing Chapa payment");

                        const chapaResult = await ChapaProvider.initialize({
                            amount: Number(purchase.totalAmount),
                            email: purchase.user.email || "no-email@et-ticket.com",
                            firstName: purchase.user.profile?.fullName?.split(" ")[0] || "Customer",
                            lastName: purchase.user.profile?.fullName?.split(" ").slice(1).join(" ") || "Valued",
                            txRef: tx_ref,
                            callbackUrl: callback_url,
                            returnUrl: return_url,
                            customization: {
                                title: `ET-Tickets - ${purchase.paymentMethod}`,
                                description: `Payment for Purchase #${purchase.id}`,
                            },
                            meta: {
                                purchaseId: purchase.id,
                                paymentMethod: purchase.paymentMethod,
                            },
                        });

                        checkoutUrl = chapaResult.checkoutUrl;
                        providerPayload = { txRef: chapaResult.txRef };
                    } else {
                        logger.warn("Chapa not configured, using mock mode");
                        checkoutUrl = `${baseUrl}/api/payments/mock-gateways/mock?ref=${tx_ref}`;
                    }
                    break;

                default:
                    // Fallback to mock for unsupported payment methods
                    logger.warn({ method: purchase.paymentMethod }, "Unsupported payment method, using mock");
                    checkoutUrl = `${baseUrl}/api/payments/mock-gateways/mock?ref=${tx_ref}`;
            }

            return {
                checkoutUrl,
                paymentRef: purchase.paymentRef,
                amount: purchase.totalAmount,
                method: purchase.paymentMethod,
                mockPayload: providerPayload
            };
        } catch (error: any) {
            logger.error({ error: error.message, purchaseId }, "Payment initialization error");

            // Fallback to mock in development if provider fails
            if (process.env.NODE_ENV !== 'production') {
                logger.warn("Provider initialization failed, falling back to mock mode");
                return {
                    checkoutUrl: `${baseUrl}/api/payments/mock-gateways/mock?ref=${tx_ref}`,
                    paymentRef: purchase.paymentRef,
                    amount: purchase.totalAmount,
                    method: purchase.paymentMethod,
                    mockPayload: {}
                };
            }

            throw error;
        }
    }

    /**
     * Verifies payment status and issues tickets on success.
     */
    static async verifyPayment(paymentRef: string, externalRef?: string, rawProviderData?: string) {
        const purchase = await prisma.purchase.findUnique({
            where: { paymentRef }
        });

        if (!purchase) throw new Error("Purchase record not found");
        if (purchase.status === PaymentStatus.SUCCESS) return purchase;

        logger.info({ paymentRef, method: purchase.paymentMethod }, "Verifying payment");

        let isValid = false;
        let verificationResult: any = {};

        try {
            switch (purchase.paymentMethod) {
                case "TELEBIRR":
                    // Check if Telebirr is configured
                    const isTelebirrConfigured = !!(
                        env.teleBirrMerchantAppId &&
                        !env.teleBirrMerchantAppId.includes('your_')
                    );

                    if (isTelebirrConfigured) {
                        const result = await TelebirrProvider.verify(paymentRef);
                        isValid = result.success;
                        if (result.transactionId) {
                            externalRef = result.transactionId;
                        }
                        verificationResult = result;
                    } else {
                        // Mock verification
                        isValid = !paymentRef.includes("fail") && !paymentRef.includes("FAIL");
                    }
                    break;

                case "CHAPA":
                case "CBE_BIRR":
                case "AMOLE":
                    if (ChapaProvider.isConfigured()) {
                        const result = await ChapaProvider.verify(paymentRef);
                        isValid = result.success;
                        if (result.reference) {
                            externalRef = result.reference;
                        }
                        verificationResult = result;
                    } else {
                        // Mock verification
                        isValid = !paymentRef.includes("fail") && !paymentRef.includes("FAIL");
                    }
                    break;

                default:
                    // Mock verification for other methods
                    isValid = !paymentRef.includes("fail") && !paymentRef.includes("FAIL");
            }

            if (isValid) {
                logger.info({ paymentRef, externalRef }, "Payment verification successful");

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
                    logger.error({ error, purchaseId: purchase.id }, "Failed to record financial transaction");
                }

                return updatedPurchase;
            } else {
                logger.warn({ paymentRef, reason: verificationResult.message }, "Payment verification failed");

                return prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: verificationResult.message || "Payment verification failed or was cancelled"
                    }
                });
            }
        } catch (error: any) {
            logger.error({ error: error.message, paymentRef }, "Payment verification error");

            // In development, fallback to mock verification
            if (process.env.NODE_ENV !== 'production') {
                logger.warn("Provider verification failed, using mock verification");
                isValid = !paymentRef.includes("fail") && !paymentRef.includes("FAIL");

                if (isValid) {
                    const updatedPurchase = await prisma.purchase.update({
                        where: { id: purchase.id },
                        data: {
                            status: PaymentStatus.SUCCESS,
                            externalRef: `MOCK-${Date.now()}`
                        }
                    });

                    await TicketService.completePurchase(updatedPurchase.id);

                    try {
                        const { FinancialService } = require("./financial.service");
                        await FinancialService.recordTicketPurchase(updatedPurchase.id);
                    } catch (err) {
                        logger.error({ err }, "Failed to record financial transaction");
                    }

                    return updatedPurchase;
                }
            }

            throw error;
        }
    }
}
