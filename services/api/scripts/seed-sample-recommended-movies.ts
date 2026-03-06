import { EventStatus, EventType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_MOVIES = [
    {
        title: '[Sample] Addis Premiere Night',
        description: 'Premiere screening with cast Q&A and red carpet experience.',
        venue: 'Addis Cinema Hall',
        daysFromNow: 2,
        featured: true,
        rating: 'PG-13',
        duration: 118,
        isPublic: true,
        isMovie: true,
        trailerUrl: 'https://example.com/trailer/addis-premiere-night',
    },
    {
        title: '[Sample] Ethiopian Film Festival Pick',
        description: 'Festival selection featuring top-rated local filmmakers.',
        venue: 'National Theatre Screen 2',
        daysFromNow: 4,
        featured: true,
        rating: 'G',
        duration: 102,
        isPublic: true,
        isMovie: true,
        trailerUrl: 'https://example.com/trailer/ethiopian-festival-pick',
    },
    {
        title: '[Sample] Midnight Premiere: City Shadows',
        description: 'Late-night premiere event with immersive soundtrack session.',
        venue: 'Skyline Multiplex',
        daysFromNow: 1,
        featured: false,
        rating: 'R',
        duration: 124,
        isPublic: true,
        isMovie: true,
        trailerUrl: 'https://example.com/trailer/city-shadows',
    },
    {
        title: '[Sample] Weekend Classics Re-Release',
        description: 'Top-rated classics brought back for a limited weekend run.',
        venue: 'Bole Art House',
        daysFromNow: 6,
        featured: false,
        rating: 'PG',
        duration: 110,
        isPublic: true,
        isMovie: true,
        trailerUrl: 'https://example.com/trailer/weekend-classics',
    },
    {
        title: '[Sample] New Voices Festival Closing Film',
        description: 'Closing night screening from the New Voices film festival.',
        venue: 'Friendship Hall Cinema',
        daysFromNow: 9,
        featured: true,
        rating: 'PG-13',
        duration: 116,
        isPublic: true,
        isMovie: true,
        trailerUrl: 'https://example.com/trailer/new-voices-closing',
    },
];

function toFutureDate(daysFromNow: number): Date {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + daysFromNow);
    d.setHours(19, 30, 0, 0);
    return d;
}

async function main() {
    console.log('Seeding sample recommended movies...');

    const organizer = await prisma.organizerProfile.findFirst({
        where: { status: 'APPROVED' },
        select: { id: true, organizationName: true },
    });

    if (!organizer) {
        throw new Error('No approved organizer found. Please create/approve an organizer first.');
    }

    const moviesCategory = await prisma.mainCategory.findFirst({
        where: {
            OR: [{ slug: 'movies' }, { name: { equals: 'Movies', mode: 'insensitive' } }],
        },
        select: { id: true, name: true },
    });

    if (!moviesCategory) {
        throw new Error('Movies category not found. Please run category seed first.');
    }

    const addis = await prisma.city.findFirst({
        where: { slug: 'addis-ababa' },
        select: { id: true, name: true },
    });

    const fallbackCity = await prisma.city.findFirst({
        select: { id: true, name: true },
    });

    const city = addis || fallbackCity;
    if (!city) {
        throw new Error('No city found. Please run city seed first.');
    }

    let created = 0;
    let updated = 0;

    for (const sample of SAMPLE_MOVIES) {
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
            totalCapacity: 250,
            featured: sample.featured,
            organizerId: organizer.id,
            categoryId: moviesCategory.id,
            cityId: city.id,
            isMovie: sample.isMovie,
            duration: sample.duration,
            rating: sample.rating,
            trailerUrl: sample.trailerUrl,
            isPublic: sample.isPublic,
            coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
            refundPolicy: 'No refunds within 24 hours of event.',
        };

        if (existing) {
            await prisma.event.update({
                where: { id: existing.id },
                data,
            });
            updated++;
            console.log(`Updated: ${sample.title}`);
        } else {
            await prisma.event.create({
                data,
            });
            created++;
            console.log(`Created: ${sample.title}`);
        }
    }

    console.log(`Done. Created: ${created}, Updated: ${updated}`);
    console.log(`Organizer: ${organizer.organizationName}`);
    console.log(`Category: ${moviesCategory.name}`);
    console.log(`City: ${city.name}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
