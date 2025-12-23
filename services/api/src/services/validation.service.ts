import { prisma } from "../lib/prisma";
import { TicketStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

export interface ValidationResult {
    success: boolean;
    message: string;
    ticket?: any;
    fraudDetected?: boolean;
}

export class ValidationService {
    private static QR_SECRET = process.env.JWT_SECRET || "et-ticket-qr-secret";

    /**
     * Validates a QR payload in real-time (Online Mode).
     */
    static async validateOnline(qrPayload: string, gateId?: string, deviceId?: string): Promise<ValidationResult> {
        try {
            // 1. Verify Signature
            const payload = jwt.verify(qrPayload, this.QR_SECRET) as any;
            const { tid, eid } = payload;

            // 2. Atomic Transaction: Check -> Mark USED -> Log
            return await prisma.$transaction(async (tx) => {
                const ticket = await tx.ticket.findUnique({
                    where: { id: tid },
                    include: { event: true, tier: true }
                });

                if (!ticket) {
                    await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Ticket not found");
                    return { success: false, message: "Invalid Ticket: No entry found in database" };
                }

                if (ticket.eventId !== eid) {
                    await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Event mismatch");
                    return { success: false, message: "Invalid Ticket: Does not belong to this event" };
                }

                if (ticket.status === TicketStatus.USED) {
                    await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Already scanned", true);
                    return { success: false, message: "Duplicate Entry: This ticket was already scanned", fraudDetected: true };
                }

                if (ticket.status !== TicketStatus.VALID) {
                    await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", `Status: ${ticket.status}`);
                    return { success: false, message: `Invalid Status: Ticket is currently ${ticket.status}` };
                }

                // SUCCESS: Mark as used
                const updatedTicket = await tx.ticket.update({
                    where: { id: tid },
                    data: { status: TicketStatus.USED }
                });

                await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "SUCCESS");

                return {
                    success: true,
                    message: "Access Granted",
                    ticket: {
                        id: updatedTicket.id,
                        tier: ticket.tier.name,
                        seat: ticket.seatNumber
                    }
                };
            });
        } catch (error: any) {
            return { success: false, message: `System Error: ${error.message}` };
        }
    }

    /**
     * Prepares data for offline sync. 
     * Returns a list of all VALID ticket IDs for the event.
     */
    static async getOfflineSyncData(eventId: number) {
        const tickets = await prisma.ticket.findMany({
            where: { eventId, status: TicketStatus.VALID },
            select: { id: true, qrPayload: true } // We might need payload if app verifies sig locally
        });
        return tickets;
    }

    /**
     * Processes a batch of offline scan logs.
     */
    static async syncOfflineLogs(logs: any[]) {
        const results = [];

        for (const log of logs) {
            const { qrPayload, gateId, deviceId, deviceTime } = log;

            try {
                const payload = jwt.verify(qrPayload, this.QR_SECRET) as any;
                const { tid, eid } = payload;

                const result = await prisma.$transaction(async (tx) => {
                    const ticket = await tx.ticket.findUnique({ where: { id: tid } });

                    if (!ticket || ticket.status === TicketStatus.USED) {
                        const fraud = ticket?.status === TicketStatus.USED;
                        await this.logScan(tx, tid, eid, gateId, deviceId, "OFFLINE", "REJECTED", fraud ? "Duplicate during sync" : "Invalid", fraud, deviceTime);
                        return { tid, status: "CONFLICT", message: fraud ? "Already Used" : "Not Found" };
                    }

                    await tx.ticket.update({
                        where: { id: tid },
                        data: { status: TicketStatus.USED }
                    });

                    await this.logScan(tx, tid, eid, gateId, deviceId, "OFFLINE", "SUCCESS", undefined, false, deviceTime);
                    return { tid, status: "SYNCED" };
                });
                results.push(result);
            } catch (e: any) {
                results.push({ status: "ERROR", message: e.message });
            }
        }

        return results;
    }

    private static async logScan(tx: any, ticketId: string, eventId: number, gateId?: string, deviceId?: string, mode: string = "ONLINE", status: string = "SUCCESS", reason?: string, fraudDetected: boolean = false, deviceTime?: string) {
        return tx.scanLog.create({
            data: {
                ticketId,
                eventId,
                gateId,
                deviceId,
                mode,
                status,
                reason,
                deviceTime: deviceTime ? new Date(deviceTime) : null,
                metadata: fraudDetected ? { fraudLevel: "HIGH", alert: "DUPLICATE_ENTRY" } : null
            }
        });
    }
}
