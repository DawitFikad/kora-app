import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Seeding initial data...");

    // Categories
    const categories = [
        { name: "Movie", slug: "movie" },
        { name: "Concert", slug: "concert" },
        { name: "Sport", slug: "sport" },
        { name: "Theater", slug: "theater" },
        { name: "Festival", slug: "festival" },
        { name: "Conference", slug: "conference" },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log("Categories seeded.");

    // Cities
    const cities = [
        { name: "Addis Ababa", slug: "addis-ababa" },
        { name: "Hawassa", slug: "hawassa" },
        { name: "Bahir Dar", slug: "bahir-dar" },
        { name: "Jimma", slug: "jimma" },
        { name: "Adama", slug: "adama" },
        { name: "Mekelle", slug: "mekelle" },
    ];

    for (const city of cities) {
        await prisma.city.upsert({
            where: { slug: city.slug },
            update: {},
            create: city,
        });
    }
    console.log("Cities seeded.");

    console.log("Seeding complete.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
