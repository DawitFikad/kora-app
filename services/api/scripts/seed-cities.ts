import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES = [
    { name: 'Adama', slug: 'adama' },
    { name: 'Addis Ababa', slug: 'addis-ababa' },
    { name: 'Adigrat', slug: 'adigrat' },
    { name: 'Ambo', slug: 'ambo' },
    { name: 'Arba Minch', slug: 'arba-minch' },
    { name: 'Asella', slug: 'asella' },
    { name: 'Assosa', slug: 'assosa' },
    { name: 'Bahir Dar', slug: 'bahir-dar' },
    { name: 'Bale Robe', slug: 'bale-robe' },
    { name: 'Bishoftu', slug: 'bishoftu' },
    { name: 'Bonga', slug: 'bonga' },
    { name: 'Butajira', slug: 'butajira' },
    { name: 'Debre Birhan', slug: 'debre-birhan' },
    { name: 'Debre Markos', slug: 'debre-markos' },
    { name: 'Dessie', slug: 'dessie' },
    { name: 'Dire Dawa', slug: 'dire-dawa' },
    { name: 'Finote Selam', slug: 'finote-selam' },
    { name: 'Gambela', slug: 'gambela' },
    { name: 'Gimbi', slug: 'gimbi' },
    { name: 'Gondar', slug: 'gondar' },
    { name: 'Harar', slug: 'harar' },
    { name: 'Hawassa', slug: 'hawassa' },
    { name: 'Hosaena', slug: 'hosaena' },
    { name: 'Jimma', slug: 'jimma' },
    { name: 'Jijiga', slug: 'jijiga' },
    { name: 'Kombolcha', slug: 'kombolcha' },
    { name: 'Mekelle', slug: 'mekelle' },
    { name: 'Mizan Teferi', slug: 'mizan-teferi' },
    { name: 'Mojo', slug: 'mojo' },
    { name: 'Nekemte', slug: 'nekemte' },
    { name: 'Sebeta', slug: 'sebeta' },
    { name: 'Semera', slug: 'semera' },
    { name: 'Shashamane', slug: 'shashamane' },
    { name: 'Shire', slug: 'shire' },
    { name: 'Weldiya', slug: 'weldiya' },
    { name: 'Werota', slug: 'werota' },
    { name: 'Wolaita Sodo', slug: 'wolaita-sodo' },
    { name: 'Wolkite', slug: 'wolkite' },
    { name: 'Yirgalem', slug: 'yirgalem' },
    { name: 'Ziway', slug: 'ziway' },
];

async function seed() {
    console.log('🌱 Seeding cities...');

    for (const city of CITIES) {
        const existing = await prisma.city.findUnique({
            where: { slug: city.slug }
        });

        if (!existing) {
            await prisma.city.create({
                data: city
            });
            console.log(`✅ Created city: ${city.name}`);
        } else {
            console.log(`⏩ City already exists: ${city.name}`);
        }
    }

    console.log(`🎉 City seeding complete! Total: ${CITIES.length} cities.`);
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
