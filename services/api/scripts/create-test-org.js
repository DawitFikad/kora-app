const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        // 1. Create a User
        const phone = '+251911223344';
        const check = await client.query('SELECT id FROM "User" WHERE "phoneNumber" = $1', [phone]);

        let userId;
        if (check.rows.length === 0) {
            const userRes = await client.query(
                'INSERT INTO "User" ("phoneNumber", role, status, "createdAt", "updatedAt") VALUES ($1, \'ORGANIZER\', \'PENDING\', NOW(), NOW()) RETURNING id',
                [phone]
            );
            userId = userRes.rows[0].id;
        } else {
            userId = check.rows[0].id;
        }

        // 2. Create Organizer Profile
        const orgRes = await client.query(
            'INSERT INTO "OrganizerProfile" ("userId", "organizationName", status, city, "contactPhone", "contactEmail", "payoutDetails", "createdAt", "updatedAt") VALUES ($1, \'Habesha Festivals\', \'PENDING\', \'Addis Ababa\', $2, \'events@habesha.com\', \'Bank Transfer: CBE 1000123456789\', NOW(), NOW()) ON CONFLICT ("userId") DO UPDATE SET status = \'PENDING\' RETURNING id',
            [userId, phone]
        );

        console.log(`Created/Reset test pending organizer: Habesha Festivals (ID: ${orgRes.rows[0].id})`);
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
