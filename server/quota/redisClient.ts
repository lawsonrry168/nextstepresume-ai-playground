import { createClient, type RedisClientType } from "redis";
import type { RedisKv } from "./redisKv.ts";

const clients = new Map<string, RedisClientType>();

export function resolveRedisUrl(): string | undefined {
  const raw = process.env.NSR_REDIS_URL?.trim() || process.env.REDIS_URL?.trim();
  return raw || undefined;
}

async function getRedisClient(url: string): Promise<RedisClientType> {
  let client = clients.get(url);
  if (!client) {
    client = createClient({ url });
    client.on("error", (err) => {
      console.error("[quota/redis]", err);
    });
    await client.connect();
    clients.set(url, client);
  }
  return client;
}

export function createRedisKv(url: string): RedisKv {
  return {
    async get(key) {
      const client = await getRedisClient(url);
      return client.get(key);
    },
    async set(key, value, options) {
      const client = await getRedisClient(url);
      if (options?.EX) {
        await client.set(key, value, { EX: options.EX });
        return;
      }
      await client.set(key, value);
    },
    async keys(pattern) {
      const client = await getRedisClient(url);
      return client.keys(pattern);
    },
    async del(...keys) {
      if (keys.length === 0) return;
      const client = await getRedisClient(url);
      await client.del(keys);
    },
  };
}

/** Test helper — disconnect cached clients between test files. */
export async function disconnectRedisClientsForTests(): Promise<void> {
  const pending = [...clients.values()].map(async (client) => {
    if (client.isOpen) {
      await client.quit();
    }
  });
  await Promise.all(pending);
  clients.clear();
}
