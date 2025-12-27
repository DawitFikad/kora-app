const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Cities and Categories...');

    const cities = [
        { name: 'Addis Ababa', slug: 'addis-ababa' },
        { name: 'Gondar', slug: 'gondar' },
        { name: 'Mekelle', slug: 'mekelle' },
        { name: 'Adama', slug: 'adama' },
        { name: 'Hawassa', slug: 'hawassa' },
        { name: 'Bahir Dar', slug: 'bahir-dar' },
        { name: 'Dire Dawa', slug: 'dire-dawa' },
        { name: 'Dessie', slug: 'dessie' },
        { name: 'Jimma', slug: 'jimma' },
        { name: 'Jijiga', slug: 'jijiga' },
        { name: 'Shashamane', slug: 'shashamane' },
        { name: 'Bishoftu', slug: 'bishoftu' },
        { name: 'Sodo', slug: 'sodo' },
        { name: 'Arba Minch', slug: 'arba-minch' },
        { name: 'Hosaena', slug: 'hosaena' }
    ];

    const categories = [
        { name: 'Music', slug: 'music' },
        { name: 'Concert', slug: 'concert' },
        { name: 'Workshop', slug: 'workshop' },
        { name: 'Seminar', slug: 'seminar' },
        { name: 'Nightlife', slug: 'nightlife' },
        { name: 'Sports', slug: 'sports' },
        { name: 'Festival', slug: 'festival' },
        { name: 'Theater', slug: 'theater' },
        { name: 'Exhibition', slug: 'exhibition' },
        { name: 'Other', slug: 'other' }
    ];

    // Seed Cities
    for (const city of cities) {
        await prisma.city.upsert({
            where: { slug: city.slug },
            update: {},
            create: city,
        });
    }
    console.log(`✅ Seeded ${cities.length} cities.`);

    // Seed Categories
    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        });
    }
    console.log(`✅ Seeded ${categories.length} categories.`);

    console.log('✨ Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
