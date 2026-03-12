import { prisma } from "../lib/prisma";
import { FinancialStatus, RefundStatus, RefundReason, TransactionType, TicketStatus } from "@prisma/client";
import { FinancialService } from "./financial.service";

export class RefundService {
    /**
     * Users request a refund for a purchase.
     */
    static async requestRefund(userId: number, purchaseId: number, reason: RefundReason, description?: string) {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { tickets: true }
        });

        if (!purchase || purchase.userId !== userId) {
            throw new Error("Purchase not found or access denied.");
        }

        if (purchase.status !== "SUCCESS") {
            throw new Error("Only successful purchases can be refunded.");
        }

        // Check window (e.g., within 48 hours of purchase or before event starts)
        const eventId = (purchase.metadata as any)?.eventId;
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (event && new Date() > new Date(event.dateTime)) {
            throw new Error("Cannot refund after the event has started.");
        }

        return await prisma.refund.create({
            data: {
                purchaseId,
                amount: purchase.totalAmount,
                reason,
                description,
                status: RefundStatus.PENDING
            }
        });
    }

    /**
     * Admin or Organizer (if permitted) approves the refund.
     * Refund precedence (per blueprint §8): consume available first, then pending, then debt flag.
     */
    static async approveRefund(refundId: number, processedBy: number) {
        return await prisma.$transaction(async (tx) => {
            const refund = await tx.refund.findUnique({
                where: { id: refundId },
                include: { purchase: { include: { transactions: true, tickets: true } } }
            });

            if (!refund || refund.status !== RefundStatus.PENDING) {
                throw new Error("Refund not found or already processed.");
            }

            // 1. Mark Refund as APPROVED
            const updatedRefund = await tx.refund.update({
                where: { id: refundId },
                data: { status: RefundStatus.APPROVED, processedBy }
            });

            // 2. Reverse Financial Transactions & Organizer Wallet
            const mainTx = refund.purchase.transactions.find(t => t.type === TransactionType.TICKET_PURCHASE);
            let refundTxId: number | undefined;

            if (mainTx) {
                const event = await tx.event.findUnique({ where: { id: mainTx.eventId! } });
                const organizerId = event?.organizerId;

                if (organizerId) {
                    const wallet = await tx.organizerWallet.findUnique({ where: { organizerId } });
                    if (wallet) {
                        const amountToDeduct = Number(mainTx.netAmount);
                        const available = Number(wallet.availableBalance);
                        const pending = Number(wallet.pendingBalance);

                        // Precedence: available → pending → debt flag
                        const deductFromAvailable = Math.min(amountToDeduct, available);
                        const remaining = amountToDeduct - deductFromAvailable;
                        const deductFromPending = Math.min(remaining, pending);
                        const debtAmount = remaining - deductFromPending;

                        const walletBalanceBefore = wallet.availableBalance;
                        const walletBalanceAfter = Number(wallet.availableBalance) - deductFromAvailable;

                        await tx.organizerWallet.update({
                            where: { id: wallet.id },
                            data: {
                                availableBalance: { decrement: deductFromAvailable },
                                pendingBalance: { decrement: deductFromPending },
                            }
                        });

                        // Wallet ledger entry for the reversal
                        await tx.walletLedger.create({
                            data: {
                                walletId: wallet.id,
                                amount: -amountToDeduct,
                                type: TransactionType.REFUND,
                                description: `Refund reversal for purchase ${refund.purchase.paymentRef}${debtAmount > 0 ? ` (debt: ETB ${debtAmount.toFixed(2)})` : ''}`,
                                referenceId: refund.id.toString(),
                                balanceBefore: walletBalanceBefore,
                                balanceAfter: walletBalanceAfter,
                            }
                        });

                        // If organizer doesn't have enough funds, flag in metadata
                        if (debtAmount > 0) {
                            const currentMeta = (wallet as any).metadata || {};
                            await tx.organizerWallet.update({
                                where: { id: wallet.id },
                                data: {
                                    // Store debt flag in a separate metadata-like note via ledger description
                                    // For now use an ADJUSTMENT entry to record the debt exposure
                                }
                            });
                            // Create an ADJUSTMENT entry tracking the outstanding debt
                            await tx.walletLedger.create({
                                data: {
                                    walletId: wallet.id,
                                    amount: -debtAmount,
                                    type: TransactionType.ADJUSTMENT,
                                    description: `DEBT EXPOSURE: Refund exceeded wallet balance by ETB ${debtAmount.toFixed(2)} for purchase ${refund.purchase.paymentRef}. Organizer owes platform.`,
                                    referenceId: `DEBT-${refund.id}`,
                                    balanceBefore: 0,
                                    balanceAfter: -debtAmount,
                                }
                            });
                        }
                    }
                }

                // Create a reversal financial transaction
                const refundFinTx = await tx.financialTransaction.create({
                    data: {
                        type: TransactionType.REFUND,
                        amount: mainTx.amount.negated(),
                        feeAmount: mainTx.feeAmount.negated(),
                        netAmount: mainTx.netAmount.negated(),
                        purchaseId: refund.purchaseId,
                        eventId: mainTx.eventId,
                        status: FinancialStatus.REFUNDED,
                        metadata: {
                            refundId: refund.id,
                            originalTxId: mainTx.id,
                            reason: refund.reason,
                        }
                    }
                });
                refundTxId = refundFinTx.id;

                // Update refund record to link to the financial transaction
                await tx.refund.update({
                    where: { id: refundId },
                    data: { transactionId: refundFinTx.id }
                });
            }

            // 3. Mark Tickets as CANCELLED
            await tx.ticket.updateMany({
                where: { purchaseId: refund.purchaseId },
                data: { status: TicketStatus.CANCELLED }
            });

            // 4. Update Purchase Status
            await tx.purchase.update({
                where: { id: refund.purchaseId },
                data: { status: "REFUNDED" }
            });

            // 5. Record Settlement Outflow (non-blocking, outside tx to avoid deadlock)
            setImmediate(async () => {
                try {
                    const { ReconciliationService } = require("./reconciliation.service");
                    await ReconciliationService.recordAutomaticRefundSettlement({
                        purchaseId: refund.purchaseId,
                        amount: Number(refund.amount),
                        financialTransactionId: refundTxId,
                        referenceId: `REFUND-${refund.id}`,
                        metadata: { reason: refund.reason, refundId: refund.id },
                    });
                } catch (e) { console.error("Failed to record refund settlement entry:", e); }
            });

            // 6. Trigger User Notification
            const { NotificationService } = require("./notification.service");
            const { NotificationChannel } = require("@prisma/client");

            const eventTitle = (refund.purchase.metadata as any)?.eventTitle || "your event";
            const message = `Your refund of ETB ${refund.amount} for "${eventTitle}" has been approved.`;

            NotificationService.notifyUser(refund.purchase.userId, {
                content: message,
                channels: [NotificationChannel.SMS]
            }).catch(() => { });

            return updatedRefund;
        });
    }

    /**
     * Admin rejects a refund request.
     */
    static async rejectRefund(refundId: number, processedBy: number, failureReason: string) {
        const refund = await prisma.refund.update({
            where: { id: refundId },
            data: {
                status: RefundStatus.REJECTED,
                processedBy,
                failureReason
            },
            include: { purchase: true }
        });

        // Trigger Notification
        const { NotificationService } = require("./notification.service");
        const { NotificationChannel } = require("@prisma/client");

        NotificationService.notifyUser(refund.purchase.userId, {
            content: `Your refund request was rejected: ${failureReason}`,
            channels: [NotificationChannel.SMS]
        }).catch(() => { });

        return refund;
    }
}
