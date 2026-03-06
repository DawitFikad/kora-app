import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SampleEvent = {
    title: string;
    description: string;
    venue: string;
    categorySlug: string;
    daysFromNow: number;
    featured: boolean;
    totalCapacity: number;
};

const SAMPLE_EVENTS: SampleEvent[] = [
    {
        title: '[Sample] Addis Weekend Concert',
        description: 'High-energy live concert with top local artists.',
        venue: 'Millennium Hall',
        categorySlug: 'music',
        daysFromNow: 1,
        featured: true,
        totalCapacity: 900,
    },
    {
        title: '[Sample] Friday Night Comedy Show',
        description: 'Stand-up comedy special featuring trending comedians.',
        venue: 'National Theatre',
        categorySlug: 'comedy',
        daysFromNow: 2,
        featured: true,
        totalCapacity: 350,
    },
    {
        title: '[Sample] Practical UI/UX Workshop',
        description: 'Hands-on short course on interface and product design.',
        venue: 'IceAddis Hub',
        categorySlug: 'workshops-classes',
        daysFromNow: 3,
        featured: false,
        totalCapacity: 120,
    },
    {
        title: '[Sample] Cultural Street Festival',
        description: 'City-wide festival with performances, food, and crafts.',
        venue: 'Meskel Square',
        categorySlug: 'cultural',
        daysFromNow: 5,
        featured: true,
        totalCapacity: 1400,
    },
    {
        title: '[Sample] Startup Growth Workshop',
        description: 'Short course on growth strategy, funnel metrics, and GTM.',
        venue: 'BlueSpace Co-working',
        categorySlug: 'workshops-classes',
        daysFromNow: 4,
        featured: false,
        totalCapacity: 180,
    },
];

function toFutureDate(daysFromNow: number): Date {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + daysFromNow);
    d.setHours(18, 30, 0, 0);
    return d;
}

async function main() {
    console.log('Seeding sample Best Events This Week...');

    const organizer = await prisma.organizerProfile.findFirst({
        where: { status: 'APPROVED' },
        select: { id: true, organizationName: true },
    });
    if (!organizer) {
        throw new Error('No approved organizer found.');
    }

    const city = await prisma.city.findFirst({
        where: { slug: 'addis-ababa' },
        select: { id: true, name: true },
    }) || await prisma.city.findFirst({ select: { id: true, name: true } });

    if (!city) {
        throw new Error('No city found. Seed cities first.');
    }

    let created = 0;
    let updated = 0;

    for (const sample of SAMPLE_EVENTS) {
        const category = await prisma.mainCategory.findFirst({
            where: { slug: sample.categorySlug },
            select: { id: true, name: true },
        });

        if (!category) {
            console.log(`Skipped (missing category): ${sample.title}`);
            continue;
        }

        const existing = await prisma.event.findFirst({
            where: {
                title: sample.title,
                organizerId: organizer.id,
            },
            select: { id: true },
        });

        const data = {
            title: sample.title,
            description: sample.description,
            venue: sample.venue,
            dateTime: toFutureDate(sample.daysFromNow),
            status: EventStatus.APPROVED,
            eventType: EventType.CAPACITY,
            totalCapacity: sample.totalCapacity,
            coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            featured: sample.featured,
            organizerId: organizer.id,
            categoryId: category.id,
            cityId: city.id,
            isPublic: true,
            isMovie: false,
            refundPolicy: 'No refunds within 24 hours of event.',
        };

        if (existing) {
            await prisma.event.update({ where: { id: existing.id }, data });
            updated++;
            console.log(`Updated: ${sample.title}`);
        } else {
            await prisma.event.create({ data });
            created++;
            console.log(`Created: ${sample.title}`);
        }
    }

    console.log(`Done. Created: ${created}, Updated: ${updated}`);
    console.log(`Organizer: ${organizer.organizationName}`);
    console.log(`City: ${city.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
