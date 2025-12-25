const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        // Set all existing ORGANIZER users to ACTIVE if they have an APPROVED profile
        const result = await client.query(`
            UPDATE "User"
            SET status = 'ACTIVE'
            FROM "OrganizerProfile"
            WHERE "User".id = "OrganizerProfile"."userId"
            AND "OrganizerProfile".status = 'APPROVED'
        `);
        console.log(`Updated ${result.rowCount} users to ACTIVE`);
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
