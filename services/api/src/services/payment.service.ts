import { prisma } from "../lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { TicketService } from "./ticket.service";
import crypto from "crypto";
import { env } from "../config/env";
import logger from "../utils/logger";
import { ChapaProvider } from "./providers/chapa.provider";
import { TelebirrProvider } from "./providers/telebirr.provider";

function isTruthy(value: string | undefined): boolean {
    const normalized = (value || "").trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
}

const RESERVED_EMAIL_DOMAINS = new Set([
    "example.com",
    "example.org",
    "example.net",
    "invalid",
    "localhost",
    "test",
]);

function isValidEmailFormat(email: string): boolean {
    const trimmed = email.trim();
    if (!trimmed || trimmed.length > 254) return false;
    const parts = trimmed.split("@");
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain) return false;
    if (local.length > 64) return false;
    if (local.includes("..") || domain.includes("..")) return false;
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return false;
    return true;
}

function isUsablePayerEmail(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmailFormat(normalized)) return false;
    const domain = normalized.split("@")[1];
    if (!domain) return false;
    if (RESERVED_EMAIL_DOMAINS.has(domain)) return false;
    return true;
}

function getSafeChapaPayerEmail(candidate: string | null | undefined, txRef?: string): string {
    const normalizedCandidate = (candidate || "").trim().toLowerCase();
    if (isUsablePayerEmail(normalizedCandidate)) return normalizedCandidate;

    const envCandidate = (process.env.CHAPA_TEST_EMAIL || "").trim().toLowerCase();
    if (isUsablePayerEmail(envCandidate)) return envCandidate;

    const suffixSource = (txRef || Date.now().toString()).toString();
    const suffix = suffixSource.replace(/[^a-z0-9]/gi, "").slice(-12).toLowerCase() || "payer";
    return `payer+${suffix}@gmail.com`;
}

export class PaymentService {
    private static allowTelebirrDevFallback(): boolean {
        if (isTruthy(process.env.ALLOW_TELEBIRR_DEV_FALLBACK)) return true;
        return (process.env.NODE_ENV || "development") !== "production";
    }

    /**
     * Initializes payment with the selected provider.
     */
    static async initializePayment(purchaseId: number, requestBaseUrl?: string) {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: {
                user: { include: { profile: true } }
            }
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

        // Prefer request-origin URL so callbacks match the current client runtime.
        const baseUrl = requestBaseUrl || env.apiUrl;
        const clientUrl = process.env.CLIENT_URL || `${baseUrl}/api/payments/completion`;
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

                    if (isTelebirrConfigured || TelebirrProvider.isTestMode()) {
                        logger.info({ tx_ref }, "Initializing Telebirr payment");

                        try {
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
                        } catch (telebirrError: any) {
                            if (!this.allowTelebirrDevFallback()) {
                                throw telebirrError;
                            }

                            logger.warn(
                                { purchaseId: purchase.id, error: telebirrError?.message },
                                "Telebirr initialize failed in dev; falling back to verify callback URL"
                            );
                            checkoutUrl = return_url;
                            providerPayload = {
                                fallback: "DEV_VERIFY_CALLBACK",
                                reason: telebirrError?.message,
                            };
                        }
                    } else {
                        if (this.allowTelebirrDevFallback()) {
                            logger.warn(
                                { purchaseId: purchase.id },
                                "Telebirr not configured; using dev fallback checkout URL"
                            );
                            checkoutUrl = return_url;
                            providerPayload = { fallback: "DEV_NOT_CONFIGURED" };
                            break;
                        }
                        throw new Error("Telebirr payment provider is not configured.");
                    }
                    break;

                case "CHAPA":
                case "CBE_BIRR":
                case "AMOLE":
                    // Use Chapa as aggregator for multiple payment methods
                    if (ChapaProvider.isConfigured()) {
                        logger.info({ tx_ref, method: purchase.paymentMethod }, "Initializing Chapa payment");

                        const fullName = purchase.user.profile?.fullName || "";
                        const nameParts = fullName.trim().split(/\s+/);
                        const firstName = nameParts[0] || "Customer";
                        const lastName = nameParts.slice(1).join(" ") || "Valued";

                        const chapaResult = await ChapaProvider.initialize({
                            amount: Number(purchase.totalAmount),
                            email: getSafeChapaPayerEmail(purchase.user.email, tx_ref),
                            firstName,
                            lastName,
                            txRef: tx_ref,
                            callbackUrl: callback_url,
                            returnUrl: return_url,
                            customization: {
                                title: "ET-Tickets Pay",
                                description: `Ticket Purchase ${purchase.id}`,
                            },
                            meta: {
                                purchaseId: purchase.id,
                                paymentMethod: purchase.paymentMethod,
                            },
                        });

                        checkoutUrl = chapaResult.checkoutUrl;
                        providerPayload = { txRef: chapaResult.txRef };
                    } else {
                        throw new Error("Chapa payment provider is not configured.");
                    }
                    break;

                default:
                    throw new Error(`Unsupported payment method: ${purchase.paymentMethod}`);
            }

            return {
                checkoutUrl,
                paymentRef: purchase.paymentRef,
                amount: Number(purchase.totalAmount),
                method: purchase.paymentMethod,
                mockPayload: providerPayload
            };
        } catch (error: any) {
            logger.error({ error: error.message, purchaseId }, "Payment initialization error");
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
        if (purchase.status === PaymentStatus.SUCCESS) {
            logger.info(
                { paymentRef, purchaseId: purchase.id, status: purchase.status },
                "Payment verification replay detected; returning existing success"
            );
            return purchase;
        }

        logger.info({ paymentRef, method: purchase.paymentMethod }, "Verifying payment");

        let isValid = false;
        let verificationResult: any = {};

        try {
            switch (purchase.paymentMethod) {
                case "TELEBIRR":
                    if (TelebirrProvider.isConfigured() || TelebirrProvider.isTestMode()) {
                        try {
                            const result = await TelebirrProvider.verify(paymentRef);
                            isValid = result.success;
                            verificationResult = result;
                        } catch (telebirrVerifyError: any) {
                            if (!this.allowTelebirrDevFallback()) throw telebirrVerifyError;

                            logger.warn(
                                { paymentRef, error: telebirrVerifyError?.message },
                                "Telebirr verify failed in dev; treating as success fallback"
                            );
                            isValid = true;
                            verificationResult = { message: "Development fallback success" };
                            externalRef = externalRef || `DEV-TELEBIRR-${Date.now()}`;
                        }
                    } else {
                        if (this.allowTelebirrDevFallback()) {
                            logger.warn({ paymentRef }, "Telebirr not configured in dev; treating verification as success fallback");
                            isValid = true;
                            verificationResult = { message: "Development fallback success (not configured)" };
                            externalRef = externalRef || `DEV-TELEBIRR-${Date.now()}`;
                            break;
                        }
                        throw new Error("Telebirr provider is not configured for verification");
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
                        throw new Error("Chapa provider is not configured for verification");
                    }
                    break;

                default:
                    throw new Error(`Unsupported payment method: ${purchase.paymentMethod}`);
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

                const metadata = purchase.metadata as any;
                const eventInfo = await prisma.event.findUnique({
                    where: { id: metadata.eventId },
                    select: { title: true, dateTime: true, venue: true }
                });

                await prisma.notificationLog.create({
                    data: {
                        userId: purchase.userId,
                        channel: 'PUSH',
                        recipient: 'APP',
                        title: 'Payment Successful',
                        content: eventInfo
                            ? `Payment successful for "${eventInfo.title}". Your tickets are ready.`
                            : 'Payment successful. Your tickets are ready.',
                        status: 'DELIVERED',
                        metadata: {
                            type: 'BOOKING',
                            purchaseId: purchase.id,
                            eventId: metadata.eventId,
                            tierId: metadata.tierId,
                            quantity: metadata.quantity,
                            eventTitle: eventInfo?.title,
                            eventTime: eventInfo?.dateTime,
                            eventVenue: eventInfo?.venue
                        }
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

                const failedPurchase = await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: verificationResult.message || "Payment verification failed or was cancelled"
                    }
                });

                const metadata = purchase.metadata as any;
                const eventInfo = await prisma.event.findUnique({
                    where: { id: metadata.eventId },
                    select: { title: true, dateTime: true, venue: true }
                });

                await prisma.notificationLog.create({
                    data: {
                        userId: purchase.userId,
                        channel: 'PUSH',
                        recipient: 'APP',
                        title: 'Payment Failed',
                        content: eventInfo
                            ? `Payment failed for "${eventInfo.title}". Please try again.`
                            : 'Payment failed. Please try again.',
                        status: 'DELIVERED',
                        metadata: {
                            type: 'BOOKING',
                            purchaseId: purchase.id,
                            eventId: metadata.eventId,
                            tierId: metadata.tierId,
                            quantity: metadata.quantity,
                            eventTitle: eventInfo?.title,
                            eventTime: eventInfo?.dateTime,
                            eventVenue: eventInfo?.venue,
                            reason: failedPurchase.failureReason
                        }
                    }
                });

                return failedPurchase;
            }
        } catch (error: any) {
            logger.error({ error: error.message, paymentRef }, "Payment verification error");
            throw error;
        }
    }

    static validateChapaWebhook(signature: string, payload: string): boolean {
        return ChapaProvider.validateWebhook(signature, payload);
    }

    /**
     * Automated reconciliation for payments that are stuck in PENDING.
     * Checks purchases created in the last 2 hours that are still PENDING.
     */
    static async reconcileStuckPayments() {
        logger.info("Starting automated payment reconciliation...");

        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);

        const stuckPurchases = await prisma.purchase.findMany({
            where: {
                status: PaymentStatus.PENDING,
                createdAt: {
                    gte: twoHoursAgo,
                    lte: fifteenMinutesAgo
                }
            },
            take: 20 // Batch processing
        });

        if (stuckPurchases.length === 0) {
            logger.info("No stuck payments found for reconciliation.");
            return;
        }

        logger.info({ count: stuckPurchases.length }, "Found stuck payments, processing...");

        for (const purchase of stuckPurchases) {
            try {
                logger.info({ paymentRef: purchase.paymentRef }, "Reconciling stuck payment");
                await this.verifyPayment(purchase.paymentRef);
            } catch (error: any) {
                logger.error({ error: error.message, paymentRef: purchase.paymentRef }, "Reconciliation attempt failed");
            }
        }
    }
}

