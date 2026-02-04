import Redis from "ioredis";

// Lazy Redis wrapper to prevent connection errors on Vercel
// where Redis might not be available or needed (e.g. Admin Bypass)
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let client: Redis | null = null;

const getClient = () => {
    if (!client || (client.status === 'end' || client.status === 'close')) {
        console.log("[Redis] Initializing or recreating connection...");
        try {
            client = new Redis(redisUrl, {
                lazyConnect: true,
                maxRetriesPerRequest: 1, // Fail fast on Vercel
                retryStrategy: (times) => {
                    if (times > 1) return null; // Only retry once
                    return 50;
                },
                connectTimeout: 500, // Half a second timeout
            });

            client.on("error", (err) => {
                // Silently log and don't crash
                console.error("[Redis] Optional Service Error:", err.message);
            });
        } catch (e) {
            console.error("[Redis] Critical initialization failed", e);
            client = null;
        }
    }
    return client;
};

// Proxy to forward calls to the lazy client, but check for existence
const redisProxy = new Proxy({} as Redis, {
    get: (_target, prop) => {
        const redis = getClient();
        if (!redis) {
            // Return a dummy object if redis is unavailable
            return () => Promise.resolve(null);
        }
        // @ts-ignore
        const value = redis[prop];
        if (typeof value === 'function') {
            return value.bind(redis);
        }
        return value;
    }
});

export default redisProxy;
