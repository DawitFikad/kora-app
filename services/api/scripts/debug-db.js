const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('--- USERS ---');
        const users = await client.query('SELECT id, "phoneNumber", role, status FROM "User"');
        console.log(JSON.stringify(users.rows, null, 2));

        console.log('\n--- ORGANIZER PROFILES ---');
        const orgs = await client.query('SELECT id, "organizationName", "status", "userId" FROM "OrganizerProfile"');
        console.log(JSON.stringify(orgs.rows, null, 2));
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

main();
