import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async increment(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  getClient(): Redis {
    return this.redis;
  }
}
