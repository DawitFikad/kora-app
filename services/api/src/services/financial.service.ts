import { prisma } from "../lib/prisma";
import { FinancialStatus, TransactionType, PaymentStatus, Prisma } from "@prisma/client";
import { FraudService } from "./fraud.service";

export class FinancialService {
    /**
     * Records a ticket purchase in the financial system.
     * Calculates fees and updates organizer's pending balance.
     */
    static async recordTicketPurchase(purchaseId: number) {
        const transactionResult = await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.findUnique({
                where: { id: purchaseId },
                include: {
                    tickets: {
                        include: {
                            event: {
                                include: {
                                    organizer: {
                                        include: { wallet: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!purchase || purchase.status !== PaymentStatus.SUCCESS) {
                throw new Error("Invalid purchase for financial recording");
            }

            // Group by event to handle multiple events in one purchase (if supported)
            const firstTicket = purchase.tickets[0];
            if (!firstTicket) throw new Error("No tickets found in purchase");

            const event = firstTicket.event;
            const organizer = event.organizer;

            // 1. Calculate Fees
            const amount = purchase.totalAmount;
            let feeAmount = new Prisma.Decimal(0);

            if (event.feeType === "PERCENTAGE") {
                feeAmount = amount.mul(event.feePercentage).div(100);
            } else if (event.feeType === "FIXED") {
                feeAmount = event.feeFixed;
            } else if (event.feeType === "HYBRID") {
                feeAmount = amount.mul(event.feePercentage).div(100).add(event.feeFixed);
            }

            const netAmount = amount.minus(feeAmount);

            // 2. Create Transaction record
            const transaction = await tx.financialTransaction.create({
                data: {
                    status: FinancialStatus.SETTLED,
                    type: TransactionType.TICKET_PURCHASE,
                    amount,
                    feeAmount,
                    netAmount,
                    purchaseId: purchase.id,
                    eventId: event.id,
                    metadata: {
                        ticketsCount: purchase.tickets.length,
                        feeType: event.feeType,
                        feePercentage: event.feePercentage.toString(),
                        feeFixed: event.feeFixed.toString()
                    }
                }
            });

            // 3. Update Organizer Wallet (Pending Balance)
            let wallet = organizer.wallet;
            if (!wallet) {
                wallet = await tx.organizerWallet.create({
                    data: { organizerId: organizer.id }
                });
            }

            const balanceBefore = wallet.pendingBalance;
            const balanceAfter = balanceBefore.add(netAmount);

            await tx.organizerWallet.update({
                where: { id: wallet.id },
                data: { pendingBalance: balanceAfter }
            });

            // 4. Record Ledger Entry
            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: netAmount,
                    type: TransactionType.TICKET_PURCHASE,
                    description: `Ticket purchase for event: ${event.title}`,
                    referenceId: purchase.id.toString(),
                    balanceBefore,
                    balanceAfter
                }
            });

            return { transaction, purchase, event };
        });

        // Trigger Fraud Analysis AFTER commit
        FraudService.analyzePurchase(purchaseId).catch(err => console.error("Purchase fraud analysis failed:", err));

        // Trigger Notification
        const { NotificationService } = require("./notification.service");
        const { NotificationController } = require("../controllers/notification.controller");
        const { NotificationChannel } = require("@prisma/client");

        NotificationService.notifyUser(transactionResult.purchase.userId, {
            content: NotificationController.getTemplate('confirm_purchase', 'en', {
                eventTitle: transactionResult.event.title
            }),
            channels: [NotificationChannel.SMS]
        }).catch((err: any) => console.error("Purchase notification failed:", err));

        return transactionResult.transaction;
    }

    /**
     * Releases funds from pending to available balance for an event.
     * Typically called when event is COMPLETED.
     */
    static async releaseEventFunds(eventId: number) {
        return await prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({
                where: { id: eventId },
                include: {
                    organizer: {
                        include: { wallet: true }
                    },
                    transactions: {
                        where: {
                            type: TransactionType.TICKET_PURCHASE,
                            status: FinancialStatus.SETTLED
                        }
                    }
                }
            });

            if (!event || !event.organizer.wallet) {
                throw new Error("Event or wallet not found");
            }

            const wallet = event.organizer.wallet;

            // Calculate total net amount for this event still in pending
            const totalNetToRelease = event.transactions.reduce(
                (sum: Prisma.Decimal, t: any) => sum.add(t.netAmount),
                new Prisma.Decimal(0)
            );

            if (totalNetToRelease.isZero()) return;

            const pendingBefore = wallet.pendingBalance;
            const availableBefore = wallet.availableBalance;

            const pendingAfter = pendingBefore.minus(totalNetToRelease);
            const availableAfter = availableBefore.add(totalNetToRelease);

            await tx.organizerWallet.update({
                where: { id: wallet.id },
                data: {
                    pendingBalance: pendingAfter,
                    availableBalance: availableAfter
                }
            });

            // Record Ledger Entry
            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: totalNetToRelease,
                    type: TransactionType.ADJUSTMENT,
                    description: `Funds released for event: ${event.title}`,
                    referenceId: event.id.toString(),
                    balanceBefore: availableBefore,
                    balanceAfter: availableAfter
                }
            });

            // Mark transactions as released
            await tx.financialTransaction.updateMany({
                where: {
                    eventId: event.id,
                    type: TransactionType.TICKET_PURCHASE,
                    status: FinancialStatus.SETTLED
                },
                data: { status: FinancialStatus.RELEASED }
            });
        });
    }

    static async getOrganizerWallet(organizerId: number) {
        let wallet = await prisma.organizerWallet.findUnique({
            where: { organizerId },
            include: {
                ledgerEntries: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!wallet) {
            wallet = await prisma.organizerWallet.create({
                data: { organizerId },
                include: {
                    ledgerEntries: true
                }
            });
        }

        return wallet;
    }
}
