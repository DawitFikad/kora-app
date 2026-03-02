import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearCategories() {
    console.log('Deleting sub-categories...');
    await prisma.category.deleteMany({ where: { parentId: { not: null } } });
    console.log('Deleting main categories...');
    await prisma.category.deleteMany({});
    console.log('Categories cleared.');
}

clearCategories()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
