import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides REDIS_URL or REDIS_PRIVATE_URL.
// We use a fallback that won't crash the app if Redis is temporarily unavailable.
const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;

const redisClient = new Redis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // If no URL is found, we don't want to crash on '::1' connection attempts
  lazyConnect: !redisUrl
});

redisClient.on('error', (err) => {
  // Only log if we actually have a URL, otherwise ignore local connection failures
  if (redisUrl) {
    console.error('Redis Client Error:', err.message);
  }
});

export default redisClient;
