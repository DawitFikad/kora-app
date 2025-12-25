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

        // Metadata contains: eventId, tierId, quantity, seatNumbers
        const metadata = purchase.metadata as any;
        const { eventId, tierId, quantity, seatNumbers } = metadata;

        const ticketsData = [];
        const secret = process.env.JWT_SECRET || "et-ticket-qr-secret";

        for (let i = 0; i < quantity; i++) {
            const seatNumber = seatNumbers ? seatNumbers[i] : null;
            const ticketId = crypto.randomUUID();

            // 15. QR Payload (Encrypted / Signed)
            // Requirements: Ticket ID, Event ID, Seat ID (nullable), Expiry, Nonce
            const payload = {
                tid: ticketId,
                eid: eventId,
                sid: seatNumber,
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
                purchaseId: purchase.id
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

        return { purchaseId: purchase.id, ticketCount: quantity };
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
