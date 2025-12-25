const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const phones = ['0910639875', '910639875'];

        for (const phone of phones) {
            console.log(`Processing ${phone}...`);
            const userRes = await client.query(
                'UPDATE "User" SET role = \'ORGANIZER\', status = \'PENDING\' WHERE "phoneNumber" = $1 RETURNING id',
                [phone]
            );

            if (userRes.rows.length > 0) {
                const userId = userRes.rows[0].id;
                await client.query(`
                    INSERT INTO "OrganizerProfile" ("userId", "organizationName", status, city, "contactPhone", "contactEmail", "payoutDetails", "updatedAt")
                    VALUES ($1, 'My Test Organization', 'PENDING', 'Addis Ababa', $2, 'test@example.com', 'TBD', NOW())
                    ON CONFLICT ("userId") DO UPDATE SET status = 'PENDING', "updatedAt" = NOW()
                `, [userId, phone]);
                console.log(`Success: ${phone} updated.`);
            } else {
                console.log(`User ${phone} not found.`);
            }
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
