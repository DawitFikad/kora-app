"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fraud_service_1 = require("./fraud.service");
const analytics_service_1 = require("./analytics.service");
class ValidationService {
    /**
     * Validates a QR payload in real-time (Online Mode).
     */
    static async validateOnline(qrPayload, gateId, deviceId) {
        try {
            let tid;
            let enforcedEid;
            try {
                // 1. Verify Signature
                const payload = jsonwebtoken_1.default.verify(qrPayload, this.QR_SECRET);
                tid = payload.tid;
                enforcedEid = payload.eid;
            }
            catch {
                // Manual Entry (Raw ID)
                tid = qrPayload.trim(); // Trim whitespace
            }
            // 2. Atomic Transaction: Check -> Mark USED -> Log
            const transactionResult = await prisma_1.prisma.$transaction(async (tx) => {
                const ticket = await tx.ticket.findUnique({
                    where: { id: tid },
                    include: { event: true, tier: true }
                });
                const eid = ticket?.eventId || enforcedEid || 0;
                if (!ticket) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Ticket not found");
                    return { result: { success: false, message: "Invalid Ticket: No entry found in database" }, log };
                }
                if (enforcedEid && ticket.eventId !== enforcedEid) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Event mismatch");
                    return { result: { success: false, message: "Invalid Ticket: Does not belong to this event" }, log };
                }
                if (ticket.status === client_1.TicketStatus.USED) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", "Already scanned", true);
                    return {
                        result: { success: false, message: "Duplicate Entry: This ticket was already scanned", fraudDetected: true },
                        log
                    };
                }
                if (ticket.status !== client_1.TicketStatus.VALID) {
                    const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "REJECTED", `Status: ${ticket.status}`);
                    return { result: { success: false, message: `Invalid Status: Ticket is currently ${ticket.status}` }, log };
                }
                // SUCCESS: Mark as used
                const updatedTicket = await tx.ticket.update({
                    where: { id: tid },
                    data: { status: client_1.TicketStatus.USED }
                });
                const log = await this.logScan(tx, tid, eid, gateId, deviceId, "ONLINE", "SUCCESS");
                const result = {
                    success: true,
                    message: "Access Granted",
                    ticket: {
                        id: updatedTicket.id,
                        tier: ticket.tier.name,
                        seat: ticket.seatNumber,
                        userName: ticket.userId ? "Attendee" : "Guest", // Fallback name
                        eventTitle: ticket.event.title,
                        tierName: ticket.tier.name
                    }
                };
                return { result, log };
            });
            // Trigger Background tasks AFTER transaction commit
            if (transactionResult.log) {
                fraud_service_1.FraudService.analyzeScan(transactionResult.log.id).catch((err) => console.error("Fraud analysis failed:", err));
                const status = transactionResult.result.success ? "SUCCESS" : "REJECTED";
                // Fix: Ensure we use the log's eventId, not a scoped variable
                analytics_service_1.AnalyticsService.recordEntryMetric(transactionResult.log.eventId, gateId || null, status).catch((err) => console.error("Analytics failed:", err));
            }
            return transactionResult.result;
        }
        catch (error) {
            // Log failed signature verification if device/gate info is available
            if (gateId || deviceId) {
                prisma_1.prisma.scanLog.create({
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
                    fraud_service_1.FraudService.analyzeScan(log.id).catch(() => { });
                    analytics_service_1.AnalyticsService.recordEntryMetric(0, gateId || null, "REJECTED").catch(() => { });
                }).catch(() => { });
            }
            return { success: false, message: `System Error: ${error.message}` };
        }
    }
    /**
     * Prepares data for offline sync.
     * Returns a list of all VALID ticket IDs for the event.
     */
    static async getOfflineSyncData(eventId) {
        const tickets = await prisma_1.prisma.ticket.findMany({
            where: { eventId, status: client_1.TicketStatus.VALID },
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
    static async syncOfflineLogs(logs) {
        const results = [];
        const syncedIds = [];
        for (const log of logs) {
            const { ticketId, eventId, scannedAt, id } = log;
            try {
                const syncResult = await prisma_1.prisma.$transaction(async (tx) => {
                    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
                    if (!ticket || ticket.status === client_1.TicketStatus.USED) {
                        const fraud = ticket?.status === client_1.TicketStatus.USED;
                        const scanLog = await this.logScan(tx, ticketId, eventId, undefined, undefined, "OFFLINE", "REJECTED", fraud ? "Duplicate during sync" : "Invalid", fraud, scannedAt);
                        return {
                            res: { ticketId, status: "CONFLICT", message: fraud ? "Already Used" : "Not Found" },
                            scanLog
                        };
                    }
                    await tx.ticket.update({
                        where: { id: ticketId },
                        data: { status: client_1.TicketStatus.USED }
                    });
                    const scanLog = await this.logScan(tx, ticketId, eventId, undefined, undefined, "OFFLINE", "SUCCESS", undefined, false, scannedAt);
                    return { res: { ticketId, status: "SYNCED" }, scanLog };
                });
                // Background tasks after commit
                if (syncResult.scanLog) {
                    fraud_service_1.FraudService.analyzeScan(syncResult.scanLog.id).catch((err) => console.error("Fraud analysis failed:", err));
                    const status = syncResult.res.status === "SYNCED" ? "SUCCESS" : "REJECTED";
                    analytics_service_1.AnalyticsService.recordEntryMetric(eventId, null, status).catch((err) => console.error("Analytics failed:", err));
                }
                if (syncResult.res.status === "SYNCED" || syncResult.res.status === "CONFLICT") {
                    syncedIds.push(id);
                }
                results.push(syncResult.res);
            }
            catch (e) {
                results.push({ status: "ERROR", message: e.message });
            }
        }
        return { results, syncedIds };
    }
    static async logScan(tx, ticketId, eventId, gateId, deviceId, mode = "ONLINE", status = "SUCCESS", reason, fraudDetected = false, deviceTime) {
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
exports.ValidationService = ValidationService;
ValidationService.QR_SECRET = process.env.JWT_SECRET || "et-ticket-qr-secret";
