import { prisma } from "../lib/prisma";
import { TicketStatus, PaymentStatus } from "@prisma/client";
import { LockService } from "./lock.service";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export class TicketService {
    /**
     * Completes a purchase and issues tickets after payment is verified.
     */
    static async completePurchase(purchaseId: number) {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { user: true }
        });

        if (!purchase) throw new Error("Purchase not found");
        if (purchase.status !== PaymentStatus.SUCCESS) {
            throw new Error(`Cannot issue tickets for purchase in status: ${purchase.status}`);
        }

        // Check if tickets already exist for this purchase to prevent duplicate issuance
        const existingTicketsCount = await prisma.ticket.count({ where: { purchaseId } });
        if (existingTicketsCount > 0) {
            return { message: "Tickets already issued", purchaseId };
        }

        // Metadata contains: eventId, tierId, quantity, seatNumbers, priceBreakdown
        const metadata = purchase.metadata as any;
        const { eventId, tierId, quantity, seatNumbers, priceBreakdown } = metadata;

        const ticketsData = [];
        const secret = process.env.JWT_SECRET || "et-ticket-qr-secret";
        const generatedCodes: string[] = [];

        // Calculate per-ticket financial snapshots (Point 3)
        // Note: priceBreakdown is for the WHOLE purchase (subtotal for quantity)
        const ticketBasePrice = Number(priceBreakdown.basePrice);
        const ticketCommission = Number(priceBreakdown.commission) / quantity;
        const ticketConvenience = Number(priceBreakdown.convenienceFee) / quantity;
        const ticketDiscount = Number(priceBreakdown.discount || 0) / quantity;

        const organizerNet = ticketBasePrice - ticketCommission - ticketDiscount;
        const platformNet = ticketCommission + ticketConvenience;

        for (let i = 0; i < quantity; i++) {
            const seatNumber = seatNumbers ? seatNumbers[i] : null;
            const ticketId = crypto.randomUUID();
            // Generate short human-readable code (Backup OTP)
            const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
            const ticketCode = `ET-${randomSuffix}`;
            generatedCodes.push(ticketCode);

            const payload = {
                tid: ticketId,
                eid: eventId,
                sid: seatNumber,
                code: ticketCode,
                nonce: crypto.randomBytes(16).toString('hex'),
                iat: Math.floor(Date.now() / 1000)
            };

            const qrPayload = jwt.sign(payload, secret);

            ticketsData.push({
                id: ticketId,
                qrPayload,
                status: TicketStatus.VALID,
                userId: purchase.userId,
                eventId,
                tierId,
                seatNumber,
                purchaseId: purchase.id,
                // Financial Snapshot fields
                basePrice: ticketBasePrice,
                commissionRate: Number(priceBreakdown.commissionRate || 10),
                commissionAmt: ticketCommission,
                convenienceFee: ticketConvenience,
                organizerNet: organizerNet,
                platformNet: platformNet
            });
        }

        // 1. Create tickets
        await prisma.ticket.createMany({
            data: ticketsData
        });

        // 2. Cleanup Redis Locks
        if (seatNumbers && seatNumbers.length > 0) {
            for (const seat of seatNumbers) {
                await LockService.unlockSeat(eventId, tierId, seat);
            }
        } else {
            await LockService.releaseCapacity(eventId, tierId, purchase.userId);
        }

        // 3. Send Confirmation SMS
        try {
            const { NotificationService } = require("./notification.service");
            const { NotificationChannel } = require("@prisma/client");

            await NotificationService.notifyUser(purchase.userId, {
                title: "Tickets Issued",
                content: `Your tickets are ready! Codes: ${generatedCodes.join(', ')}. Use these codes or the QR in app for entry.`,
                channels: [NotificationChannel.SMS]
            });
        } catch (error) {
            console.error("Failed to send ticket confirmation SMS:", error);
        }

        return { purchaseId: purchase.id, ticketCount: quantity, codes: generatedCodes };
    }

    /**
     * Lists tickets owned by a user.
     */
    static async getUserTickets(userId: number) {
        return prisma.ticket.findMany({
            where: { userId },
            include: {
                event: {
                    select: {
                        title: true,
                        dateTime: true,
                        venue: true,
                        coverImage: true
                    }
                },
                tier: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Validates a ticket for entry (QR scan).
     */
    static async useTicket(ticketId: string) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) throw new Error("Ticket not found");
        if (ticket.status !== TicketStatus.VALID) throw new Error(`Ticket is ${ticket.status}`);

        return prisma.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.USED }
        });
    }

    /**
     * Admin: Manually invalidates a ticket (e.g., due to fraud or refund).
     */
    static async invalidateTicket(ticketId: string, reason: string) {
        return prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: "CANCELLED" as any,
                // We could log the reason in an audit table later
            }
        });
    }
}
