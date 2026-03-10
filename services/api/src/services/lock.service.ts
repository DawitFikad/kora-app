import redis from "../utils/redis";

interface LockedSeatInfo {
    userId: string;
    ttl: number;
}

export class LockService {
    private static SEAT_LOCK_TTL = 300; // 5 minutes in seconds
    private static CAPACITY_LOCK_TTL = 300;

    static setLockTtls(seconds: number) {
        const ttl = Math.max(60, Math.min(1800, Math.floor(seconds)));
        this.SEAT_LOCK_TTL = ttl;
        this.CAPACITY_LOCK_TTL = ttl;
    }

    /**
     * Attempts to lock a specific seat for a user.
     * Returns true if successful, false if already locked.
     */
    static async lockSeat(eventId: number, tierId: number, seatNumber: string, userId: number): Promise<boolean> {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
        // First check if user already has this seat locked
        const existing = await redis.get(key);
        if (existing === userId.toString()) {
            // Refresh the lock
            await redis.expire(key, this.SEAT_LOCK_TTL);
            return true;
        }
        const result = await redis.set(key, userId.toString(), "EX", this.SEAT_LOCK_TTL, "NX");
        return result === "OK";
    }

    /**
     * Releases a seat lock.
     */
    static async unlockSeat(eventId: number, tierId: number, seatNumber: string) {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
        await redis.del(key);
    }

    /**
     * Checks if a seat is currently locked by someone else.
     */
    static async getSeatLock(eventId: number, tierId: number, seatNumber: string): Promise<string | null> {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
        return redis.get(key);
    }

    /**
     * Gets all locked seats for an event tier with their TTL
     */
    static async getLockedSeats(eventId: number, tierId: number): Promise<Record<string, LockedSeatInfo>> {
        const pattern = `lock:event:${eventId}:tier:${tierId}:seat:*`;
        const keys = await redis.keys(pattern);

        const lockedSeats: Record<string, LockedSeatInfo> = {};

        for (const key of keys) {
            const seatNumber = key.split(':').pop()!;
            const userId = await redis.get(key);
            const ttl = await redis.ttl(key);

            if (userId && ttl > 0) {
                lockedSeats[seatNumber] = { userId, ttl };
            }
        }

        return lockedSeats;
    }

    /**
     * Reserves capacity for a user using a temporary Redis counter.
     * Returns true if capacity is available and successfully locked.
     */
    static async reserveCapacity(eventId: number, tierId: number, userId: number, quantity: number, maxAvailable: number): Promise<boolean> {
        const lockedKey = `lock:event:${eventId}:tier:${tierId}:capacity:reserved`;
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;

        // We use a LUA script or atomic check-and-increment to prevent race conditions
        const luaScript = `
            local reserved = tonumber(redis.call('GET', KEYS[1]) or 0)
            local max = tonumber(ARGV[1])
            local requested = tonumber(ARGV[2])
            
            if (reserved + requested) <= max then
                redis.call('INCRBY', KEYS[1], requested)
                redis.call('SET', KEYS[2], requested, 'EX', ARGV[3])
                return 1
            else
                return 0
            end
        `;

        const result = await redis.eval(luaScript, 2, lockedKey, userLockKey, maxAvailable, quantity, this.CAPACITY_LOCK_TTL);
        return result === 1;
    }

    /**
     * Releases reserved capacity.
     */
    static async releaseCapacity(eventId: number, tierId: number, userId: number) {
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;
        const lockedKey = `lock:event:${eventId}:tier:${tierId}:capacity:reserved`;

        const qty = await redis.get(userLockKey);
        if (qty) {
            await redis.decrby(lockedKey, parseInt(qty));
            await redis.del(userLockKey);
        }
    }

    /**
     * Refreshes the lock TTL for a user's capacity reservation
     */
    static async refreshCapacityLock(eventId: number, tierId: number, userId: number): Promise<boolean> {
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;
        const exists = await redis.exists(userLockKey);

        if (exists) {
            await redis.expire(userLockKey, this.CAPACITY_LOCK_TTL);
            return true;
        }

        return false;
    }

    /**
     * Gets the current reserved capacity count for a tier
     */
    static async getReservedCapacity(eventId: number, tierId: number): Promise<number> {
        const lockedKey = `lock:event:${eventId}:tier:${tierId}:capacity:reserved`;
        const reserved = await redis.get(lockedKey);
        return reserved ? parseInt(reserved) : 0;
    }

    /**
     * Gets a user's current capacity reservation
     */
    static async getUserCapacityLock(eventId: number, tierId: number, userId: number): Promise<{ quantity: number; ttl: number } | null> {
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;
        const qty = await redis.get(userLockKey);
        const ttl = await redis.ttl(userLockKey);

        if (qty && ttl > 0) {
            return { quantity: parseInt(qty), ttl };
        }

        return null;
    }
}
