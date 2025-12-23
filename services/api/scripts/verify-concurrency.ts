import { prisma } from "../src/lib/prisma";
import { LockService } from "../src/services/lock.service";
import { TicketingController } from "../src/controllers/ticketing.controller";
import { EventType, Role } from "@prisma/client";
import redis from "../src/utils/redis";

async function main() {
    console.log("Starting Concurrency Verification...");

    // 1. Setup Event with 2 Seats available
    const event = await prisma.event.findFirst({
        where: { status: "APPROVED", eventType: EventType.CAPACITY },
        include: { tiers: true }
    });

    if (!event || event.tiers.length === 0) {
        console.error("No approved capacity event found. Run seed and event verification first.");
        process.exit(1);
    }

    const tier = event.tiers[0];
    const userId1 = 1;
    const userId2 = 2; // Simulation users
    const maxCapacity = 5; // Suppose only 5 left

    // Clear existing locks for this tier
    const lockedKey = `lock:event:${event.id}:tier:${tier.id}:capacity:reserved`;
    await redis.del(lockedKey);

    console.log(`\nTesting Capacity Reservation for Tier: ${tier.name} (Max: ${maxCapacity})`);

    // 2. Simulate 3 workers trying to book 2 tickets each (Total 6 > 5)
    console.log("Launching 3 concurrent reservation requests for 2 tickets each...");

    const tryReserve = async (uid: number, qty: number) => {
        const success = await LockService.reserveCapacity(event.id, tier.id, uid, qty, maxCapacity);
        return { uid, success };
    };

    const results = await Promise.all([
        tryReserve(101, 2),
        tryReserve(102, 2),
        tryReserve(103, 2)
    ]);

    console.log("Results:", results);

    const successCount = results.filter(r => r.success).length;
    console.log(`Total Successes: ${successCount} (Expected: 2)`);

    if (successCount === 2) {
        console.log("✅ CAPACITY CONCURRENCY TEST PASSED");
    } else {
        console.log("❌ CAPACITY CONCURRENCY TEST FAILED");
    }

    // 3. Testing Seat Locking
    console.log("\nTesting Seat Locking for Seat 'A1'...");
    const seat = "A1";
    await LockService.unlockSeat(event.id, tier.id, seat);

    const seatResults = await Promise.all([
        LockService.lockSeat(event.id, tier.id, seat, 201),
        LockService.lockSeat(event.id, tier.id, seat, 202)
    ]);

    console.log("Seat Lock Results (User 201 vs 202):", seatResults);
    if (seatResults[0] === true && seatResults[1] === false) {
        console.log("✅ SEAT LOCK CONCURRENCY TEST PASSED");
    } else {
        console.log("❌ SEAT LOCK CONCURRENCY TEST FAILED");
    }

    console.log("\nVerification Finished.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
