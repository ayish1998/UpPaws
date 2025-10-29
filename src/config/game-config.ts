import { StorageClient } from '../storage/redis-client.js';

export interface GameConfig {
  // Core game settings
  maxAnimalsPerTrainer: number;
  maxDailyExplorations: number;
  baseExplorationCost: number;
  
  // Battle system
  maxBattleTime: number;
  maxAnimalsPerBattle: number;
  battleRewardMultiplier: number;
  
  // Experience and leveling
  baseExperiencePerLevel: number;
  maxTrainerLevel: number;
  maxAnimalLevel: number;
  
  // Currency settings
  dailyLoginBonus: number;
  puzzleCompletionReward: number;
  battleWinReward: number;
  
  // Capture mechanics
  baseCaptureRate: number;
  shinyEncounterRate: number;
  rarityModifiers: Record<string, number>;
  
  // Social features
  maxFriends: number;
  tradingEnabled: boolean;
  guildMaxMembers: number;
  
  // Performance settings
  cacheTimeout: number;
  maxConcurrentBattles: number;
  
  // Feature toggles
  features: FeatureFlags;
}

export interface FeatureFlags {
  animalCollection: boolean;
  battleSystem: boolean;
  habitatExploration: boolean;
  trading: boolean;
  guilds: boolean;
  tournaments: boolean;
  premiumFeatures: boolean;
  educationalContent: boolean;
  conservationMissions: boolean;
  breeding: boolean;
  evolution: boolean;
  achievements: boolean;
  leaderboards: boolean;
  socialSharing: boolean;
}

export class GameConfigManager {
  private config: GameConfig | null = null;
  private readonly configKey = 'game:config';
  
  constructor(private storage: StorageClient) {}

  async getConfig(): Promise<GameConfig> {
    if (this.config) {
      return this.config;
    }
    
    try {
      const configData = await this.storage.get(this.configKey);
      
      if (configData) {
        this.config = JSON.parse(configData);
      } else {
        this.config = this.getDefaultConfig();
        await this.saveConfig(this.config);
      }
      
      return this.config;
    } catch (error) {
      console.error('Error loading game config:', error);
      return this.getDefaultConfig();
    }
  }

  async updateConfig(updates: Partial<GameConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...updates };
      
      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('Error updating game config:', error);
      return false;
    }
  }

  async saveConfig(config: GameConfig): Promise<boolean> {
    try {
      await this.storage.set(this.configKey, JSON.stringify(config));
      this.config = config;
      return true;
    } catch (error) {
      console.error('Error saving game config:', error);
      return false;
    }
  }

  async resetToDefaults(): Promise<boolean> {
    try {
      const defaultConfig = this.getDefaultConfig();
      return await this.saveConfig(defaultConfig);
    } catch (error) {
      console.error('Error resetting config to defaults:', error);
      return false;
    }
  }

  private getDefaultConfig(): GameConfig {
    return {
      // Core game settings
      maxAnimalsPerTrainer: 500,
      maxDailyExplorations: 10,
      baseExplorationCost: 1,
      
      // Battle system
      maxBattleTime: 300, // 5 minutes
      maxAnimalsPerBattle: 6,
      battleRewardMultiplier: 1.0,
      
      // Experience and leveling
      baseExperiencePerLevel: 1000,
      maxTrainerLevel: 100,
      maxAnimalLevel: 100,
      
      // Currency settings
      dailyLoginBonus: 50,
      puzzleCompletionReward: 25,
      battleWinReward: 100,
      
      // Capture mechanics
      baseCaptureRate: 0.3,
      shinyEncounterRate: 0.001, // 0.1%
      rarityModifiers: {
        common: 1.0,
        uncommon: 0.7,
        rare: 0.4,
        epic: 0.2,
        legendary: 0.05
      },
      
      // Social features
      maxFriends: 100,
      tradingEnabled: true,
      guildMaxMembers: 50,
      
      // Performance settings
      cacheTimeout: 3600, // 1 hour
      maxConcurrentBattles: 1000,
      
      // Feature toggles
      features: {
        animalCollection: true,
        battleSystem: true,
        habitatExploration: true,
        trading: true,
        guilds: true,
        tournaments: true,
        premiumFeatures: true,
        educationalContent: true,
        conservationMissions: true,
        breeding: true,
        evolution: true,
        achievements: true,
        leaderboards: true,
        socialSharing: true
      }
    };
  }

  // Convenience methods for specific config values
  async isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
    const config = await this.getConfig();
    return config.features[feature];
  }

  async enableFeature(feature: keyof FeatureFlags): Promise<boolean> {
    const config = await this.getConfig();
    config.features[feature] = true;
    return await this.saveConfig(config);
  }

  async disableFeature(feature: keyof FeatureFlags): Promise<boolean> {
    const config = await this.getConfig();
    config.features[feature] = false;
    return await this.saveConfig(config);
  }

  async getMaxAnimalsPerTrainer(): Promise<number> {
    const config = await this.getConfig();
    return config.maxAnimalsPerTrainer;
  }

  async getBattleRewardMultiplier(): Promise<number> {
    const config = await this.getConfig();
    return config.battleRewardMultiplier;
  }

  async getCaptureRate(rarity: string): Promise<number> {
    const config = await this.getConfig();
    const baseRate = config.baseCaptureRate;
    const modifier = config.rarityModifiers[rarity] || 1.0;
    return baseRate * modifier;
  }

  // Configuration validation
  validateConfig(config: Partial<GameConfig>): string[] {
    const errors: string[] = [];
    
    if (config.maxAnimalsPerTrainer !== undefined && config.maxAnimalsPerTrainer < 1) {
      errors.push('maxAnimalsPerTrainer must be at least 1');
    }
    
    if (config.maxTrainerLevel !== undefined && config.maxTrainerLevel < 1) {
      errors.push('maxTrainerLevel must be at least 1');
    }
    
    if (config.baseCaptureRate !== undefined && (config.baseCaptureRate < 0 || config.baseCaptureRate > 1)) {
      errors.push('baseCaptureRate must be between 0 and 1');
    }
    
    if (config.shinyEncounterRate !== undefined && (config.shinyEncounterRate < 0 || config.shinyEncounterRate > 1)) {
      errors.push('shinyEncounterRate must be between 0 and 1');
    }
    
    return errors;
  }

  // Environment-specific configurations
  async loadEnvironmentConfig(environment: 'development' | 'staging' | 'production'): Promise<void> {
    const envConfigs = {
      development: {
        maxDailyExplorations: 100, // Unlimited for testing
        shinyEncounterRate: 0.1, // Higher for testing
        battleRewardMultiplier: 2.0, // Faster progression
        cacheTimeout: 60 // Shorter cache for development
      },
      staging: {
        maxDailyExplorations: 20,
        shinyEncounterRate: 0.01,
        battleRewardMultiplier: 1.5,
        cacheTimeout: 1800
      },
      production: {
        // Use default values
      }
    };
    
    const envConfig = envConfigs[environment];
    if (envConfig) {
      await this.updateConfig(envConfig);
    }
  }
}