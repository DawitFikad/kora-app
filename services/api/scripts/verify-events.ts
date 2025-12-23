import { prisma } from "../src/lib/prisma";
import { EventService } from "../src/services/event.service";
import { ProfileService } from "../src/services/profile.service";
import { EventStatus, EventType, OrganizerStatus, Role } from "@prisma/client";

async function main() {
    console.log("Starting Event Module Verification...");

    const testTitle = "Night of Jazz - Verification Test";

    // 1. Setup Organizer (Must be APPROVED)
    const organizerUser = await prisma.user.findFirst({
        where: { role: Role.ORGANIZER },
        include: { organizer: true }
    });

    if (!organizerUser || !organizerUser.organizer) {
        console.error("No organizer found. Please run profile verification first.");
        process.exit(1);
    }

    // Ensure approved
    await prisma.organizerProfile.update({
        where: { id: organizerUser.organizer.id },
        data: { status: OrganizerStatus.APPROVED }
    });

    const category = await prisma.category.findFirst();
    const city = await prisma.city.findFirst();

    if (!category || !city) {
        console.error("Categories or Cities not seeded.");
        process.exit(1);
    }

    // 2. Create Event
    console.log("\n2. Creating Event...");
    const event = await EventService.createEvent(organizerUser.organizer.id, {
        title: testTitle,
        description: "A smooth night of live music.",
        venue: "Sky Lounge",
        dateTime: new Date(Date.now() + 86400000), // tomorrow
        eventType: EventType.CAPACITY,
        totalCapacity: 200,
        categoryId: category.id,
        cityId: city.id,
        tiers: [
            { name: "Regular", price: 50.00, capacity: 150 },
            { name: "VIP", price: 150.00, capacity: 50 }
        ]
    });

    console.log("Event Created. Status:", event.status);
    console.log("Tiers created:", event.tiers.length);

    // 3. Admin Review
    console.log("\n3. Reviewing Event (Admin)...");
    const reviewedEvent = await EventService.reviewEvent(event.id, EventStatus.APPROVED, 10.0);
    console.log("Event Status after review:", reviewedEvent.status);

    // 4. Discovery
    console.log("\n4. Testing Discovery...");
    const publicEvents = await EventService.listEvents({});
    const found = publicEvents.some(e => e.title === testTitle);
    console.log("Event visible in public list:", found ? "SUCCESS" : "FAILED");

    console.log("\nVerification Finished.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
