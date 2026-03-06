import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TrendingSeed = {
    title: string;
    description: string;
    venue: string;
    categorySlug: string;
    daysFromNow: number;
    featured: boolean;
    totalCapacity: number;
};

const SAMPLE_TRENDING: TrendingSeed[] = [
    {
        title: '[Trending] TikTok Creative Awards Ethiopia',
        description: 'Viral creators, live performances, and trending short-form content showcase.',
        venue: 'Addis International Convention Center',
        categorySlug: 'social-media-digital-awards',
        daysFromNow: 6,
        featured: true,
        totalCapacity: 1200,
    },
    {
        title: '[Trending] Leza Music Awards Night',
        description: 'Hot and popular music award show featuring top artists across Ethiopia.',
        venue: 'Millennium Hall',
        categorySlug: 'music-arts-awards',
        daysFromNow: 8,
        featured: true,
        totalCapacity: 1800,
    },
    {
        title: '[Trending] Ethiopia Influencer Meetup 2026',
        description: 'High-demand influencer meetup with networking and brand collaboration.',
        venue: 'Skylight Hotel Ballroom',
        categorySlug: 'entrepreneurship-networking',
        daysFromNow: 5,
        featured: true,
        totalCapacity: 650,
    },
    {
        title: '[Trending] Major Concert: Addis Arena Live',
        description: 'Major concert bringing together chart-topping performers.',
        venue: 'Addis Arena',
        categorySlug: 'music',
        daysFromNow: 4,
        featured: true,
        totalCapacity: 2500,
    },
    {
        title: '[Trending] Creator Roundtable Livestream',
        description: 'Watch livestream with creators discussing viral growth and audience strategy.',
        venue: 'Online / Virtual Studio',
        categorySlug: 'online-virtual-events',
        daysFromNow: 3,
        featured: false,
        totalCapacity: 2000,
    },
];

function toFutureDate(daysFromNow: number): Date {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + daysFromNow);
    d.setHours(20, 0, 0, 0);
    return d;
}

async function main() {
    console.log('Seeding sample Trending Now events...');

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

    for (const item of SAMPLE_TRENDING) {
        const category = await prisma.mainCategory.findFirst({
            where: { slug: item.categorySlug },
            select: { id: true, name: true },
        });

        if (!category) {
            console.log(`Skipped (missing category): ${item.title}`);
            continue;
        }

        const existing = await prisma.event.findFirst({
            where: {
                title: item.title,
                organizerId: organizer.id,
            },
            select: { id: true },
        });

        const payload = {
            title: item.title,
            description: item.description,
            venue: item.venue,
            dateTime: toFutureDate(item.daysFromNow),
            status: EventStatus.APPROVED,
            eventType: EventType.CAPACITY,
            totalCapacity: item.totalCapacity,
            coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
            featured: item.featured,
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
