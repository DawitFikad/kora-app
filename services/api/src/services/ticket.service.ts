import { prisma } from "../lib/prisma";
import { TicketStatus, EventType } from "@prisma/client";
import { LockService } from "./lock.service";
import crypto from "crypto";

export class TicketService {
    /**
     * Generates a secure ticket after payment confirmation.
     */
    static async issueTickets(userId: number, eventId: number, tierId: number, quantity: number, seatNumbers?: string[]) {
        // 1. Create Purchase record
        const purchase = await prisma.purchase.create({
            data: {
                userId,
                totalAmount: 0, // Should be calculated based on tier price
                paymentRef: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                paymentMethod: "MOCK_GATEWAY",
            }
        });

        // 2. Fetch Tier details for pricing
        const tier = await prisma.ticketTier.findUnique({ where: { id: tierId } });
        if (!tier) throw new Error("Ticket tier not found");

        const ticketsData = [];
        for (let i = 0; i < quantity; i++) {
            const seatNumber = seatNumbers ? seatNumbers[i] : null;

            // Generate secure unique payload for QR
            const rawPayload = `${purchase.id}-${userId}-${eventId}-${tierId}-${seatNumber || i}-${crypto.randomBytes(8).toString('hex')}`;
            const qrPayload = crypto.createHash('sha256').update(rawPayload).digest('hex');

            ticketsData.push({
                qrPayload,
                status: TicketStatus.VALID,
                userId,
                eventId,
                tierId,
                seatNumber,
                purchaseId: purchase.id
            });
        }

        // 3. Persist tickets
        const createdTickets = await prisma.ticket.createMany({
            data: ticketsData
        });

        // 4. Update purchase amount
        await prisma.purchase.update({
            where: { id: purchase.id },
            data: { totalAmount: tier.price.toNumber() * quantity }
        });

        // 5. Cleanup Redis Locks
        if (seatNumbers) {
            for (const seat of seatNumbers) {
                await LockService.unlockSeat(eventId, tierId, seat);
            }
        } else {
            await LockService.releaseCapacity(eventId, tierId, userId);
        }

        return { purchaseId: purchase.id, ticketCount: quantity };
    }

    /**
     * Validates a ticket for entry (QR scan).
     */
    static async useTicket(ticketId: string) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true, user: { include: { profile: true } } }
        });

        if (!ticket) throw new Error("Ticket not found");
        if (ticket.status !== TicketStatus.VALID) throw new Error(`Ticket is ${ticket.status}`);

        // Mark as used
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.USED }
        });

        return updatedTicket;
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
}
