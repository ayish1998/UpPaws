import { RedisClient } from '@devvit/public-api';
import { EnhancedRedisClient, StorageClient } from '../storage/redis-client.js';
import { TrainerStorage } from '../storage/trainer-storage.js';
import { AnimalStorage } from '../storage/animal-storage.js';
import { BattleStorage } from '../storage/battle-storage.js';
import { HabitatStorage } from '../storage/habitat-storage.js';
import { CacheManager } from '../storage/cache-manager.js';
import { MigrationManager } from '../storage/migration.js';
import { GameConfigManager } from '../config/game-config.js';
import { BalanceConfigManager } from '../config/balance-config.js';
import { FeatureFlagManager } from '../config/feature-flags.js';

/**
 * Service container for dependency injection and service management
 */
export class ServiceContainer {
  private services: Map<string, any> = new Map();
  private initialized = false;

  constructor(private redisClient: RedisClient) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize storage layer
      const storageClient = new EnhancedRedisClient(this.redisClient);
      this.register('storageClient', storageClient);

      // Initialize storage services
      this.register('trainerStorage', new TrainerStorage(storageClient));
      this.register('animalStorage', new AnimalStorage(storageClient));
      this.register('battleStorage', new BattleStorage(storageClient));
      this.register('habitatStorage', new HabitatStorage(storageClient));
      
      // Initialize cache manager
      this.register('cacheManager', new CacheManager(storageClient));
      
      // Initialize migration manager
      this.register('migrationManager', new MigrationManager(storageClient));
      
      // Initialize configuration managers
      this.register('gameConfig', new GameConfigManager(storageClient));
      this.register('balanceConfig', new BalanceConfigManager(storageClient));
      this.register('featureFlags', new FeatureFlagManager(storageClient));

      // Load feature flags
      await this.getFeatureFlags().loadFlags();

      // Run migrations if needed
      const migrationManager = this.getMigrationManager();
      const needsMigration = await migrationManager.needsMigration();
      if (needsMigration) {
        console.log('Running database migrations...');
        await migrationManager.migrate();
      }

      this.initialized = true;
      console.log('ServiceContainer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ServiceContainer:', error);
      throw error;
    }
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  // Convenience getters for commonly used services
  getStorageClient(): StorageClient {
    return this.get<StorageClient>('storageClient');
  }

  getTrainerStorage(): TrainerStorage {
    return this.get<TrainerStorage>('trainerStorage');
  }

  getAnimalStorage(): AnimalStorage {
    return this.get<AnimalStorage>('animalStorage');
  }

  getBattleStorage(): BattleStorage {
    return this.get<BattleStorage>('battleStorage');
  }

  getHabitatStorage(): HabitatStorage {
    return this.get<HabitatStorage>('habitatStorage');
  }

  getCacheManager(): CacheManager {
    return this.get<CacheManager>('cacheManager');
  }

  getMigrationManager(): MigrationManager {
    return this.get<MigrationManager>('migrationManager');
  }

  getGameConfig(): GameConfigManager {
    return this.get<GameConfigManager>('gameConfig');
  }

  getBalanceConfig(): BalanceConfigManager {
    return this.get<BalanceConfigManager>('balanceConfig');
  }

  getFeatureFlags(): FeatureFlagManager {
    return this.get<FeatureFlagManager>('featureFlags');
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; services: Record<string, boolean> }> {
    const serviceStatus: Record<string, boolean> = {};
    let overallHealthy = true;

    try {
      // Check storage connectivity
      const storageClient = this.getStorageClient();
      await storageClient.set('health_check', 'ok', { ttl: 60 });
      const result = await storageClient.get('health_check');
      serviceStatus.storage = result === 'ok';
      if (!serviceStatus.storage) overallHealthy = false;

      // Check configuration services
      try {
        await this.getGameConfig().getConfig();
        serviceStatus.gameConfig = true;
      } catch {
        serviceStatus.gameConfig = false;
        overallHealthy = false;
      }

      try {
        await this.getBalanceConfig().getConfig();
        serviceStatus.balanceConfig = true;
      } catch {
        serviceStatus.balanceConfig = false;
        overallHealthy = false;
      }

      // Check feature flags
      try {
        this.getFeatureFlags().getAllFlags();
        serviceStatus.featureFlags = true;
      } catch {
        serviceStatus.featureFlags = false;
        overallHealthy = false;
      }

    } catch (error) {
      console.error('Health check failed:', error);
      overallHealthy = false;
    }

    return {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      services: serviceStatus
    };
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    try {
      // Perform any necessary cleanup
      console.log('ServiceContainer cleanup completed');
    } catch (error) {
      console.error('Error during ServiceContainer cleanup:', error);
    }
  }

  // Development utilities
  async resetAllData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Data reset not allowed in production');
    }

    console.warn('Resetting all game data...');
    
    // This would reset all game data - use with extreme caution
    const cacheManager = this.getCacheManager();
    await cacheManager.clearCache();
    
    // Reset configurations to defaults
    await this.getGameConfig().resetToDefaults();
    await this.getBalanceConfig().saveConfig(this.getBalanceConfig()['getDefaultConfig']());
    
    console.log('All game data reset completed');
  }

  // Service factory methods
  static async create(redisClient: RedisClient): Promise<ServiceContainer> {
    const container = new ServiceContainer(redisClient);
    await container.initialize();
    return container;
  }
}