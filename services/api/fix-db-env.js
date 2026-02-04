const { execSync } = require('child_process');

const envVars = {
    DATABASE_URL: 'postgresql://postgres.ywgoqqbqemcevgdyozca:*4a%2FhGRdL9QV7Nn@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true',
    DIRECT_URL: 'postgresql://postgres.ywgoqqbqemcevgdyozca:*4a%2FhGRdL9QV7Nn@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
};

for (const [key, value] of Object.entries(envVars)) {
    console.log(`Setting ${key}...`);

    // Remove first
    try {
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'inherit' });
    } catch (e) {
        // Ignore if doesn't exist
    }

    // Add using direct command (no piping)
    execSync(`npx vercel env add ${key} production --value="${value}"`, { stdio: 'inherit' });
    console.log(`✅ ${key} set`);
}

console.log('\n✅ All environment variables updated!');
