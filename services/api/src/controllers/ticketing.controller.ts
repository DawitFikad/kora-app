import { Request, Response } from "express";
import { LockService } from "../services/lock.service";
import { TicketService } from "../services/ticket.service";
import { prisma } from "../lib/prisma";
import { EventType, PaymentStatus } from "@prisma/client";

export class TicketingController {
    /**
     * Reserves seats or capacity and creates a PENDING purchase.
     */
    static async reserve(req: Request, res: Response) {
        try {
            const { eventId, tierId, quantity, seatNumbers, paymentMethod } = req.body;
            const userId = (req as any).user!.userId;

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: { where: { id: tierId } } }
            });

            if (!event || event.status !== "APPROVED") {
                return res.status(404).json({ error: "Event not found or not active" });
            }

            const tier = event.tiers[0];
            if (!tier) return res.status(404).json({ error: "Ticket tier not found" });

            const now = new Date();
            if (now >= new Date(event.dateTime)) {
                return res.status(400).json({ error: "This event has already ended" });
            }
            if (tier.salesStart && now < tier.salesStart) {
                return res.status(400).json({ error: "Ticket sales for this tier have not started yet" });
            }
            if (tier.salesEnd && now > tier.salesEnd) {
                return res.status(400).json({ error: "Ticket sales for this tier have ended" });
            }

            if (tier.maxPerUser && tier.maxPerUser > 0) {
                const lockTtlSeconds = 300;
                const userTicketCount = await prisma.ticket.count({
                    where: { userId, tierId }
                });

                const pendingPurchases = await prisma.purchase.findMany({
                    where: { userId, status: PaymentStatus.PENDING },
                    select: { metadata: true, createdAt: true }
                });

                const activePendingCutoff = new Date(Date.now() - lockTtlSeconds * 1000);

                const pendingQty = pendingPurchases.reduce((sum, purchase) => {
                    if (purchase.createdAt < activePendingCutoff) return sum;
                    const metadata = purchase.metadata as any;
                    if (metadata?.tierId === tierId) {
                        return sum + (parseInt(metadata?.quantity, 10) || 0);
                    }
                    return sum;
                }, 0);

                if (userTicketCount + pendingQty + quantity > tier.maxPerUser) {
                    return res.status(400).json({
                        error: `Maximum ${tier.maxPerUser} tickets per user for this tier`
                    });
                }
            }

            // 1. Check Availability and Lock (Redis)
            if (event.eventType === EventType.SEAT_MAP) {
                if (!seatNumbers || seatNumbers.length !== quantity) {
                    return res.status(400).json({ error: "Seat numbers required for this event" });
                }
                const results = await Promise.all(
                    seatNumbers.map((seat: string) => LockService.lockSeat(eventId, tierId, seat, userId))
                );
                if (results.some(r => !r)) {
                    return res.status(409).json({ error: "One or more seats are already reserved" });
                }
            } else {
                const soldQty = await prisma.ticket.count({ where: { tierId } });
                const available = tier.capacity - soldQty;
                const success = await LockService.reserveCapacity(eventId, tierId, userId, quantity, available);
                if (!success) {
                    return res.status(409).json({ error: "Not enough capacity available" });
                }
            }

            // 2. Create PENDING Purchase
            const purchase = await prisma.purchase.create({
                data: {
                    userId,
                    status: PaymentStatus.PENDING,
                    totalAmount: tier.price.toNumber() * quantity,
                    paymentRef: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    paymentMethod: paymentMethod || "CHAPA", // Default to Chapa
                    metadata: {
                        eventId,
                        tierId,
                        quantity,
                        seatNumbers: seatNumbers || []
                    }
                }
            });

            res.json({
                message: "Reservation successful.",
                purchaseId: purchase.id,
                paymentRef: purchase.paymentRef,
                amount: purchase.totalAmount
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Gets logged-in user's tickets.
     */
    static async getMyTickets(req: Request, res: Response) {
        try {
            const userId = (req as any).user!.userId;
            const tickets = await TicketService.getUserTickets(userId);
            res.json(tickets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Admin: Manually invalidates a ticket.
     */
    static async invalidate(req: Request, res: Response) {
        try {
            const { ticketId } = req.params;
            const { reason } = req.body;
            const ticket = await TicketService.invalidateTicket(ticketId, reason);
            res.json({ success: true, data: ticket });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
