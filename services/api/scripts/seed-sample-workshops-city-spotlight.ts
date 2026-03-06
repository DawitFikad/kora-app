import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedItem = {
    title: string;
    description: string;
    venue: string;
    citySlug: string;
    categorySlug: string;
    daysFromNow: number;
    capacity: number;
    featured?: boolean;
};

const SAMPLE_EVENTS: SeedItem[] = [
    {
        title: '[Workshop] Video Editing Pro Bootcamp',
        description: 'Trending video editing workshop with practical short-course tracks.',
        venue: 'Addis Creative Hub',
        citySlug: 'addis-ababa',
        categorySlug: 'workshops-classes',
        daysFromNow: 4,
        capacity: 60,
        featured: true,
    },
    {
        title: '[Workshop] Digital Marketing Sprint',
        description: 'High-demand digital marketing short course for creators and brands.',
        venue: 'Bahir Dar Innovation Lab',
        citySlug: 'bahir-dar',
        categorySlug: 'workshops-classes',
        daysFromNow: 7,
        capacity: 40,
    },
    {
        title: '[Workshop] Creative Arts Studio Series',
        description: 'Creative arts workshop series with portfolio-focused sessions.',
        venue: 'Hawassa Arts Center',
        citySlug: 'hawassa',
        categorySlug: 'workshops-classes',
        daysFromNow: 10,
        capacity: 50,
    },
    {
        title: '[Workshop] Cooking Masterclass Weekend',
        description: 'Popular cooking short course featuring Ethiopian and fusion menus.',
        venue: 'Mekelle Culinary House',
        citySlug: 'mekelle',
        categorySlug: 'workshops-classes',
        daysFromNow: 12,
        capacity: 35,
    },
    {
        title: '[City Spotlight] Addis Night Concert',
        description: 'Concert and nightlife spotlight event in Addis Ababa.',
        venue: 'Millennium Hall',
        citySlug: 'addis-ababa',
        categorySlug: 'music',
        daysFromNow: 6,
        capacity: 500,
        featured: true,
    },
    {
        title: '[City Spotlight] Bahir Dar Lake Festival',
        description: 'Cultural festival with music, food, and local art showcases.',
        venue: 'Lakefront Arena',
        citySlug: 'bahir-dar',
        categorySlug: 'cultural',
        daysFromNow: 9,
        capacity: 420,
    },
    {
        title: '[City Spotlight] Hawassa Creative Nightlife',
        description: 'Nightlife and culture blend with live performances and DJs.',
        venue: 'Hawassa Central Stage',
        citySlug: 'hawassa',
        categorySlug: 'nightlife',
        daysFromNow: 14,
        capacity: 380,
    },
    {
        title: '[City Spotlight] Mekelle Community Culture Fest',
        description: 'City spotlight cultural festival with workshops and concerts.',
        venue: 'Mekelle Expo Grounds',
        citySlug: 'mekelle',
        categorySlug: 'cultural',
        daysFromNow: 16,
        capacity: 460,
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
    console.log('Seeding sample Workshops + City Spotlight events...');

    const organizer = await prisma.organizerProfile.findFirst({
        orderBy: { id: 'asc' },
        select: { id: true, organizationName: true },
    });
    if (!organizer) throw new Error('No organizer profile found. Create an organizer first.');

    let created = 0;
    let updated = 0;

    for (const item of SAMPLE_EVENTS) {
        const city = await prisma.city.findFirst({
            where: { slug: item.citySlug },
            select: { id: true, name: true },
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
            dateTime: toFutureDate(item.daysFromNow),
            status: EventStatus.APPROVED,
            eventType: EventType.CAPACITY,
            totalCapacity: item.capacity,
            coverImage:
                'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
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
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
