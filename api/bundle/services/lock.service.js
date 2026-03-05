"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockService = void 0;
const redis_1 = __importDefault(require("../utils/redis"));
class LockService {
    /**
     * Attempts to lock a specific seat for a user.
     * Returns true if successful, false if already locked.
     */
    static async lockSeat(eventId, tierId, seatNumber, userId) {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
        // First check if user already has this seat locked
        const existing = await redis_1.default.get(key);
        if (existing === userId.toString()) {
            // Refresh the lock
            await redis_1.default.expire(key, this.SEAT_LOCK_TTL);
            return true;
        }
        const result = await redis_1.default.set(key, userId.toString(), "EX", this.SEAT_LOCK_TTL, "NX");
        return result === "OK";
    }
    /**
     * Releases a seat lock.
     */
    static async unlockSeat(eventId, tierId, seatNumber) {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
        await redis_1.default.del(key);
    }
    /**
     * Checks if a seat is currently locked by someone else.
     */
    static async getSeatLock(eventId, tierId, seatNumber) {
        const key = `lock:event:${eventId}:tier:${tierId}:seat:${seatNumber}`;
        return redis_1.default.get(key);
    }
    /**
     * Gets all locked seats for an event tier with their TTL
     */
    static async getLockedSeats(eventId, tierId) {
        const pattern = `lock:event:${eventId}:tier:${tierId}:seat:*`;
        const keys = await redis_1.default.keys(pattern);
        const lockedSeats = {};
        for (const key of keys) {
            const seatNumber = key.split(':').pop();
            const userId = await redis_1.default.get(key);
            const ttl = await redis_1.default.ttl(key);
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
    static async reserveCapacity(eventId, tierId, userId, quantity, maxAvailable) {
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
        const result = await redis_1.default.eval(luaScript, 2, lockedKey, userLockKey, maxAvailable, quantity, this.CAPACITY_LOCK_TTL);
        return result === 1;
    }
    /**
     * Releases reserved capacity.
     */
    static async releaseCapacity(eventId, tierId, userId) {
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;
        const lockedKey = `lock:event:${eventId}:tier:${tierId}:capacity:reserved`;
        const qty = await redis_1.default.get(userLockKey);
        if (qty) {
            await redis_1.default.decrby(lockedKey, parseInt(qty));
            await redis_1.default.del(userLockKey);
        }
    }
    /**
     * Refreshes the lock TTL for a user's capacity reservation
     */
    static async refreshCapacityLock(eventId, tierId, userId) {
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;
        const exists = await redis_1.default.exists(userLockKey);
        if (exists) {
            await redis_1.default.expire(userLockKey, this.CAPACITY_LOCK_TTL);
            return true;
        }
        return false;
    }
    /**
     * Gets the current reserved capacity count for a tier
     */
    static async getReservedCapacity(eventId, tierId) {
        const lockedKey = `lock:event:${eventId}:tier:${tierId}:capacity:reserved`;
        const reserved = await redis_1.default.get(lockedKey);
        return reserved ? parseInt(reserved) : 0;
    }
    /**
     * Gets a user's current capacity reservation
     */
    static async getUserCapacityLock(eventId, tierId, userId) {
        const userLockKey = `lock:event:${eventId}:tier:${tierId}:user:${userId}:qty`;
        const qty = await redis_1.default.get(userLockKey);
        const ttl = await redis_1.default.ttl(userLockKey);
        if (qty && ttl > 0) {
            return { quantity: parseInt(qty), ttl };
        }
        return null;
    }
}
exports.LockService = LockService;
LockService.SEAT_LOCK_TTL = 300; // 5 minutes in seconds
LockService.CAPACITY_LOCK_TTL = 300;
