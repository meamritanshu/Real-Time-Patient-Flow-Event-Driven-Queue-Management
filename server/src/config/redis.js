import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

let redisClient = null;

export const getRedisClient = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) {
          return null; // Stop retrying to trigger fallback
        }
        return 200;
      },
      lazyConnect: false,
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis server instance');
    });

    client.on('error', (err) => {
      if (!redisClient || redisClient.isMock) {
        // Handled via fallback
        return;
      }
      console.warn('⚠️ Redis error encountered:', err.message);
    });

    redisClient = client;
    return redisClient;
  } catch (error) {
    console.warn(`⚠️ Failed to instantiate Redis client (${error.message}). Using ioredis-mock fallback...`);
    redisClient = new RedisMock();
    redisClient.isMock = true;
    return redisClient;
  }
};

export const initRedisWithFallback = async () => {
  const client = getRedisClient();
  try {
    await client.ping();
  } catch (err) {
    console.warn('⚠️ Redis ping failed. Switching to ioredis-mock...');
    if (redisClient && typeof redisClient.disconnect === 'function') {
      try { redisClient.disconnect(); } catch (_) {}
    }
    redisClient = new RedisMock();
    redisClient.isMock = true;
    console.log('🚀 Initialized ioredis-mock for ultra-fast in-memory caching');
  }
  return redisClient;
};
