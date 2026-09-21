import Redis from 'ioredis';
import logger from '@homesphere/logger';

let redisClient = null;

/**
 * Initializes and returns a singleton Redis client.
 * @param {string} url - Redis connection URL (e.g., redis://localhost:6380)
 * @returns {Redis} The ioredis client instance
 */
export const connectRedis = (url = process.env.REDIS_URL || 'redis://localhost:6380') => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: null, // Required by rate-limit-redis / bullmq
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    logger.info('📦 Redis client connected');
  });

  redisClient.on('error', (error) => {
    logger.error({ error }, '❌ Redis client error');
  });

  return redisClient;
};

/**
 * Gets the current singleton Redis client, throwing an error if not connected.
 * @returns {Redis} The ioredis client instance
 */
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client has not been initialized. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Caches a value for a specific TTL.
 * @param {string} key 
 * @param {any} value - Will be JSON.stringified
 * @param {number} ttlSeconds 
 */
export const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error({ error, key }, 'Failed to set cache');
  }
};

/**
 * Retrieves a cached value.
 * @param {string} key 
 * @returns {any|null} The parsed value or null if not found
 */
export const getCache = async (key) => {
  try {
    const client = getRedisClient();
    const result = await client.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    logger.error({ error, key }, 'Failed to get cache');
    return null;
  }
};
