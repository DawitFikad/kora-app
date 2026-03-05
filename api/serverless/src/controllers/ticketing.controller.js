"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketingController = void 0;
const lock_service_1 = require("../services/lock.service");
const ticket_service_1 = require("../services/ticket.service");
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class TicketingController {
    /**
     * Reserves seats or capacity and creates a PENDING purchase.
     */
    static async reserve(req, res) {
        try {
            const { eventId, tierId, quantity, seatNumbers, paymentMethod } = req.body;
            const userId = req.user.userId;
            const event = await prisma_1.prisma.event.findUnique({
                where: { id: eventId },
                include: { tiers: { where: { id: tierId } } }
            });
            if (!event || event.status !== "APPROVED") {
                return res.status(404).json({ error: "Event not found or not active" });
            }
            const tier = event.tiers[0];
            if (!tier)
                return res.status(404).json({ error: "Ticket tier not found" });
            const now = new Date();
            if (tier.salesStart && now < tier.salesStart) {
                return res.status(400).json({ error: "Ticket sales for this tier have not started yet" });
            }
            if (tier.salesEnd && now > tier.salesEnd) {
                return res.status(400).json({ error: "Ticket sales for this tier have ended" });
            }
            if (tier.maxPerUser && tier.maxPerUser > 0) {
                const userTicketCount = await prisma_1.prisma.ticket.count({
                    where: { userId, tierId }
                });
                const pendingPurchases = await prisma_1.prisma.purchase.findMany({
                    where: { userId, status: client_1.PaymentStatus.PENDING },
                    select: { metadata: true }
                });
                const pendingQty = pendingPurchases.reduce((sum, purchase) => {
                    const metadata = purchase.metadata;
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
            if (event.eventType === client_1.EventType.SEAT_MAP) {
                if (!seatNumbers || seatNumbers.length !== quantity) {
                    return res.status(400).json({ error: "Seat numbers required for this event" });
                }
                const results = await Promise.all(seatNumbers.map((seat) => lock_service_1.LockService.lockSeat(eventId, tierId, seat, userId)));
                if (results.some(r => !r)) {
                    return res.status(409).json({ error: "One or more seats are already reserved" });
                }
            }
            else {
                const soldQty = await prisma_1.prisma.ticket.count({ where: { tierId } });
                const available = tier.capacity - soldQty;
                const success = await lock_service_1.LockService.reserveCapacity(eventId, tierId, userId, quantity, available);
                if (!success) {
                    return res.status(409).json({ error: "Not enough capacity available" });
                }
            }
            // 2. Create PENDING Purchase
            const purchase = await prisma_1.prisma.purchase.create({
                data: {
                    userId,
                    status: client_1.PaymentStatus.PENDING,
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Gets logged-in user's tickets.
     */
    static async getMyTickets(req, res) {
        try {
            const userId = req.user.userId;
            const tickets = await ticket_service_1.TicketService.getUserTickets(userId);
            res.json(tickets);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Admin: Manually invalidates a ticket.
     */
    static async invalidate(req, res) {
        try {
            const { ticketId } = req.params;
            const { reason } = req.body;
            const ticket = await ticket_service_1.TicketService.invalidateTicket(ticketId, reason);
            res.json({ success: true, data: ticket });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.TicketingController = TicketingController;
