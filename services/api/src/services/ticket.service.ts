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

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, dateTime: true, venue: true },
        });

        const ticketsData = [];
        const secret = process.env.JWT_SECRET || "et-ticket-qr-secret";
        const generatedCodes: string[] = [];

        // Calculate per-ticket financial snapshots (Point 3)
        // Note: priceBreakdown is for the WHOLE purchase (subtotal for quantity)
        const ticketBasePrice = Number(priceBreakdown.basePrice);
        const ticketCommission = Number(priceBreakdown.commission) / quantity;
        const ticketConvenience = Number(priceBreakdown.convenienceFee) / quantity;
        const ticketDiscount = Number(priceBreakdown.discount || 0) / quantity;

        const organizerNet = ticketBasePrice - ticketCommission - ticketConvenience - ticketDiscount;
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
                code: ticketCode,
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
                title: "Ticket Confirmed",
                content:
                    `Your ticket for ${event?.title || "your event"} is confirmed. ` +
                    `Date: ${event ? new Date(event.dateTime).toLocaleString() : "TBA"}. ` +
                    `Location: ${event?.venue || "TBA"}. Open the app to view your ticket QR code.`,
                channels: [
                    NotificationChannel.PUSH,
                    NotificationChannel.SMS,
                    NotificationChannel.EMAIL,
                ],
                type: "TICKET_CONFIRMATION",
                referenceId: purchase.id,
                metadata: {
                    eventId,
                    purchaseId: purchase.id,
                    eventName: event?.title,
                    eventDateTime: event?.dateTime,
                    eventVenue: event?.venue,
                    ticketCodes: generatedCodes,
                    ticketLink: `/my-tickets?purchaseId=${purchase.id}`,
                },
            });

            // --- ORGANIZER NOTIFICATIONS (Async) ---
            (async () => {
                try {
                    const fullEvent = await prisma.event.findUnique({
                        where: { id: eventId },
                        include: { tiers: true }
                    });

                    if (!fullEvent) return;

                    // 1. Calculate new totals
                    const ticketsSold = await prisma.ticket.count({
                        where: { eventId, status: { in: ['SOLD', 'VALID', 'USED'] } }
                    });

                    // 2. Sales Milestones (10, 50, 100, 500, 1000, etc.)
                    const milestones = [10, 50, 100, 500, 1000, 5000, 10000];
                    if (milestones.includes(ticketsSold) || (ticketsSold > 0 && ticketsSold % 1000 === 0)) {
                        await NotificationService.notifyOrganizer(fullEvent.organizerId, {
                            title: "Sales Milestone! 🚀",
                            content: `Congratulations! You've sold ${ticketsSold} tickets for "${fullEvent.title}".`,
                            channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
                            metadata: { type: 'MILESTONE', count: ticketsSold, eventId }
                        });
                    }

                    // 3. Low Inventory Checks
                    const totalCapacity = fullEvent.tiers.reduce((sum, t) => sum + t.capacity, 0);
                    const percentSold = ticketsSold / totalCapacity;

                    // Alert at 90% (Using a small range to avoid duplicate alerts on every sale past 90%)
                    // In production, we'd check if specific alert was already sent via NotificationLog
                    // For MVP: Alert if we just crossed the threshold with this purchase
                    const previousCount = ticketsSold - quantity;
                    const previousAndCurrentCross90 = (previousCount / totalCapacity < 0.9) && (percentSold >= 0.9);

                    if (previousAndCurrentCross90 && percentSold < 1.0) {
                        await NotificationService.notifyOrganizer(fullEvent.organizerId, {
                            title: "Low Ticket Alert ⚠️",
                            content: `Heads up! "${fullEvent.title}" is 90% sold out. Only ${totalCapacity - ticketsSold} tickets remaining.`,
                            channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
                            metadata: { type: 'INVENTORY_LOW', eventId }
                        });
                    }

                    if (percentSold >= 1.0 && (previousCount / totalCapacity) < 1.0) {
                        await NotificationService.notifyOrganizer(fullEvent.organizerId, {
                            title: "Event Sold Out! 🎉",
                            content: `Incredible! "${fullEvent.title}" is officially 100% sold out.`,
                            channels: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL],
                            metadata: { type: 'SOLD_OUT', eventId }
                        });
                    }

                } catch (err) {
                    console.error("Failed to process organizer notifications:", err);
                }
            })();

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
