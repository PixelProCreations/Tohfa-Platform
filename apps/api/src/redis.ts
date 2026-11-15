/**
 * Redis connections.
 *
 * Two separate clients on purpose:
 *  - `redis`      general purpose (OTP storage, cart locks, rate limiting).
 *  - `queueRedis` reserved for BullMQ, which requires
 *                 `maxRetriesPerRequest: null` and blocks connections for its
 *                 workers. Sharing one client makes queues and app code stall
 *                 each other.
 */
import { Redis, type RedisOptions } from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

const baseOptions: RedisOptions = {
  // In tests we connect on first use so that importing a module does not open
  // a socket; in every other environment we connect eagerly so a bad REDIS_URL
  // shows up at boot rather than on the first OTP request.
  lazyConnect: config.isTest,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  retryStrategy: (attempt: number) => Math.min(attempt * 1000, 10_000),
};

export const redis = new Redis(config.REDIS_URL, {
  ...baseOptions,
  maxRetriesPerRequest: 3,
});

/** BullMQ mandates `maxRetriesPerRequest: null`; do not "tidy" this away. */
export const queueRedis = new Redis(config.REDIS_URL, {
  ...baseOptions,
  maxRetriesPerRequest: null,
});

const lastLoggedError = new Map<string, number>();

for (const [name, client] of [
  ['redis', redis],
  ['queueRedis', queueRedis],
] as const) {
  client.on('error', (error: Error) => {
    const now = Date.now();
    const last = lastLoggedError.get(name) || 0;
    // In development, avoid flooding the terminal with endless ECONNREFUSED logs
    if (now - last > 60_000) {
      lastLoggedError.set(name, now);
      if (!config.isProduction && !config.isTest) {
        logger.warn(
          { client: name, url: config.REDIS_URL },
          `Redis is not reachable at ${config.REDIS_URL} (${error.message || 'ECONNREFUSED'}). Rate limiting and token invalidation fail open; background queues are paused.`,
        );
      } else {
        logger.error({ err: error, client: name }, 'redis client error');
      }
    }
  });

  client.on('connect', () => {
    logger.info({ client: name }, 'Redis connected successfully');
    lastLoggedError.delete(name);
  });
}

export async function pingRedis(): Promise<boolean> {
  const reply = await redis.ping();
  return reply === 'PONG';
}

export async function closeRedis(): Promise<void> {
  await Promise.allSettled([redis.quit(), queueRedis.quit()]);
}
