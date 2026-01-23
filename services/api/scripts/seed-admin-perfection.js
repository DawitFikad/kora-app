const { PrismaClient, Role, AccountStatus, OrganizerStatus, EventStatus, TicketStatus, TransactionType, FinancialStatus, NotificationChannel } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting "Admin Perfection" Seeding...');

    // 1. Clean up existing data (Optional, but good for a fresh look)
    // await prisma.ticket.deleteMany();
    // await prisma.event.deleteMany();
    // await prisma.organizerProfile.deleteMany();
    // await prisma.category.deleteMany();
    // await prisma.city.deleteMany();

    // 2. Categories & Cities
    const categories = [
        { name: 'Concerts', slug: 'concerts' },
        { name: 'Sports', slug: 'sports' },
        { name: 'Theater', slug: 'theater' },
        { name: 'Workshops', slug: 'workshops' }
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat
        });
    }

    const cities = [
        { name: 'Addis Ababa', slug: 'addis-ababa' },
        { name: 'Adama', slug: 'adama' },
        { name: 'Hawassa', slug: 'hawassa' },
        { name: 'Bahir Dar', slug: 'bahir-dar' }
    ];

    for (const city of cities) {
        await prisma.city.upsert({
            where: { name: city.name },
            update: {},
            create: city
        });
    }

    const dbCats = await prisma.category.findMany();
    const dbCities = await prisma.city.findMany();

    // 3. Organizers (Mix of Status)
    const organizers = [
        {
            phoneNumber: '251911111111',
            email: 'org1@example.com',
            name: 'Eagle Entertainment',
            status: OrganizerStatus.APPROVED,
            feePercentage: 8,
            feeFixed: 10
        },
        {
            phoneNumber: '251922222222',
            email: 'org2@example.com',
            name: 'Future Visions',
            status: OrganizerStatus.PENDING,
            feePercentage: 10,
            feeFixed: 0
        },
        {
            phoneNumber: '251933333333',
            email: 'org3@example.com',
            name: 'Cultural Arts Center',
            status: OrganizerStatus.APPROVED,
            feePercentage: 7,
            feeFixed: 5
        }
    ];

    for (const org of organizers) {
        const user = await prisma.user.upsert({
            where: { phoneNumber: org.phoneNumber },
            update: { role: Role.ORGANIZER, status: AccountStatus.ACTIVE },
            create: {
                phoneNumber: org.phoneNumber,
                email: org.email,
                role: Role.ORGANIZER,
                status: AccountStatus.ACTIVE
            }
        });

        const prof = await prisma.organizerProfile.upsert({
            where: { userId: user.id },
            update: { status: org.status, feePercentage: org.feePercentage, feeFixed: org.feeFixed },
            create: {
                userId: user.id,
                organizationName: org.name,
                contactPhone: org.phoneNumber,
                contactEmail: org.email,
                city: 'Addis Ababa',
                payoutDetails: 'CBE: 1000123456789',
                status: org.status,
                feePercentage: org.feePercentage,
                feeFixed: org.feeFixed
            }
        });

        // 4. Events for Approved Organizers
        if (org.status === OrganizerStatus.APPROVED) {
            const event = await prisma.event.create({
                data: {
                    title: `${org.name} Summer Fest`,
                    description: 'A massive celebration of culture and music.',
                    venue: 'Millennium Hall',
                    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days later
                    status: EventStatus.APPROVED,
                    totalCapacity: 5000,
                    featured: true,
                    organizerId: prof.id,
                    categoryId: dbCats[0].id,
                    cityId: dbCities[0].id,
                    tiers: {
                        create: [
                            { name: 'Regular', price: 500, capacity: 4000 },
                            { name: 'VIP', price: 1500, capacity: 1000 }
                        ]
                    }
                },
                include: { tiers: true }
            });

            // 5. Generate some sales (Tickets & Transactions)
            const buyer = await prisma.user.findFirst({ where: { role: Role.USER } }) || await prisma.user.create({ data: { phoneNumber: '251999999999', role: Role.USER, status: AccountStatus.ACTIVE } });

            for (let i = 0; i < 20; i++) {
                const tier = event.tiers[i % 2 === 0 ? 0 : 1];
                const basePrice = Number(tier.price);
                const feePercentage = Number(org.feePercentage || 0);
                const feeFixed = Number(org.feeFixed || 0);

                const commissionAmt = (basePrice * feePercentage / 100) + feeFixed;
                const platformNet = commissionAmt;
                const organizerNet = basePrice - commissionAmt;

                await prisma.ticket.create({
                    data: {
                        qrPayload: `EVENT-${event.id}-TICK-${i}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                        status: TicketStatus.SOLD,
                        basePrice,
                        commissionAmt,
                        platformNet,
                        organizerNet,
                        userId: buyer.id,
                        eventId: event.id,
                        tierId: tier.id
                    }
                });

                await prisma.financialTransaction.create({
                    data: {
                        type: TransactionType.TICKET_PURCHASE,
                        status: FinancialStatus.SETTLED,
                        amount: basePrice,
                        feeAmount: commissionAmt,
                        netAmount: organizerNet,
                        eventId: event.id
                    }
                });
            }
        } else {
            // Pending event for pending organizer
            await prisma.event.create({
                data: {
                    title: `${org.name} Showcase`,
                    venue: 'Hilton Hotel',
                    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
                    status: EventStatus.PENDING,
                    organizerId: prof.id,
                    categoryId: dbCats[3].id,
                    cityId: dbCities[0].id
                }
            });
        }
    }

    // 6. Audit Logs (NotificationLog)
    const admins = await prisma.user.findMany({ where: { role: Role.ADMIN } });
    if (admins.length > 0) {
        const admin = admins[0];
        const logActions = [
            { title: 'Organizer Approved', content: 'Approved "Eagle Entertainment" application.' },
            { title: 'Service Config Updated', content: 'Global commission rate changed to 10%.' },
            { title: 'Event Featured', content: 'Featured "Summer Fest" on homepage.' },
            { title: 'Payout Processed', content: 'Released ETB 45,000 to "Cultural Arts Center".' }
        ];

        for (const log of logActions) {
            await prisma.notificationLog.create({
                data: {
                    userId: admin.id,
                    channel: NotificationChannel.PUSH,
                    recipient: 'Internal Audit',
                    title: log.title,
                    content: log.content,
                    status: 'DELIVERED',
                    metadata: { ip: '192.168.1.10', userAgent: 'Mozilla/5.0' }
                }
            });
        }
    }

    console.log('✅ Seeding Complete! Admin Dashboard should now be realistic.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
