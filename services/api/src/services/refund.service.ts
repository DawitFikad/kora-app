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
            // We find the 'SETTLED' or 'RELEASED' transaction for this purchase
            const mainTx = refund.purchase.transactions.find(t => t.type === TransactionType.TICKET_PURCHASE);
            if (mainTx) {
                // Deduct from organizer wallet (REVERSAL)
                // We use FinancialService logic but with negative amount or a specialized 'REFUND' type
                const event = await tx.event.findUnique({ where: { id: mainTx.eventId! } });
                const organizerId = event?.organizerId;

                if (organizerId) {
                    const wallet = await tx.organizerWallet.findUnique({ where: { organizerId } });
                    if (wallet) {
                        const amountToDeduct = mainTx.netAmount;

                        await tx.organizerWallet.update({
                            where: { id: wallet.id },
                            data: {
                                availableBalance: { decrement: amountToDeduct }
                            }
                        });

                        await tx.walletLedger.create({
                            data: {
                                walletId: wallet.id,
                                amount: amountToDeduct.negated(),
                                type: TransactionType.REFUND,
                                description: `Refund for purchase ${refund.purchase.paymentRef}`,
                                referenceId: refund.id.toString(),
                                balanceBefore: wallet.availableBalance,
                                balanceAfter: wallet.availableBalance.minus(amountToDeduct)
                            }
                        });
                    }
                }

                // Create a reversal financial transaction
                await tx.financialTransaction.create({
                    data: {
                        type: TransactionType.REFUND,
                        amount: mainTx.amount.negated(),
                        feeAmount: mainTx.feeAmount.negated(),
                        netAmount: mainTx.netAmount.negated(),
                        purchaseId: refund.purchaseId,
                        eventId: mainTx.eventId,
                        status: FinancialStatus.REFUNDED
                    }
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

            // 5. Trigger Notification
            const { NotificationService } = require("./notification.service");
            const { NotificationController } = require("../controllers/notification.controller");
            const { NotificationChannel } = require("@prisma/client");

            const eventTitle = (refund.purchase.metadata as any)?.eventTitle || "your event";
            const message = NotificationController.getTemplate('refund_approved', 'en', {
                eventTitle,
                amount: refund.amount.toString()
            });

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
