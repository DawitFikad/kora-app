const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding real data for Admin Dashboard...');

    // 1. Ensure Categories and Cities exist
    const categories = await Promise.all([
        prisma.category.upsert({ where: { slug: 'music' }, update: {}, create: { name: 'Music', slug: 'music' } }),
        prisma.category.upsert({ where: { slug: 'business' }, update: {}, create: { name: 'Business', slug: 'business' } }),
        prisma.category.upsert({ where: { slug: 'tech' }, update: {}, create: { name: 'Technology', slug: 'tech' } }),
    ]);

    const cities = await Promise.all([
        prisma.city.upsert({ where: { slug: 'addis-ababa' }, update: {}, create: { name: 'Addis Ababa', slug: 'addis-ababa' } }),
        prisma.city.upsert({ where: { slug: 'hawassa' }, update: {}, create: { name: 'Hawassa', slug: 'hawassa' } }),
    ]);

    // 2. Create some organizers
    const orgsData = [
        { phone: '0911000001', name: 'Elite Events', status: 'PENDING' },
        { phone: '0911000002', name: 'Abyssinia Promos', status: 'APPROVED' },
        { phone: '0911000003', name: 'Tech Ethiopia', status: 'APPROVED' },
        { phone: '0911000004', name: 'Global Konnect', status: 'REJECTED' },
    ];

    for (const org of orgsData) {
        const user = await prisma.user.upsert({
            where: { phoneNumber: org.phone },
            update: {},
            create: {
                phoneNumber: org.phone,
                role: 'ORGANIZER',
                status: org.status === 'APPROVED' ? 'ACTIVE' : 'PENDING',
                profile: { create: { fullName: org.name } },
                organizer: {
                    create: {
                        organizationName: org.name,
                        contactPhone: org.phone,
                        city: 'Addis Ababa',
                        payoutDetails: 'CBE 100012345678',
                        status: org.status,
                    }
                }
            },
            include: { organizer: true }
        });

        if (org.status === 'APPROVED' && user.organizer) {
            // Create nested Wallet
            await prisma.organizerWallet.upsert({
                where: { organizerId: user.organizer.id },
                update: {},
                create: {
                    organizerId: user.organizer.id,
                    availableBalance: 5000,
                    pendingBalance: 2000
                }
            });

            // Create some events for approved ones
            await prisma.event.create({
                data: {
                    title: `${org.name} Live Expo`,
                    venue: 'Millennium Hall',
                    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    status: org.phone === '0911000002' ? 'PENDING' : 'APPROVED',
                    categoryId: categories[0].id,
                    cityId: cities[0].id,
                    organizerId: user.organizer.id,
                    feePercentage: 10,
                    tiers: {
                        create: [
                            { name: 'Regular', price: 500, capacity: 1000 },
                            { name: 'VIP', price: 1500, capacity: 200 }
                        ]
                    }
                }
            });
        }
    }

    // 3. Create some successful purchases to generate GMV
    const testUser = await prisma.user.upsert({
        where: { phoneNumber: '0900112233' },
        update: {},
        create: {
            phoneNumber: '0900112233',
            role: 'USER',
            profile: { create: { fullName: 'Customer One' } }
        }
    });

    const event = await prisma.event.findFirst({ where: { status: 'APPROVED' } });
    if (event) {
        for (let i = 0; i < 5; i++) {
            const amount = 500 + (i * 100);
            const fee = amount * 0.1;
            const purchase = await prisma.purchase.create({
                data: {
                    userId: testUser.id,
                    status: 'SUCCESS',
                    totalAmount: amount,
                    paymentRef: `REF-${Date.now()}-${i}`,
                    paymentMethod: 'TELEBIRR',
                    externalRef: `EXT-${Date.now()}-${i}`,
                }
            });

            await prisma.financialTransaction.create({
                data: {
                    type: 'TICKET_PURCHASE',
                    status: 'SETTLED',
                    amount: amount,
                    feeAmount: fee,
                    netAmount: amount - fee,
                    purchaseId: purchase.id,
                    eventId: event.id
                }
            });

            // Also add platform fee entry
            await prisma.financialTransaction.create({
                data: {
                    type: 'PLATFORM_FEE',
                    status: 'SETTLED',
                    amount: fee,
                    feeAmount: 0,
                    netAmount: fee,
                    purchaseId: purchase.id,
                    eventId: event.id
                }
            });
        }
    }

    // 4. Create some Fraud Alerts
    await prisma.fraudAlert.create({
        data: {
            type: 'BOT_PURCHASE', // Valid enum value
            riskLevel: 'HIGH',
            message: 'User 0900112233 attempted 5 purchases in 1 minute',
            userId: testUser.id,
        }
    });

    await prisma.fraudAlert.create({
        data: {
            type: 'REPLAY', // Valid enum value
            riskLevel: 'CRITICAL',
            message: 'Duplicate QR scan detected for Ticket #XYZ-123',
        }
    });

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
