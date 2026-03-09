const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SAMPLE_EVENT_FILTER = {
    OR: [
        { title: { startsWith: '[Sample]' } },
        { title: { contains: 'Sample' } },
        { title: { contains: 'Demo' } },
    ],
};

const DEMO_ORG_FILTER = {
    OR: [
        { organizationName: { contains: 'Demo' } },
        { contactEmail: { contains: 'demo@' } },
        { contactPhone: { contains: '222222' } },
        { contactPhone: { contains: '910639875' } },
    ],
};

const DEMO_USER_FILTER = {
    OR: [
        { phoneNumber: { contains: '222222' } },
        { phoneNumber: { contains: '910639875' } },
        { email: { contains: 'demo@' } },
    ],
};

async function countState() {
    const [sampleEvents, demoOrganizers, demoUsers] = await Promise.all([
        prisma.event.count({ where: SAMPLE_EVENT_FILTER }),
        prisma.organizerProfile.count({ where: DEMO_ORG_FILTER }),
        prisma.user.count({ where: DEMO_USER_FILTER }),
    ]);

    return { sampleEvents, demoOrganizers, demoUsers };
}

async function safeDeleteMany(delegateName, where) {
    const delegate = prisma[delegateName];
    if (!delegate || typeof delegate.deleteMany !== 'function') {
        return;
    }
    await delegate.deleteMany({ where });
}

async function main() {
    const before = await countState();
    console.log('Before cleanup:', before);

    const demoOrganizers = await prisma.organizerProfile.findMany({
        where: DEMO_ORG_FILTER,
        select: { id: true, userId: true },
    });
    const demoOrganizerIds = demoOrganizers.map((o) => o.id);

    const sampleEvents = await prisma.event.findMany({
        where: {
            OR: [
                SAMPLE_EVENT_FILTER,
                demoOrganizerIds.length ? { organizerId: { in: demoOrganizerIds } } : undefined,
            ].filter(Boolean),
        },
        select: { id: true },
    });
    const sampleEventIds = sampleEvents.map((e) => e.id);

    if (sampleEventIds.length) {
        await safeDeleteMany('eventLike', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('eventRating', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('eventPreRegistration', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('eventReminderSubscription', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('promoCode', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('entryMetric', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('financialTransaction', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('fraudAlert', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('ticket', { eventId: { in: sampleEventIds } });
        await safeDeleteMany('ticketTier', { eventId: { in: sampleEventIds } });
        await prisma.event.deleteMany({ where: { id: { in: sampleEventIds } } });
    }

    if (demoOrganizerIds.length) {
        await safeDeleteMany('notificationLog', { organizerId: { in: demoOrganizerIds } });
        await prisma.organizerProfile.deleteMany({ where: { id: { in: demoOrganizerIds } } });
    }

    // Delete only demo users that are now fully detached from business data.
    const demoUsers = await prisma.user.findMany({
        where: DEMO_USER_FILTER,
        select: { id: true },
    });
    const demoUserIds = demoUsers.map((u) => u.id);

    if (demoUserIds.length) {
        await safeDeleteMany('refreshToken', { userId: { in: demoUserIds } });
        await safeDeleteMany('savedPaymentMethod', { userId: { in: demoUserIds } });
        await safeDeleteMany('userProfile', { userId: { in: demoUserIds } });
        await safeDeleteMany('eventLike', { userId: { in: demoUserIds } });
        await safeDeleteMany('eventRating', { userId: { in: demoUserIds } });
        await safeDeleteMany('eventPreRegistration', { userId: { in: demoUserIds } });
        await safeDeleteMany('eventReminderSubscription', { userId: { in: demoUserIds } });
        await safeDeleteMany('ticket', { userId: { in: demoUserIds } });
        await safeDeleteMany('purchase', { userId: { in: demoUserIds } });
        await safeDeleteMany('notificationLog', { userId: { in: demoUserIds } });

        await prisma.user.deleteMany({
            where: {
                id: { in: demoUserIds },
                organizer: null,
            },
        });
    }

    const after = await countState();
    console.log('After cleanup:', after);
    console.log('Sample data cleanup completed.');
}

main()
    .catch((err) => {
        console.error('Cleanup failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
