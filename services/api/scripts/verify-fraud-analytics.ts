import { prisma } from "../src/lib/prisma";
import { ValidationService } from "../src/services/validation.service";
import { FraudService } from "../src/services/fraud.service";
import { AnalyticsService } from "../src/services/analytics.service";
import { TicketStatus, Role } from "@prisma/client";
import jwt from "jsonwebtoken";

const QR_SECRET = process.env.JWT_SECRET || "et-ticket-qr-secret";

async function verifyFraudAndAnalytics() {
    console.log("🚀 Starting Fraud & Analytics Verification...");

    try {
        // 1. Setup Data
        const user = await prisma.user.findFirst() || await prisma.user.create({ data: { phoneNumber: "251999999999", role: Role.USER } });
        const organizer = await prisma.organizerProfile.findFirst({ include: { user: true } });
        const event = await prisma.event.findFirst({ include: { tiers: true } });

        if (!event || !organizer) {
            console.error("❌ Missing event or organizer. Run seed/verify-events first.");
            return;
        }

        console.log(`✅ Using Event: ${event.title}`);

        // 2. Create a test ticket
        const ticket = await prisma.ticket.create({
            data: {
                qrPayload: "dummy",
                status: TicketStatus.VALID,
                userId: user.id,
                eventId: event.id,
                tierId: event.tiers[0].id
            }
        });

        const qrPayload = jwt.sign({ tid: ticket.id, eid: event.id }, QR_SECRET);
        await prisma.ticket.update({ where: { id: ticket.id }, data: { qrPayload } });

        console.log("✅ Test Ticket Created.");

        // 3. Simulate Successful Entry
        console.log("\n--- Testing Successful Entry ---");
        const res1 = await ValidationService.validateOnline(qrPayload, "GATE-A", "DEVICE-1");
        console.log(`Result: ${res1.message}`);

        // 4. Simulate QR Replay (Fraud Type: REPLAY)
        console.log("\n--- Testing QR Replay (Fraud) ---");
        const res2 = await ValidationService.validateOnline(qrPayload, "GATE-B", "DEVICE-2");
        console.log(`Result: ${res2.message} (Fraud Detected: ${res2.fraudDetected})`);

        // Wait a bit for background analysis
        await new Promise(r => setTimeout(r, 2000));

        const alerts = await prisma.fraudAlert.findMany({
            where: { type: "REPLAY", ticketId: ticket.id }
        });
        console.log(`✅ Fraud Alert Found: ${alerts.length > 0 ? "YES" : "NO"}`);

        // 5. Simulate Device High Failure Rate (Fraud Type: INSIDER_ABUSE)
        const maliciousDeviceId = `DEVICE-MALICIOUS-${Date.now()}`;
        console.log(`\n--- Testing Device Failure Threshold (${maliciousDeviceId}) ---`);
        for (let i = 0; i < 15; i++) {
            await ValidationService.validateOnline("invalid-sig", "GATE-A", maliciousDeviceId);
        }
        await new Promise(r => setTimeout(r, 4000));

        const deviceAlerts = await prisma.fraudAlert.findMany({
            where: { message: { contains: maliciousDeviceId } }
        });
        console.log(`✅ Device Alert Found: ${deviceAlerts.length > 0 ? "YES" : "NO"}`);

        // 6. Check Risk Scores
        const userRisk = await prisma.riskScore.findFirst({
            where: { entityType: "USER", entityId: user.id.toString() }
        });
        console.log(`📈 User Risk Score: ${userRisk?.score || 0} (${userRisk?.level || "LOW"})`);

        const deviceRisk = await prisma.riskScore.findFirst({
            where: { entityType: "DEVICE", entityId: maliciousDeviceId }
        });
        console.log(`📈 Device Risk Score: ${deviceRisk?.score || 0} (${deviceRisk?.level || "LOW"})`);

        // 7. Test Analytics
        console.log("\n--- Testing Analytics ---");
        const metrics = await AnalyticsService.getLiveEventMetrics(event.id);
        console.log(`📊 Live Metrics: Total Entered: ${metrics.totalEntered}, Entry Rate: ${metrics.entryRate}%`);
        console.log("📊 Gate Performance:", metrics.gatePerformance);

        const report = await AnalyticsService.getPostEventAnalytics(event.id);
        console.log(`📊 Post-Event Report: Attendee Count: ${report.attendeeCount}, No-Show Rate: ${report.noShowRate}%`);

        console.log("\n✨ Fraud & Analytics Verification Completed!");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFraudAndAnalytics();
