// Redis Connection Configuration for BullMQ

import Redis from 'ioredis';

/**
 * Create Redis connection for BullMQ
 * BullMQ requires a Redis connection for job storage
 */
export function createRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // Use Redis URL if provided (production)
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    });
  }

  // Use individual config (development)
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  });
}

/**
 * Shared Redis connection instance
 * Reuse across multiple queues to avoid connection overhead
 */
let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = createRedisConnection();

    // Log connection events
    redisConnection.on('connect', () => {
      console.log('Redis connected');
    });

    redisConnection.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisConnection.on('close', () => {
      console.log('Redis connection closed');
    });
  }

  return redisConnection;
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    console.log('Redis connection closed gracefully');
  }
}
