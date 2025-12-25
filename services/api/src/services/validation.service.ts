import { prisma } from "../lib/prisma";
import { TicketStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { FraudService } from "./fraud.service";
import { AnalyticsService } from "./analytics.service";

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
            const transactionResult = await prisma.$transaction(async (tx) => {
                const ticket = await tx.ticket.findUnique({
                    where: { id: tid },
                    include: { event: true, tier: true }
                });

                if (!ticket) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Ticket not found");
                    return { result: { success: false, message: "Invalid Ticket: No entry found in database" }, log };
                }

                if (ticket.eventId !== eid) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Event mismatch");
                    return { result: { success: false, message: "Invalid Ticket: Does not belong to this event" }, log };
                }

                if (ticket.status === TicketStatus.USED) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Already scanned", true);
                    return {
                        result: { success: false, message: "Duplicate Entry: This ticket was already scanned", fraudDetected: true },
                        log
                    };
                }

                if (ticket.status !== TicketStatus.VALID) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", `Status: ${ticket.status}`);
                    return { result: { success: false, message: `Invalid Status: Ticket is currently ${ticket.status}` }, log };
                }

                // SUCCESS: Mark as used
                const updatedTicket = await tx.ticket.update({
                    where: { id: tid },
                    data: { status: TicketStatus.USED }
                });

                const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "SUCCESS");

                const result = {
                    success: true,
                    message: "Access Granted",
                    ticket: {
                        id: updatedTicket.id,
                        tier: ticket.tier.name,
                        seat: ticket.seatNumber
                    }
                };

                return { result, log };
            });

            // Trigger Background tasks AFTER transaction commit
            if (transactionResult.log) {
                FraudService.analyzeScan(transactionResult.log.id).catch((err: any) => console.error("Fraud analysis failed:", err));

                const status = transactionResult.result.success ? "SUCCESS" as const : "REJECTED" as const;
                AnalyticsService.recordEntryMetric(eid, gateId || null, status).catch((err: any) => console.error("Analytics failed:", err));
            }

            return transactionResult.result;
        } catch (error: any) {
            // Log failed signature verification if device/gate info is available
            if (gateId || deviceId) {
                prisma.scanLog.create({
                    data: {
                        ticketId: "INVALID",
                        eventId: 0, // Unknown event
                        gateId: gateId || null,
                        deviceId: deviceId || null,
                        mode: "ONLINE",
                        status: "REJECTED",
                        reason: `Signature Error: ${error.message}`
                    }
                }).then(log => {
                    FraudService.analyzeScan(log.id).catch(() => { });
                    AnalyticsService.recordEntryMetric(0, gateId || null, "REJECTED").catch(() => { });
                }).catch(() => { });
            }
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
            select: { id: true, qrPayload: true }
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

                const syncResult = await prisma.$transaction(async (tx) => {
                    const ticket = await tx.ticket.findUnique({ where: { id: tid } });

                    if (!ticket || ticket.status === TicketStatus.USED) {
                        const fraud = ticket?.status === TicketStatus.USED;
                        const log = await this.logScan(tx, tid, eid, gateId, deviceId, "OFFLINE", "REJECTED", fraud ? "Duplicate during sync" : "Invalid", fraud, deviceTime);
                        return {
                            res: { tid, status: "CONFLICT", message: fraud ? "Already Used" : "Not Found" },
                            log
                        };
                    }

                    await tx.ticket.update({
                        where: { id: tid },
                        data: { status: TicketStatus.USED }
                    });

                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "OFFLINE", "SUCCESS", undefined, false, deviceTime);
                    return { res: { tid, status: "SYNCED" }, log };
                });

                // Background tasks after commit
                if (syncResult.log) {
                    FraudService.analyzeScan(syncResult.log.id).catch((err: any) => console.error("Fraud analysis failed:", err));
                    const status = syncResult.res.status === "SYNCED" ? "SUCCESS" as const : "REJECTED" as const;
                    AnalyticsService.recordEntryMetric(eid, gateId || null, status).catch((err: any) => console.error("Analytics failed:", err));
                }

                results.push(syncResult.res);
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
