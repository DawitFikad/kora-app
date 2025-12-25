const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function test() {
    console.log("Checking pending organizers...");
    const pending = await prisma.organizerProfile.findMany({
        where: { status: 'PENDING' }
    });

    if (pending.length === 0) {
        console.log("No pending organizers to test with.");
        return;
    }

    const org = pending[0];
    console.log(`Testing with Organizer: ${org.organizationName} (ID: ${org.id}, Status: ${org.status})`);

    console.log("Calling reviewOrganizer via DB update simulation...");
    const updated = await prisma.organizerProfile.update({
        where: { id: org.id },
        data: {
            status: 'APPROVED',
            adminNote: 'Test Approval'
        }
    });

    console.log(`Result Status: ${updated.status}`);

    const verify = await prisma.organizerProfile.findUnique({
        where: { id: org.id }
    });
    console.log(`Verified Status in DB: ${verify.status}`);

    if (verify.status === 'APPROVED') {
        console.log("SUCCESS: Database updated correctly.");
    } else {
        console.log("FAILURE: Database did not update.");
    }

    // Reset back to pending for the user to try again
    await prisma.organizerProfile.update({
        where: { id: org.id },
        data: { status: 'PENDING' }
    });
    console.log("Reset status to PENDING for user testing.");
}

test().catch(console.error).finally(() => prisma.$disconnect());
