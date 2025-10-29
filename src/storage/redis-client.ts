import { RedisClient } from '@devvit/public-api';

export interface StorageClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ttl?: number }): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  zadd(key: string, score: number, member: string): Promise<void>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, member: string): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
}

export class EnhancedRedisClient implements StorageClient {
  constructor(private redis: RedisClient) {}

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    try {
      await this.redis.set(key, value);
      if (options?.ttl) {
        await this.expire(key, options.ttl);
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      // Note: Redis keys operation is expensive, use sparingly
      // In production, consider using SCAN instead
      const allKeys: string[] = [];
      // This is a simplified implementation - in real Redis you'd use SCAN
      // For Devvit Redis, we'll need to track keys manually or use a different approach
      return allKeys;
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      console.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.redis.hset(key, { [field]: value });
    } catch (error) {
      console.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.redis.hdel(key, field);
    } catch (error) {
      console.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key) || {};
    } catch (error) {
      console.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    try {
      await this.redis.zadd(key, { [member]: score });
    } catch (error) {
      console.error(`Redis ZADD error for key ${key}:`, error);
      throw error;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.zrange(key, start, stop);
    } catch (error) {
      console.error(`Redis ZRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.zrevrange(key, start, stop);
    } catch (error) {
      console.error(`Redis ZREVRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async zrem(key: string, member: string): Promise<void> {
    try {
      await this.redis.zrem(key, member);
    } catch (error) {
      console.error(`Redis ZREM error for key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }
}

// Key generation utilities
export class KeyGenerator {
  static trainer(trainerId: string): string {
    return `trainer:${trainerId}`;
  }

  static trainerProfile(trainerId: string): string {
    return `trainer:profile:${trainerId}`;
  }

  static trainerAnimals(trainerId: string): string {
    return `trainer:animals:${trainerId}`;
  }

  static animal(animalId: string): string {
    return `animal:${animalId}`;
  }

  static battle(battleId: string): string {
    return `battle:${battleId}`;
  }

  static habitat(habitatId: string): string {
    return `habitat:${habitatId}`;
  }

  static leaderboard(type: string): string {
    return `leaderboard:${type}`;
  }

  static dailyPuzzle(date: string): string {
    return `puzzle:daily:${date}`;
  }

  static userScore(username: string): string {
    return `user:score:${username}`;
  }

  static userStreak(username: string): string {
    return `user:streak:${username}`;
  }

  static cache(category: string, id: string): string {
    return `cache:${category}:${id}`;
  }

  static session(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static migration(version: string): string {
    return `migration:${version}`;
  }
}