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
    private static ALLOW_UNVERIFIED_QR_LOOKUP = ["1", "true", "yes"].includes(
        String(process.env.ALLOW_UNVERIFIED_QR_LOOKUP || "").toLowerCase()
    );

    private static readonly TICKET_INCLUDE = {
        event: true,
        tier: true,
        user: {
            include: { profile: true }
        }
    };

    private static async resolveTicketForValidation(tx: any, rawInput: string) {
        const trimmed = rawInput.trim();
        if (!trimmed) return null;

        // Test-mode fallback: allow exact raw QR payload lookup (useful for external scanners in mixed envs).
        if (this.ALLOW_UNVERIFIED_QR_LOOKUP) {
            const byPayload = await tx.ticket.findUnique({
                where: { qrPayload: trimmed },
                include: this.TICKET_INCLUDE
            });
            if (byPayload) return byPayload;
        }

        const byId = await tx.ticket.findUnique({
            where: { id: trimmed },
            include: this.TICKET_INCLUDE
        });
        if (byId) return byId;

        const compact = trimmed.replace(/\s+/g, "").toUpperCase();
        if (compact) {
            const normalizedCode = compact.startsWith("ET-") ? compact : `ET-${compact}`;
            const byCode = await tx.ticket.findUnique({
                where: { code: normalizedCode },
                include: this.TICKET_INCLUDE
            });
            if (byCode) return byCode;

            // Also allow exact stored code without forcing ET- prefix.
            const byRawCode = await tx.ticket.findUnique({
                where: { code: compact },
                include: this.TICKET_INCLUDE
            });
            if (byRawCode) return byRawCode;
        }

        // Fallback for UI displays that show the first 8 chars of UUID.
        const shortLower = trimmed.toLowerCase();
        if (/^[a-f0-9]{8}$/.test(shortLower)) {
            const matches = await tx.ticket.findMany({
                where: { id: { startsWith: shortLower } },
                include: this.TICKET_INCLUDE,
                take: 2,
                orderBy: { createdAt: "desc" }
            });
            if (matches.length === 1) return matches[0];
        }

        return null;
    }

    /**
     * Validates a QR payload in real-time (Online Mode).
     */
    static async validateOnline(qrPayload: string, gateId?: string, deviceId?: string): Promise<ValidationResult> {
        try {
            let tid: string;
            let enforcedEid: number | undefined;
            const rawInput = qrPayload.trim();

            try {
                // 1. Verify Signature
                const payload = jwt.verify(rawInput, this.QR_SECRET) as any;
                tid = payload.tid;
                enforcedEid = payload.eid;
            } catch {
                // Manual entry fallback. In test mode, also decode unsigned JWT payload for tid/code extraction.
                tid = rawInput;
                if (this.ALLOW_UNVERIFIED_QR_LOOKUP) {
                    const decoded = jwt.decode(rawInput) as any;
                    if (decoded && typeof decoded === "object") {
                        if (typeof decoded.tid === "string" && decoded.tid.trim()) {
                            tid = decoded.tid.trim();
                        } else if (typeof decoded.code === "string" && decoded.code.trim()) {
                            tid = decoded.code.trim();
                        }

                        if (typeof decoded.eid === "number") {
                            enforcedEid = decoded.eid;
                        }
                    }
                }
            }

            // 2. Atomic Transaction: Check -> Mark USED -> Log
            const transactionResult = await prisma.$transaction(async (tx) => {
                const ticket = await this.resolveTicketForValidation(tx, tid);
                const resolvedTicketId = ticket?.id || tid;

                const eid = ticket?.eventId || enforcedEid || 0;

                if (!ticket) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Ticket not found");
                    return { result: { success: false, message: "Invalid Ticket: No entry found in database" }, log };
                }

                if (enforcedEid && ticket.eventId !== enforcedEid) {
                    const log = await this.logScan(tx, resolvedTicketId, eid, gateId, deviceId, "ONLINE", "REJECTED", "Event mismatch");
                    return { result: { success: false, message: "Invalid Ticket: Does not belong to this event" }, log };
                }

                if (ticket.status === TicketStatus.USED) {
                    const log = await this.logScan(tx, resolvedTicketId, eid, gateId, deviceId, "ONLINE", "REJECTED", "Already scanned", true);
                    return {
                        result: { success: false, message: "Duplicate Entry: This ticket was already scanned", fraudDetected: true },
                        log
                    };
                }

                if (ticket.status !== TicketStatus.VALID) {
                    const log = await this.logScan(tx, resolvedTicketId, eid, gateId, deviceId, "ONLINE", "REJECTED", `Status: ${ticket.status}`);
                    return { result: { success: false, message: `Invalid Status: Ticket is currently ${ticket.status}` }, log };
                }

                // SUCCESS: Mark as used
                const updatedTicket = await tx.ticket.update({
                    where: { id: ticket.id },
                    data: { status: TicketStatus.USED }
                });

                const attendeeTickets = await tx.ticket.findMany({
                    where: {
                        userId: ticket.userId,
                        status: { in: [TicketStatus.VALID, TicketStatus.USED] }
                    },
                    select: {
                        eventId: true,
                        status: true,
                        createdAt: true,
                        event: {
                            select: {
                                title: true,
                                dateTime: true
                            }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 25
                });

                const seenEventIds = new Set<number>();
                const purchaseEvents = attendeeTickets
                    .filter((entry: any) => {
                        if (seenEventIds.has(entry.eventId)) return false;
                        seenEventIds.add(entry.eventId);
                        return true;
                    })
                    .map((entry: any) => ({
                        eventId: entry.eventId,
                        eventTitle: entry.event?.title || "Event",
                        dateTime: entry.event?.dateTime || null,
                        ticketStatus: entry.status,
                        purchasedAt: entry.createdAt
                    }));

                const log = await this.logScan(tx, updatedTicket.id, eid, gateId, deviceId, "ONLINE", "SUCCESS");

                const result = {
                    success: true,
                    message: "Access Granted",
                    ticket: {
                        id: updatedTicket.id,
                        tier: ticket.tier.name,
                        seat: ticket.seatNumber,
                        userName:
                            ticket.user?.profile?.fullName ||
                            ticket.user?.phoneNumber ||
                            ticket.user?.email ||
                            "Guest",
                        attendeePhone: ticket.user?.phoneNumber || null,
                        attendeeEmail: ticket.user?.email || null,
                        eventTitle: ticket.event.title,
                        tierName: ticket.tier.name,
                        purchaseEventCount: purchaseEvents.length,
                        purchaseEvents
                    }
                };

                return { result, log };
            });

            // Trigger Background tasks AFTER transaction commit
            if (transactionResult.log) {
                FraudService.analyzeScan(transactionResult.log.id).catch((err: any) => console.error("Fraud analysis failed:", err));

                const status = transactionResult.result.success ? "SUCCESS" as const : "REJECTED" as const;
                // Fix: Ensure we use the log's eventId, not a scoped variable
                AnalyticsService.recordEntryMetric(transactionResult.log.eventId, gateId || null, status).catch((err: any) => console.error("Analytics failed:", err));
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
                        reason: `System Error: ${error.message}`
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
            include: {
                user: {
                    include: { profile: true }
                },
                tier: true
            }
        });

        // Map to a lightweight format for the mobile app
        return tickets.map(t => ({
            id: t.id,
            eventId: t.eventId,
            tierId: t.tierId,
            seatNumber: t.seatNumber,
            attendeeName: t.user.profile?.fullName || t.user.phoneNumber,
            status: t.status,
            qrPayload: t.qrPayload // although we might not need this if we just check ID
        }));
    }

    /**
     * Processes a batch of offline scan logs.
     */
    static async syncOfflineLogs(logs: any[]) {
        const results = [];
        const syncedIds: number[] = [];

        for (const log of logs) {
            const { ticketId, eventId, scannedAt, id } = log;

            try {
                const syncResult = await prisma.$transaction(async (tx) => {
                    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });

                    if (!ticket || ticket.status === TicketStatus.USED) {
                        const fraud = ticket?.status === TicketStatus.USED;
                        const scanLog = await this.logScan(tx, ticketId, eventId, undefined, undefined, "OFFLINE", "REJECTED", fraud ? "Duplicate during sync" : "Invalid", fraud, scannedAt);
                        return {
                            res: { ticketId, status: "CONFLICT", message: fraud ? "Already Used" : "Not Found" },
                            scanLog
                        };
                    }

                    await tx.ticket.update({
                        where: { id: ticketId },
                        data: { status: TicketStatus.USED }
                    });

                    const scanLog = await this.logScan(tx, ticketId, eventId, undefined, undefined, "OFFLINE", "SUCCESS", undefined, false, scannedAt);
                    return { res: { ticketId, status: "SYNCED" }, scanLog };
                });

                // Background tasks after commit
                if (syncResult.scanLog) {
                    FraudService.analyzeScan(syncResult.scanLog.id).catch((err: any) => console.error("Fraud analysis failed:", err));
                    const status = syncResult.res.status === "SYNCED" ? "SUCCESS" as const : "REJECTED" as const;
                    AnalyticsService.recordEntryMetric(eventId, null, status).catch((err: any) => console.error("Analytics failed:", err));
                }

                if (syncResult.res.status === "SYNCED" || syncResult.res.status === "CONFLICT") {
                    syncedIds.push(id);
                }

                results.push(syncResult.res);
            } catch (e: any) {
                results.push({ status: "ERROR", message: e.message });
            }
        }

        return { results, syncedIds };
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
