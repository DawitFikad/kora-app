import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedItem = {
    title: string;
    description: string;
    venue: string;
    citySlug: string;
    categorySlug: string;
    hoursFromNow?: number;
    daysFromNow?: number;
    totalCapacity: number;
    featured?: boolean;
};

const LAST_MINUTE_AND_OFFERS: SeedItem[] = [
    {
        title: '[Today] Sunset Jazz Pop-Up',
        description: 'Starts today with limited seats for impulse bookings.',
        venue: 'Bole Rooftop Stage',
        citySlug: 'addis-ababa',
        categorySlug: 'music',
        hoursFromNow: 6,
        totalCapacity: 120,
        featured: true,
    },
    {
        title: '[Today] Comedy Rush Night',
        description: 'Starts within 24 hours. Last-minute pass available.',
        venue: 'Jem Hall',
        citySlug: 'addis-ababa',
        categorySlug: 'comedy',
        hoursFromNow: 10,
        totalCapacity: 90,
    },
    {
        title: '[Offer] Weekend Bundle Concert Pack',
        description:
            'Bundle deal: buy group tickets and save. Limited time offer for weekend entries.',
        venue: 'Millennium Hall',
        citySlug: 'bahir-dar',
        categorySlug: 'music',
        daysFromNow: 3,
        totalCapacity: 400,
        featured: true,
    },
    {
        title: '[Offer] Partner Exclusive Culture Pass',
        description:
            'Exclusive partner offer with discount access to cultural festival zones.',
        venue: 'Lakefront Arena',
        citySlug: 'bahir-dar',
        categorySlug: 'cultural',
        daysFromNow: 5,
        totalCapacity: 300,
    },
    {
        title: '[Offer] Digital Workshop Promo Deal',
        description:
            'Promo discount for digital marketing short course. Limited time seats.',
        venue: 'Hawassa Creative Hub',
        citySlug: 'hawassa',
        categorySlug: 'workshops-classes',
        daysFromNow: 4,
        totalCapacity: 80,
    },
];

function toDate(item: SeedItem): Date {
    const now = new Date();
    const d = new Date(now);

    if (typeof item.hoursFromNow === 'number') {
        d.setHours(now.getHours() + item.hoursFromNow, 0, 0, 0);
        return d;
    }

    const days = item.daysFromNow ?? 2;
    d.setDate(now.getDate() + days);
    d.setHours(19, 30, 0, 0);
    return d;
}

async function main() {
    console.log('Seeding sample Last-Minute + Offers events...');

    const organizer = await prisma.organizerProfile.findFirst({
        orderBy: { id: 'asc' },
        select: { id: true, organizationName: true },
    });
    if (!organizer) throw new Error('No organizer profile found. Create one first.');

    let created = 0;
    let updated = 0;

    for (const item of LAST_MINUTE_AND_OFFERS) {
        const city = await prisma.city.findFirst({
            where: { slug: item.citySlug },
            select: { id: true },
        });
        if (!city) {
            console.log(`Skipped (missing city): ${item.title}`);
            continue;
        }

        const category = await prisma.mainCategory.findFirst({
            where: { slug: item.categorySlug },
            select: { id: true },
        });
        if (!category) {
            console.log(`Skipped (missing category): ${item.title}`);
            continue;
        }

        const existing = await prisma.event.findFirst({
            where: { title: item.title, organizerId: organizer.id },
            select: { id: true },
        });

        const payload = {
            title: item.title,
            description: item.description,
            venue: item.venue,
            dateTime: toDate(item),
            status: EventStatus.APPROVED,
            eventType: EventType.CAPACITY,
            totalCapacity: item.totalCapacity,
            coverImage:
                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            featured: item.featured ?? false,
            organizerId: organizer.id,
            categoryId: category.id,
            cityId: city.id,
            isPublic: true,
            isMovie: false,
            refundPolicy: 'No refunds within 24 hours of event.',
        };

        if (existing) {
            await prisma.event.update({ where: { id: existing.id }, data: payload });
            updated++;
            console.log(`Updated: ${item.title}`);
        } else {
            await prisma.event.create({ data: payload });
            created++;
            console.log(`Created: ${item.title}`);
        }
    }

    console.log(`Done. Created: ${created}, Updated: ${updated}`);
    console.log(`Organizer: ${organizer.organizationName}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
