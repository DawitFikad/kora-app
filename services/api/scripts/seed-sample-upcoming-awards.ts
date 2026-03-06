import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AwardSeed = {
    title: string;
    description: string;
    venue: string;
    categorySlug: string;
    daysFromNow: number;
    totalCapacity: number;
    featured: boolean;
};

const SAMPLE_AWARDS: AwardSeed[] = [
    {
        title: '[Awards] Gumma Film Awards 2026',
        description:
            'Film awards night with nominee highlights and winners announcement. Watch livestream available.',
        venue: 'Addis Cinema Grand Hall',
        categorySlug: 'film-tv-awards',
        daysFromNow: 11,
        totalCapacity: 900,
        featured: true,
    },
    {
        title: '[Awards] Leza Music Awards 2026',
        description:
            'Music industry celebration featuring nominees, live performances, and winner reveals.',
        venue: 'Millennium Hall',
        categorySlug: 'music-arts-awards',
        daysFromNow: 14,
        totalCapacity: 1800,
        featured: true,
    },
    {
        title: '[Awards] TikTok Creative Awards Ethiopia',
        description:
            'Social media awards ceremony with finalist showcase and livestream for remote viewers.',
        venue: 'AICC Main Auditorium',
        categorySlug: 'social-media-digital-awards',
        daysFromNow: 18,
        totalCapacity: 1400,
        featured: true,
    },
    {
        title: '[Awards] National Sports Recognition Awards',
        description:
            'Sports awards event honoring seasonal winners and top nominees.',
        venue: 'National Stadium Convention Hall',
        categorySlug: 'sports-recognition-awards',
        daysFromNow: 21,
        totalCapacity: 1000,
        featured: false,
    },
    {
        title: '[Awards] Startup Innovation Awards Ethiopia',
        description:
            'Business awards with shortlisted nominees, winner pitches, and livestream broadcast.',
        venue: 'Innovation Hub Center',
        categorySlug: 'business-innovation-awards',
        daysFromNow: 25,
        totalCapacity: 700,
        featured: false,
    },
];

function toFutureDate(daysFromNow: number): Date {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + daysFromNow);
    d.setHours(20, 30, 0, 0);
    return d;
}

async function main() {
    console.log('Seeding sample Upcoming Awards events...');

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

    for (const item of SAMPLE_AWARDS) {
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
                'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
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
