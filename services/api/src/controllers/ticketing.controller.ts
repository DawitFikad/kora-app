import { Request, Response } from "express";
import { LockService } from "../services/lock.service";
import { TicketService } from "../services/ticket.service";
import { prisma } from "../lib/prisma";
import { EventType } from "@prisma/client";

export class TicketingController {
    /**
     * Reserves seats or capacity for a short duration.
     */
    static async reserve(req: Request, res: Response) {
        try {
            const { eventId, tierId, quantity, seatNumbers } = req.body;
            const userId = req.user!.userId;

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: { where: { id: tierId } } }
            });

            if (!event || event.status !== "APPROVED") {
                return res.status(404).json({ error: "Event not found or not active" });
            }

            const tier = event.tiers[0];
            if (!tier) return res.status(404).json({ error: "Ticket tier not found" });

            if (event.eventType === EventType.SEAT_MAP) {
                if (!seatNumbers || seatNumbers.length !== quantity) {
                    return res.status(400).json({ error: "Seat numbers required for this event" });
                }

                // Attempt to lock each seat
                const results = await Promise.all(
                    seatNumbers.map((seat: string) => LockService.lockSeat(eventId, tierId, seat, userId))
                );

                if (results.some(r => !r)) {
                    // Cleanup partially successful locks? (Optional but good)
                    return res.status(409).json({ error: "One or more seats are already reserved" });
                }
            } else {
                // Capacity-based
                // 1. Calculate sold qty from DB
                const soldQty = await prisma.ticket.count({ where: { tierId } });
                const available = tier.capacity - soldQty;

                const success = await LockService.reserveCapacity(eventId, tierId, userId, quantity, available);
                if (!success) {
                    return res.status(409).json({ error: "Not enough capacity available" });
                }
            }

            res.json({ message: "Reservation successful. Complete payment within 5 minutes." });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Confirms purchase after mock payment verification.
     */
    static async confirm(req: Request, res: Response) {
        try {
            const { eventId, tierId, quantity, seatNumbers } = req.body;
            const userId = req.user!.userId;

            // In a real app, we would verify payment gateway webhook/API here.
            // For now, we assume payment is successful.

            const result = await TicketService.issueTickets(userId, eventId, tierId, quantity, seatNumbers);
            res.json({ message: "Payment confirmed. Tickets issued.", ...result });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Gets logged-in user's tickets.
     */
    static async getMyTickets(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const tickets = await TicketService.getUserTickets(userId);
            res.json(tickets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
