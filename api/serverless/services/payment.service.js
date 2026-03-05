"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const ticket_service_1 = require("./ticket.service");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
const chapa_provider_1 = require("./providers/chapa.provider");
const telebirr_provider_1 = require("./providers/telebirr.provider");
const RESERVED_EMAIL_DOMAINS = new Set([
    "example.com",
    "example.org",
    "example.net",
    "invalid",
    "localhost",
    "test",
]);
function isValidEmailFormat(email) {
    const trimmed = email.trim();
    if (!trimmed || trimmed.length > 254)
        return false;
    const parts = trimmed.split("@");
    if (parts.length !== 2)
        return false;
    const [local, domain] = parts;
    if (!local || !domain)
        return false;
    if (local.length > 64)
        return false;
    if (local.includes("..") || domain.includes(".."))
        return false;
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local))
        return false;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain))
        return false;
    return true;
}
function isUsablePayerEmail(email) {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmailFormat(normalized))
        return false;
    const domain = normalized.split("@")[1];
    if (!domain)
        return false;
    if (RESERVED_EMAIL_DOMAINS.has(domain))
        return false;
    return true;
}
function getSafeChapaPayerEmail(candidate, txRef) {
    const normalizedCandidate = (candidate || "").trim().toLowerCase();
    if (isUsablePayerEmail(normalizedCandidate))
        return normalizedCandidate;
    const envCandidate = (process.env.CHAPA_TEST_EMAIL || "").trim().toLowerCase();
    if (isUsablePayerEmail(envCandidate))
        return envCandidate;
    const suffixSource = (txRef || Date.now().toString()).toString();
    const suffix = suffixSource.replace(/[^a-z0-9]/gi, "").slice(-12).toLowerCase() || "payer";
    return `payer+${suffix}@gmail.com`;
}
class PaymentService {
    /**
     * Initializes payment with the selected provider.
     */
    static async initializePayment(purchaseId) {
        const purchase = await prisma_1.prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: {
                user: { include: { profile: true } }
            }
        });
        if (!purchase)
            throw new Error("Purchase not found");
        // Allow re-initialization if PENDING or FAILED (retry)
        if (purchase.status !== client_1.PaymentStatus.PENDING && purchase.status !== client_1.PaymentStatus.FAILED) {
            throw new Error(`Cannot initialize payment for purchase in status: ${purchase.status}`);
        }
        // If it was FAILED, reset to PENDING for the retry attempt
        if (purchase.status === client_1.PaymentStatus.FAILED) {
            await prisma_1.prisma.purchase.update({
                where: { id: purchase.id },
                data: { status: client_1.PaymentStatus.PENDING, failureReason: null }
            });
        }
        // Use centralized env.apiUrl
        const baseUrl = env_1.env.apiUrl;
        const clientUrl = process.env.CLIENT_URL || `${baseUrl}/api/payments/completion`;
        let checkoutUrl = "";
        let providerPayload = {};
        const tx_ref = purchase.paymentRef;
        const return_url = `${baseUrl}/api/payments/verify-callback?ref=${tx_ref}`;
        const callback_url = `${baseUrl}/api/payments/webhook`;
        try {
            switch (purchase.paymentMethod) {
                case "TELEBIRR":
                    // Check if Telebirr is properly configured
                    const isTelebirrConfigured = !!(env_1.env.teleBirrMerchantAppId &&
                        env_1.env.teleBirrFabricAppId &&
                        env_1.env.teleBirrShortCode &&
                        env_1.env.teleBirrAppSecret &&
                        env_1.env.teleBirrPrivateKey &&
                        !env_1.env.teleBirrMerchantAppId.includes('your_'));
                    if (isTelebirrConfigured) {
                        logger_1.default.info({ tx_ref }, "Initializing Telebirr payment");
                        const telebirrResult = await telebirr_provider_1.TelebirrProvider.initialize({
                            amount: Number(purchase.totalAmount),
                            orderId: purchase.id.toString(),
                            returnUrl: return_url,
                            notifyUrl: callback_url,
                            subject: `Ticket Purchase #${purchase.id}`,
                            outTradeNo: tx_ref,
                        });
                        checkoutUrl = telebirrResult.checkoutUrl;
                        providerPayload = { prepayId: telebirrResult.prepayId };
                    }
                    else {
                        throw new Error("Telebirr payment provider is not configured.");
                    }
                    break;
                case "CHAPA":
                case "CBE_BIRR":
                case "AMOLE":
                    // Use Chapa as aggregator for multiple payment methods
                    if (chapa_provider_1.ChapaProvider.isConfigured()) {
                        logger_1.default.info({ tx_ref, method: purchase.paymentMethod }, "Initializing Chapa payment");
                        const fullName = purchase.user.profile?.fullName || "";
                        const nameParts = fullName.trim().split(/\s+/);
                        const firstName = nameParts[0] || "Customer";
                        const lastName = nameParts.slice(1).join(" ") || "Valued";
                        const chapaResult = await chapa_provider_1.ChapaProvider.initialize({
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
                    }
                    else {
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
        }
        catch (error) {
            logger_1.default.error({ error: error.message, purchaseId }, "Payment initialization error");
            throw error;
        }
    }
    /**
     * Verifies payment status and issues tickets on success.
     */
    static async verifyPayment(paymentRef, externalRef, rawProviderData) {
        const purchase = await prisma_1.prisma.purchase.findUnique({
            where: { paymentRef }
        });
        if (!purchase)
            throw new Error("Purchase record not found");
        if (purchase.status === client_1.PaymentStatus.SUCCESS)
            return purchase;
        logger_1.default.info({ paymentRef, method: purchase.paymentMethod }, "Verifying payment");
        let isValid = false;
        let verificationResult = {};
        try {
            switch (purchase.paymentMethod) {
                case "TELEBIRR":
                    if (telebirr_provider_1.TelebirrProvider.isConfigured()) {
                        const result = await telebirr_provider_1.TelebirrProvider.verify(paymentRef);
                        isValid = result.success;
                        verificationResult = result;
                    }
                    else {
                        throw new Error("Telebirr provider is not configured for verification");
                    }
                    break;
                case "CHAPA":
                case "CBE_BIRR":
                case "AMOLE":
                    if (chapa_provider_1.ChapaProvider.isConfigured()) {
                        const result = await chapa_provider_1.ChapaProvider.verify(paymentRef);
                        isValid = result.success;
                        if (result.reference) {
                            externalRef = result.reference;
                        }
                        verificationResult = result;
                    }
                    else {
                        throw new Error("Chapa provider is not configured for verification");
                    }
                    break;
                default:
                    throw new Error(`Unsupported payment method: ${purchase.paymentMethod}`);
            }
            if (isValid) {
                logger_1.default.info({ paymentRef, externalRef }, "Payment verification successful");
                const updatedPurchase = await prisma_1.prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: client_1.PaymentStatus.SUCCESS,
                        externalRef: externalRef || `EXT-${purchase.paymentMethod}-${Date.now()}`
                    }
                });
                const metadata = purchase.metadata;
                const eventInfo = await prisma_1.prisma.event.findUnique({
                    where: { id: metadata.eventId },
                    select: { title: true, dateTime: true, venue: true }
                });
                await prisma_1.prisma.notificationLog.create({
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
                await ticket_service_1.TicketService.completePurchase(updatedPurchase.id);
                // Record Financial Transaction & Update Organizer Wallet
                try {
                    const { FinancialService } = require("./financial.service");
                    await FinancialService.recordTicketPurchase(updatedPurchase.id);
                }
                catch (error) {
                    logger_1.default.error({ error, purchaseId: purchase.id }, "Failed to record financial transaction");
                }
                return updatedPurchase;
            }
            else {
                logger_1.default.warn({ paymentRef, reason: verificationResult.message }, "Payment verification failed");
                const failedPurchase = await prisma_1.prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: client_1.PaymentStatus.FAILED,
                        failureReason: verificationResult.message || "Payment verification failed or was cancelled"
                    }
                });
                const metadata = purchase.metadata;
                const eventInfo = await prisma_1.prisma.event.findUnique({
                    where: { id: metadata.eventId },
                    select: { title: true, dateTime: true, venue: true }
                });
                await prisma_1.prisma.notificationLog.create({
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
        }
        catch (error) {
            logger_1.default.error({ error: error.message, paymentRef }, "Payment verification error");
            throw error;
        }
    }
    static validateChapaWebhook(signature, payload) {
        return chapa_provider_1.ChapaProvider.validateWebhook(signature, payload);
    }
    /**
     * Automated reconciliation for payments that are stuck in PENDING.
     * Checks purchases created in the last 2 hours that are still PENDING.
     */
    static async reconcileStuckPayments() {
        logger_1.default.info("Starting automated payment reconciliation...");
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);
        const stuckPurchases = await prisma_1.prisma.purchase.findMany({
            where: {
                status: client_1.PaymentStatus.PENDING,
                createdAt: {
                    gte: twoHoursAgo,
                    lte: fifteenMinutesAgo
                }
            },
            take: 20 // Batch processing
        });
        if (stuckPurchases.length === 0) {
            logger_1.default.info("No stuck payments found for reconciliation.");
            return;
        }
        logger_1.default.info({ count: stuckPurchases.length }, "Found stuck payments, processing...");
        for (const purchase of stuckPurchases) {
            try {
                logger_1.default.info({ paymentRef: purchase.paymentRef }, "Reconciling stuck payment");
                await this.verifyPayment(purchase.paymentRef);
            }
            catch (error) {
                logger_1.default.error({ error: error.message, paymentRef: purchase.paymentRef }, "Reconciliation attempt failed");
            }
        }
    }
}
exports.PaymentService = PaymentService;
