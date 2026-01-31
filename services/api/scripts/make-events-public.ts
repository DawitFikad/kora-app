import { prisma } from "../src/lib/prisma";
import { EventStatus } from "@prisma/client";

async function main() {
    console.log("Making approved events public...");

    const approvedEvents = await prisma.event.findMany({
        where: { status: EventStatus.APPROVED },
        orderBy: { dateTime: "asc" },
        select: { id: true, title: true }
    });

    if (approvedEvents.length === 0) {
        console.log("No approved events found.");
        return;
    }

    await prisma.event.updateMany({
        where: { status: EventStatus.APPROVED },
        data: { isPublic: true }
    });

    const featuredCount = await prisma.event.count({
        where: { status: EventStatus.APPROVED, featured: true }
    });

    if (featuredCount === 0) {
        const idsToFeature = approvedEvents.slice(0, 6).map((e) => e.id);
        await prisma.event.updateMany({
            where: { id: { in: idsToFeature } },
            data: { featured: true }
        });
        console.log(`Featured ${idsToFeature.length} event(s).`);
    } else {
        console.log(`${featuredCount} featured event(s) already set.`);
    }

    console.log("Done.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
