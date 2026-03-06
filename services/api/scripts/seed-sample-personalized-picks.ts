import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedItem = {
    title: string;
    description: string;
    venue: string;
    categorySlug: string;
    daysFromNow: number;
    featured: boolean;
    totalCapacity: number;
};

const SAMPLE_PERSONALIZED: SeedItem[] = [
    {
        title: '[Personalized] Weekend Afrobeat Session',
        description: 'Music lovers pick: upbeat afrobeat night with live DJ sets.',
        venue: 'Downtown Sound House',
        categorySlug: 'music',
        daysFromNow: 3,
        featured: false,
        totalCapacity: 420,
    },
    {
        title: '[Personalized] City Laughs Comedy Hour',
        description: 'Comedy spotlight with rising stand-up comedians.',
        venue: 'Jem Hall',
        categorySlug: 'comedy',
        daysFromNow: 5,
        featured: false,
        totalCapacity: 300,
    },
    {
        title: '[Personalized] Practical Product Workshop',
        description: 'Hands-on workshop for product thinking and UX execution.',
        venue: 'IceAddis Training Room',
        categorySlug: 'workshops-classes',
        daysFromNow: 7,
        featured: false,
        totalCapacity: 120,
    },
    {
        title: '[Personalized] Rift Valley Adventure Tour',
        description: 'Explore beyond your usual picks with a guided tour experience.',
        venue: 'Bishoftu Departure Point',
        categorySlug: 'tours-travel',
        daysFromNow: 9,
        featured: false,
        totalCapacity: 80,
    },
    {
        title: '[Personalized] Late Night Indie Screening',
        description: 'Movie enthusiasts pick with post-screening discussion.',
        venue: 'Bole Indie Cinema',
        categorySlug: 'movies',
        daysFromNow: 6,
        featured: false,
        totalCapacity: 260,
    },
];

function toFutureDate(daysFromNow: number): Date {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + daysFromNow);
    d.setHours(19, 0, 0, 0);
    return d;
}

async function main() {
    console.log('Seeding sample Personalized Picks events...');

    const organizer = await prisma.organizerProfile.findFirst({
        orderBy: { id: 'asc' },
        select: { id: true, organizationName: true, status: true },
    });
    if (!organizer) throw new Error('No organizer profile found. Create an organizer first.');

    const city =
        (await prisma.city.findFirst({ where: { slug: 'addis-ababa' }, select: { id: true, name: true } })) ||
        (await prisma.city.findFirst({ select: { id: true, name: true } }));
    if (!city) throw new Error('No city found.');

    let created = 0;
    let updated = 0;

    for (const item of SAMPLE_PERSONALIZED) {
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
            dateTime: toFutureDate(item.daysFromNow),
            status: EventStatus.APPROVED,
            eventType: EventType.CAPACITY,
            totalCapacity: item.totalCapacity,
            coverImage:
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            featured: item.featured,
            organizerId: organizer.id,
            categoryId: category.id,
            cityId: city.id,
            isPublic: true,
            isMovie: item.categorySlug === 'movies',
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
    console.log(`Organizer: ${organizer.organizationName} (${organizer.status})`);
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
