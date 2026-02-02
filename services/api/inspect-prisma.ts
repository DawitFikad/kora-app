import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const dmmf = (prisma as any)._dmmf;
    const organizerProfileModel = dmmf.datamodel.models.find((m: any) => m.name === 'OrganizerProfile');
    console.log('OrganizerProfile fields:', organizerProfileModel.fields.map((f: any) => f.name));
    await prisma.$disconnect();
}

main();
