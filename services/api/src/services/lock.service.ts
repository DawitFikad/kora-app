import redis from "../utils/redis";

export class LockService {
    private static SEAT_LOCK_TTL = 300; // 5 minutes in seconds
    private static CAPACITY_LOCK_TTL = 300;

    /**
     * Attempts to lock a specific seat for a user.
     * Returns true if successful, false if already locked.
     */
    static async lockSeat(eventId: number, tierId: number, seatNumber: string, userId: number): Promise<boolean> {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
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
}
