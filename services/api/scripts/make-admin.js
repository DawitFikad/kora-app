const { PrismaClient, Role, AccountStatus, OrganizerStatus } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

function normalizeEthiopianPhone(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return '';
    const digits = trimmed.replace(/\D/g, '');
    const hasPlus = trimmed.startsWith('+');

    if (hasPlus && digits.startsWith('251')) return `+${digits}`;
    if (digits.startsWith('251')) return `+${digits}`;
    if (digits.startsWith('0') && digits.length === 10) return `+251${digits.slice(1)}`;
    if (digits.startsWith('9') && digits.length === 9) return `+251${digits}`;
    return trimmed;
}

async function main() {
    let rawPhone = process.argv[2];
    const roleArg = process.argv[3] ? process.argv[3].toUpperCase() : 'ADMIN';

    if (!rawPhone) {
        console.log('\n❌ Error: Please provide a phone number.');
        console.log('Usage: node scripts/make-admin.js <phone_number> [ADMIN|ORGANIZER]');
        console.log('Example: node scripts/make-admin.js 0911223344 ORGANIZER\n');
        process.exit(1);
    }

    let phoneNumber = normalizeEthiopianPhone(rawPhone);

    if (roleArg !== 'ADMIN' && roleArg !== 'ORGANIZER') {
        console.log('\n❌ Error: Role must be ADMIN or ORGANIZER');
        process.exit(1);
    }

    try {
        console.log(`\n🔍 Checking user with phone: ${phoneNumber}...`);

        const user = await prisma.user.upsert({
            where: { phoneNumber },
            update: {
                role: roleArg,
                status: AccountStatus.ACTIVE
            },
            create: {
                phoneNumber,
                role: roleArg,
                status: AccountStatus.ACTIVE,
                profile: {
                    create: {
                        fullName: roleArg === 'ADMIN' ? 'System ' + roleArg : 'Test ' + roleArg,
                        language: 'en'
                    }
                }
            },
        });

        if (roleArg === 'ORGANIZER') {
            await prisma.organizerProfile.upsert({
                where: { userId: user.id },
                update: {
                    status: OrganizerStatus.APPROVED
                },
                create: {
                    userId: user.id,
                    organizationName: 'Demo Organization',
                    status: OrganizerStatus.APPROVED,
                    contactEmail: 'demo@org.com',
                    contactPhone: phoneNumber,
                    city: 'Addis Ababa',
                    payoutDetails: 'CBE 1000123456789'
                }
            });
            console.log(`✅ SUCCESS: User is now an APPROVED ORGANIZER.`);
        } else {
            console.log('✅ SUCCESS!');
        }

        console.log('-----------------------------------');
        console.log(`User ID:   ${user.id}`);
        console.log(`Phone:     ${user.phoneNumber}`);
        console.log(`Role:      ${user.role}`);
        console.log(`Status:    ${user.status}`);
        console.log('-----------------------------------\n');

    } catch (error) {
        console.error('\n❌ FAILED to update user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
