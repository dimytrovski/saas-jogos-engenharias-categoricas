import { createClient } from 'redis';

const globalForRedis = global as unknown as { redis: ReturnType<typeof createClient> };

export const redis = globalForRedis.redis ?? createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) return new Error('Redis connection exhausted');
      return Math.min(retries * 50, 2000);
    }
  }
});

redis.on('error', (err) => console.error('Redis Client Error', err));

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function getCachedStreamState(key: string) {
  try {
    if (!redis.isOpen) await redis.connect();
    return await redis.get(key);
  } catch (e) {
    console.error('Cache read fail, falling back to DB', e);
    return null;
  }
}

export async function setCachedStreamState(key: string, value: string, ttlSeconds: number = 60) {
  try {
    if (!redis.isOpen) await redis.connect();
    await redis.setEx(key, ttlSeconds, value);
  } catch (e) {
    console.error('Cache write fail', e);
  }
}
