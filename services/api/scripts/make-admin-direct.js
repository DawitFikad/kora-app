const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const phoneNumber = process.argv[2];
    if (!phoneNumber) {
        console.error('Please provide a phone number: node scripts/make-admin-direct.js +251912345678');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to Database.');

        // 1. Find the user
        const res = await client.query('SELECT id FROM "User" WHERE "phoneNumber" = $1', [phoneNumber]);

        if (res.rows.length === 0) {
            console.log('User not found. Creating new ADMIN user...');
            // Create user
            const insertRes = await client.query(
                'INSERT INTO "User" ("phoneNumber", "role", "status", "updatedAt") VALUES ($1, \'ADMIN\', \'ACTIVE\', NOW()) RETURNING id',
                [phoneNumber]
            );
            const userId = insertRes.rows[0].id;

            // Create profile
            await client.query(
                'INSERT INTO "UserProfile" ("userId", "fullName", "language", "updatedAt") VALUES ($1, \'System Admin\', \'en\', NOW())',
                [userId]
            );
            console.log(`SUCCESS: Created new ADMIN user with ID ${userId}.`);
        } else {
            const userId = res.rows[0].id;
            console.log(`Found user ${userId}. Promoting to ADMIN...`);
            await client.query('UPDATE "User" SET "role" = \'ADMIN\', "status" = \'ACTIVE\' WHERE id = $1', [userId]);
            console.log(`SUCCESS: User ${phoneNumber} is now ADMIN.`);
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
