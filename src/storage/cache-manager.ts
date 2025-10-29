import { StorageClient, KeyGenerator } from './redis-client.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

export class CacheManager {
  private defaultTTL = 3600; // 1 hour default
  
  constructor(private storage: StorageClient) {}

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.buildCacheKey(key, options.prefix);
      const data = await this.storage.get(cacheKey);
      
      if (!data) {
        return null;
      }
      
      return options.serialize !== false ? JSON.parse(data) : data as T;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(key, options.prefix);
      const data = options.serialize !== false ? JSON.stringify(value) : value as string;
      const ttl = options.ttl || this.defaultTTL;
      
      await this.storage.set(cacheKey, data, { ttl });
      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(key, options.prefix);
      await this.storage.del(cacheKey);
      return true;
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(key, options.prefix);
      return await this.storage.exists(cacheKey);
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }
      
      // Generate new value
      const value = await factory();
      if (value !== null && value !== undefined) {
        await this.set(key, value, options);
      }
      
      return value;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      return null;
    }
  }

  // Specialized cache methods for game data
  async cacheAnimalSpecies(speciesId: string, data: any, ttl: number = 86400): Promise<boolean> {
    return await this.set(`species:${speciesId}`, data, { ttl, prefix: 'game' });
  }

  async getCachedAnimalSpecies(speciesId: string): Promise<any | null> {
    return await this.get(`species:${speciesId}`, { prefix: 'game' });
  }

  async cacheHabitatData(habitatId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return await this.set(`habitat:${habitatId}`, data, { ttl, prefix: 'game' });
  }

  async getCachedHabitatData(habitatId: string): Promise<any | null> {
    return await this.get(`habitat:${habitatId}`, { prefix: 'game' });
  }

  async cacheLeaderboard(type: string, data: any, ttl: number = 300): Promise<boolean> {
    return await this.set(`leaderboard:${type}`, data, { ttl, prefix: 'game' });
  }

  async getCachedLeaderboard(type: string): Promise<any | null> {
    return await this.get(`leaderboard:${type}`, { prefix: 'game' });
  }

  async cacheDailyPuzzle(date: string, data: any, ttl: number = 86400): Promise<boolean> {
    return await this.set(`daily_puzzle:${date}`, data, { ttl, prefix: 'game' });
  }

  async getCachedDailyPuzzle(date: string): Promise<any | null> {
    return await this.get(`daily_puzzle:${date}`, { prefix: 'game' });
  }

  // Cache warming and invalidation
  async warmCache(keys: string[], factory: (key: string) => Promise<any>): Promise<void> {
    try {
      const promises = keys.map(async (key) => {
        const exists = await this.exists(key);
        if (!exists) {
          const data = await factory(key);
          if (data) {
            await this.set(key, data);
          }
        }
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // This would require a more sophisticated implementation
      // For now, we'll just log the pattern to invalidate
      console.log(`Invalidating cache pattern: ${pattern}`);
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  async clearCache(prefix?: string): Promise<void> {
    try {
      // This would require scanning and deleting keys
      // Implementation depends on Redis capabilities
      console.log(`Clearing cache${prefix ? ` with prefix ${prefix}` : ''}`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Cache statistics
  async getCacheStats(): Promise<{ hits: number; misses: number; size: number }> {
    try {
      // This would require tracking cache statistics
      // For now, return default values
      return { hits: 0, misses: 0, size: 0 };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { hits: 0, misses: 0, size: 0 };
    }
  }

  private buildCacheKey(key: string, prefix?: string): string {
    const parts = ['cache'];
    if (prefix) parts.push(prefix);
    parts.push(key);
    return parts.join(':');
  }

  // Batch operations
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    try {
      const promises = keys.map(key => this.get<T>(key, options));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Cache MGET error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(entries: Array<{ key: string; value: T }>, options: CacheOptions = {}): Promise<boolean> {
    try {
      const promises = entries.map(({ key, value }) => this.set(key, value, options));
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('Cache MSET error:', error);
      return false;
    }
  }

  // Cache with refresh ahead
  async getWithRefresh<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions & { refreshThreshold?: number } = {}
  ): Promise<T | null> {
    try {
      const cached = await this.get<T>(key, options);
      
      // If we have cached data, return it and potentially refresh in background
      if (cached !== null) {
        // In a real implementation, you might check TTL and refresh if close to expiry
        return cached;
      }
      
      // No cached data, fetch and cache
      const value = await factory();
      if (value !== null && value !== undefined) {
        await this.set(key, value, options);
      }
      
      return value;
    } catch (error) {
      console.error(`Cache getWithRefresh error for key ${key}:`, error);
      return null;
    }
  }
}