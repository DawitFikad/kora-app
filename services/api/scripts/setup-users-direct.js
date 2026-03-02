const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to Database.');

        // 1. Create/Update ADMIN
        const adminPhone = '+251910639875';
        console.log(`Setting up Admin: ${adminPhone}`);
        const adminRes = await client.query('SELECT id FROM "User" WHERE "phoneNumber" = $1', [adminPhone]);
        let adminId;
        if (adminRes.rows.length === 0) {
            const insertRes = await client.query(
                'INSERT INTO "User" ("phoneNumber", "role", "status", "updatedAt") VALUES ($1, \'ADMIN\', \'ACTIVE\', NOW()) RETURNING id',
                [adminPhone]
            );
            adminId = insertRes.rows[0].id;
            await client.query(
                'INSERT INTO "UserProfile" ("userId", "fullName", "language", "updatedAt") VALUES ($1, \'System Admin\', \'en\', NOW())',
                [adminId]
            );
            console.log('Created new Admin user.');
        } else {
            adminId = adminRes.rows[0].id;
            await client.query('UPDATE "User" SET "role" = \'ADMIN\', "status" = \'ACTIVE\' WHERE id = $1', [adminId]);
            console.log('Updated existing user to Admin.');
        }

        // 2. Create/Update ORGANIZER
        const orgPhone = '+251922222222';
        console.log(`Setting up Organizer: ${orgPhone}`);
        const orgRes = await client.query('SELECT id FROM "User" WHERE "phoneNumber" = $1', [orgPhone]);
        let orgId;
        if (orgRes.rows.length === 0) {
            const insertRes = await client.query(
                'INSERT INTO "User" ("phoneNumber", "role", "status", "updatedAt") VALUES ($1, \'ORGANIZER\', \'ACTIVE\', NOW()) RETURNING id',
                [orgPhone]
            );
            orgId = insertRes.rows[0].id;
            await client.query(
                'INSERT INTO "UserProfile" ("userId", "fullName", "language", "updatedAt") VALUES ($1, \'Master Organizer\', \'en\', NOW())',
                [orgId]
            );
            console.log('Created new Organizer user.');
        } else {
            orgId = orgRes.rows[0].id;
            await client.query('UPDATE "User" SET "role" = \'ORGANIZER\', "status" = \'ACTIVE\' WHERE id = $1', [orgId]);
            console.log('Updated existing user to Organizer.');
        }

        // Ensure Organizer Profile exists
        const profileRes = await client.query('SELECT id FROM "OrganizerProfile" WHERE "userId" = $1', [orgId]);
        if (profileRes.rows.length === 0) {
            await client.query(
                'INSERT INTO "OrganizerProfile" ("userId", "organizationName", "contactPhone", "city", "payoutDetails", "status", "operatingCities", "categoryFocus", "updatedAt") VALUES ($1, \'Master Events\', $2, \'Addis Ababa\', \'Direct Deposit\', \'APPROVED\', ARRAY[\'Addis Ababa\'], ARRAY[\'Music\', \'Comedy\'], NOW())',
                [orgId, orgPhone]
            );
            console.log('Created Organizer Profile.');
        } else {
            await client.query('UPDATE "OrganizerProfile" SET "status" = \'APPROVED\' WHERE "userId" = $1', [orgId]);
            console.log('Ensured Organizer Profile is APPROVED.');
        }

        console.log('SUCCESS: Seeded Admin and Organizer users.');

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
