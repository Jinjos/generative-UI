import Redis from "ioredis";

// Ensure REDIS_URL is defined
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not defined.");
}

// Global Redis client for reusability (especially in development with HMR)
let redis: Redis;

// Function to get the Redis client instance
function getRedisClient(): Redis {
  if (!redis) {
    // If client does not exist, create it
    redis = new Redis(process.env.REDIS_URL!, {
      // Optional: Add more ioredis options here
      // For example, connection timeouts, retries, etc.
      maxRetriesPerRequest: null, // Disable auto-retry for faster fail if server is down
      enableOfflineQueue: true, // Queue commands while offline and flush on reconnect
    });

    redis.on("error", (err) => {
      console.error("❌ Redis Client Error:", err);
      // Depending on the error, you might want to re-establish the connection
      // or handle it gracefully. For now, just log.
    });

    redis.on("connect", () => {
      console.log("✅ Redis Client Connected!");
    });

    redis.on("reconnecting", () => {
      console.warn("⚠️ Redis Client Reconnecting...");
    });
  }
  return redis;
}

// Export the client instance
export const redisClient = getRedisClient();

/**
 * Generates a standardized Redis key for storing user context (Beacon).
 * Key format: genui:context:{sessionId}
 */
export function getContextKey(sessionId: string): string {
  return `genui:context:${sessionId}`;
}
