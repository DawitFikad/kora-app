// Set environment variables
process.env.DATABASE_URL = "postgresql://postgres:2123@localhost:5432/Et-ticket-db?schema=public";
process.env.DIRECT_URL = "postgresql://postgres:2123@localhost:5432/Et-ticket-db?schema=public";
process.env.REDIS_URL = "redis://localhost:6379";

// Start the server
require('./dist/server.js');
