const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const phone = '0910639875';

        // 1. Update User to ORGANIZER / PENDING
        const userRes = await client.query(
            'UPDATE "User" SET role = \'ORGANIZER\', status = \'PENDING\' WHERE "phoneNumber" = $1 RETURNING id',
            [phone]
        );

        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;

            // 2. Ensure Organizer Profile exists
            await client.query(`
                INSERT INTO "OrganizerProfile" ("userId", "organizationName", status, city, "contactPhone", "contactEmail", "payoutDetails")
                VALUES ($1, 'My Test Organization', 'PENDING', 'Addis Ababa', $2, 'test@example.com', 'TBD')
                ON CONFLICT ("userId") DO UPDATE SET status = 'PENDING'
            `, [userId, phone]);

            console.log(`Success: ${phone} is now a PENDING ORGANIZER.`);
        } else {
            console.log(`User ${phone} not found in database.`);
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
