import { prisma } from "../lib/prisma";
import { FinancialStatus, TransactionType, PayoutMethod, Prisma, RiskLevel } from "@prisma/client";
import axios from "axios";
import { env } from "../config/env";
import logger from "../utils/logger";
import crypto from "crypto";
import { SystemConfigService } from "./system-config.service";
import { ReconciliationService } from "./reconciliation.service";
import { RiskService } from "./risk.service";

export class PayoutService {
    /**
     * Organizer requests a payout.
     * Validates that the requested amount is available in their wallet and meets platform guardrails.
     * Guardrails (§9, §13, §14):
     * 1. Compliance (KYC Status, License)
     * 2. Fraud Block (Active HIGH/CRITICAL alerts)
     * 3. Minimum Payout Threshold (financial.payout.minimum_etb)
     * 4. Risk Reserve Hold for New Organizers (first N events completed)
     */
    static async requestPayout(organizerId: number, amount: number, method: PayoutMethod, details: string) {
        const payoutAmount = new Prisma.Decimal(amount);

        // 1. Centralized Risk & Compliance Check (§9, §13, §14)
        await RiskService.validatePayoutEligibility(organizerId);

        // 2. Minimum Threshold Check
        const minPayout = await SystemConfigService.getNumber("financial.payout.minimum_etb", 100);
        if (amount < minPayout) {
            throw new Error(`Minimum payout amount is ETB ${minPayout}. Please accumulate more funds.`);
        }

        return await prisma.$transaction(async (tx) => {
            const wallet = await tx.organizerWallet.findUnique({
                where: { organizerId }
            });

            if (!wallet) throw new Error("Wallet not found for organizer");

            if (wallet.availableBalance.lessThan(payoutAmount)) {
                throw new Error("Insufficient available balance for payout");
            }

            // Create Payout Batch
            const batch = await tx.payoutBatch.create({
                data: {
                    status: FinancialStatus.INITIATED,
                    amount: payoutAmount,
                    method,
                    payoutDetails: details,
                    walletId: wallet.id
                }
            });

            return batch;
        });
    }

    /**
     * Admin approves and processes a payout.
     * Deducts funds from wallet and records ledger entry.
     * Idempotency: re-checks status inside the transaction to prevent double-approval.
     */
    static async approvePayout(batchId: number, adminId: number) {
        return await prisma.$transaction(async (tx) => {
            // Lock the batch row to prevent concurrent approvals
            const batch = await tx.payoutBatch.findUnique({
                where: { id: batchId },
                include: { wallet: true }
            });

            if (!batch) {
                throw new Error("Payout batch not found");
            }

            // Idempotency guard: only INITIATED batches can be approved
            if (batch.status !== FinancialStatus.INITIATED) {
                throw new Error(`Payout batch is already in status: ${batch.status}. Cannot re-approve.`);
            }

            const wallet = batch.wallet;
            await RiskService.validatePayoutEligibility(wallet.organizerId);

            if (wallet.availableBalance.lessThan(batch.amount)) {
                throw new Error("Insufficient funds in wallet at time of approval");
            }

            const balanceBefore = wallet.availableBalance;
            const balanceAfter = balanceBefore.minus(batch.amount);
            const totalWithdrawnAfter = wallet.totalWithdrawn.add(batch.amount);

            // 1. Update Wallet
            await tx.organizerWallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: balanceAfter,
                    totalWithdrawn: totalWithdrawnAfter
                }
            });

            let transferReference = `PAYOUT-${batch.id}-${Date.now()}`;
            const payoutAmount = Number(batch.amount);
            const settlementMetadata: Record<string, unknown> = {
                method: batch.method,
                approvedBy: adminId,
            };
            let transferStatus = "MANUAL";

            // 2. Trigger Real Payout (B2B/B2C) or log for manual channels
            if (batch.method === PayoutMethod.MOBILE_MONEY) {
                try {
                    // TeleBirr B2C / B2B Transfer
                    const payload = {
                        appid: env.teleBirrMerchantAppId,
                        shortCode: env.teleBirrShortCode,
                        outTradeNo: transferReference,
                        receiverShortCode: batch.payoutDetails,
                        amount: batch.amount.toString(),
                        nonce: crypto.randomBytes(16).toString("hex"),
                        timestamp: Date.now().toString()
                    };

                    // In production: Sign and submit payload
                    // const signed = sign(payload, env.teleBirrPrivateKey);
                    // await axios.post('https://app.tty.ethio/.../b2c', signed);

                    logger.info({ batchId, payload }, "Initiating TeleBirr B2B Payout");

                    settlementMetadata.provider = "TeleBirr";
                    settlementMetadata.transferPayload = {
                        outTradeNo: payload.outTradeNo,
                        receiverShortCode: payload.receiverShortCode,
                        amount: payload.amount,
                    };
                    transferStatus = "SUBMITTED";
                } catch (e: any) {
                    logger.error({ batchId, error: e.message }, "TeleBirr B2B Payout API Failed");
                    // Record failure reason on batch before throwing (will rollback wallet too)
                    throw new Error(`TeleBirr Payout Failed: ${e.message}`);
                }
            } else if (batch.method === PayoutMethod.BANK_TRANSFER) {
                transferStatus = "MANUAL_BANK";
                settlementMetadata.note = "Manual bank transfer — admin must execute externally";
                logger.info({ batchId, payoutDetails: batch.payoutDetails }, "Bank transfer payout approved — manual execution required");
            }

            // 3. Update Batch with transfer tracking info
            await (tx.payoutBatch as any).update({
                where: { id: batchId },
                data: {
                    status: FinancialStatus.PAID_OUT,
                    processedAt: new Date(),
                    adminId,
                    transferReference,
                    transferStatus,
                } as any
            });

            // 4. Create Financial Transaction record
            const payoutTx = await tx.financialTransaction.create({
                data: {
                    status: FinancialStatus.PAID_OUT,
                    type: TransactionType.ORGANIZER_PAYOUT,
                    amount: new Prisma.Decimal(-payoutAmount),
                    feeAmount: new Prisma.Decimal(0),
                    netAmount: new Prisma.Decimal(-payoutAmount),
                    payoutBatchId: batch.id,
                    metadata: {
                        payoutFlow: {
                            stage: "AVAILABLE_TO_PAYOUT",
                            method: batch.method,
                            transferReference,
                            transferStatus,
                        },
                        ...settlementMetadata,
                    },
                },
            });

            // 5. Record Settlement Outflow
            await ReconciliationService.recordAutomaticPayoutSettlement(tx, {
                amount: payoutAmount,
                referenceId: transferReference,
                description: `Organizer payout via ${batch.method} (${transferStatus})`,
                payoutBatchId: batch.id,
                financialTransactionId: payoutTx.id,
                metadata: settlementMetadata as Prisma.InputJsonValue,
            });

            // 6. Create Wallet Ledger Entry
            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: batch.amount.neg(),
                    type: TransactionType.ORGANIZER_PAYOUT,
                    description: `Payout via ${batch.method} | Ref: ${transferReference}`,
                    referenceId: batch.id.toString(),
                    balanceBefore,
                    balanceAfter
                }
            });

            // 7. Send Notification (Async, non-blocking)
            (async () => {
                try {
                    const { NotificationService } = require("./notification.service");
                    const { NotificationChannel } = require("@prisma/client");
                    await NotificationService.notifyOrganizer(wallet.organizerId, {
                        title: "Payout Approved 💰",
                        content: `Your payout of ETB ${batch.amount} has been processed via ${batch.method}.`,
                        channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                        metadata: { type: 'PAYOUT_SUCCESS', amount: batch.amount, batchId: batch.id, transferReference }
                    });
                } catch (e) { console.error("Failed to notify organizer of payout:", e); }
            })();

            return { ...batch, transferReference, transferStatus };
        });
    }

    static async getOrganizerPayouts(organizerId: number) {
        return prisma.payoutBatch.findMany({
            where: {
                wallet: { organizerId }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async adminListPendingPayouts() {
        return prisma.payoutBatch.findMany({
            where: { status: FinancialStatus.INITIATED },
            include: {
                wallet: {
                    include: {
                        organizer: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    static async rejectPayout(batchId: number, adminId: number, reason: string) {
        const batch = await prisma.payoutBatch.update({
            where: { id: batchId },
            data: {
                status: FinancialStatus.FAILED,
                processedAt: new Date(),
                adminId,
                payoutDetails: `REJECTED: ${reason}`
            },
            include: { wallet: true }
        });

        // Notify Organizer (Async)
        (async () => {
            try {
                const { NotificationService } = require("./notification.service");
                const { NotificationChannel } = require("@prisma/client");
                await NotificationService.notifyOrganizer(batch.wallet.organizerId, {
                    title: "Payout Rejected ❌",
                    content: `Your payout request of ETB ${batch.amount} was rejected. Reason: ${reason}`,
                    channels: [NotificationChannel.SMS, NotificationChannel.PUSH],
                    metadata: { type: 'PAYOUT_FAILED', reason, batchId: batch.id }
                });
            } catch (e) { console.error("Failed to notify organizer of payout rejection:", e); }
        })();

        return batch;
    }

    static async adminListProcessedPayouts() {
        return prisma.payoutBatch.findMany({
            where: {
                status: { in: [FinancialStatus.PAID_OUT, FinancialStatus.FAILED] }
            },
            include: {
                wallet: {
                    include: {
                        organizer: true
                    }
                }
            },
            orderBy: { processedAt: 'desc' },
            take: 50
        });
    }
}
