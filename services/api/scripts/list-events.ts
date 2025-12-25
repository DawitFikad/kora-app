
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const allEvents = await prisma.event.findMany({});

    console.log('--- Database Events ---');
    if (allEvents.length === 0) {
        console.log('No events found in the database. You may need to create one first via the Organizer Dashboard or Admin Panel.');
    } else {
        allEvents.forEach(e => {
            console.log(`\nID: ${e.id}`);
            console.log(`Title: ${e.title}`);
            console.log(`Status: ${e.status}`);
            console.log(`Type: ${e.eventType}`);
            console.log(`Date: ${e.dateTime}`);
            console.log(`------------------------------`);
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
