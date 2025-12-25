
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const events = await prisma.event.findMany({
        select: { id: true, title: true, status: true }
    });
    console.table(events);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
