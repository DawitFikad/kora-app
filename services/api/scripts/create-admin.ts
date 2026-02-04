import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];
    const phoneNumber = process.argv[4];

    if (!email || !password || !phoneNumber) {
        console.error('Usage: npx ts-node scripts/create-admin.ts <email> <password> <phoneNumber>');
        process.exit(1);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role: Role.ADMIN,
                status: AccountStatus.ACTIVE,
                password: hashedPassword, // Optional: update password if user exists
            },
            create: {
                email,
                phoneNumber,
                password: hashedPassword,
                role: Role.ADMIN,
                status: AccountStatus.ACTIVE,
            },
        });

        console.log(`✅ Admin user configured: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
