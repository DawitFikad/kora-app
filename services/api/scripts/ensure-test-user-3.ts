import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { id: 3 } });

  if (existing) {
    console.log('User id=3 already exists.');
    return;
  }

  await prisma.user.create({
    data: {
      id: 3,
      phoneNumber: '+251900000003',
      email: 'rating-user3@example.com',
      role: Role.USER,
      profile: {
        create: {
          fullName: 'Rating User 3',
          language: 'en',
        },
      },
    },
  });

  console.log('Created user id=3 for token-based testing.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
