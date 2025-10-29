import { StorageClient } from '../storage/redis-client.js';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCondition {
  type: 'user_level' | 'trainer_level' | 'random' | 'whitelist' | 'blacklist' | 'date_range';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private readonly flagsKey = 'game:feature_flags';
  
  constructor(private storage: StorageClient) {}

  async loadFlags(): Promise<void> {
    try {
      const flagsData = await this.storage.get(this.flagsKey);
      
      if (flagsData) {
        const flagsArray = JSON.parse(flagsData) as FeatureFlag[];
        this.flags.clear();
        
        flagsArray.forEach(flag => {
          this.flags.set(flag.name, flag);
        });
      } else {
        await this.initializeDefaultFlags();
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
      await this.initializeDefaultFlags();
    }
  }

  async saveFlags(): Promise<boolean> {
    try {
      const flagsArray = Array.from(this.flags.values());
      await this.storage.set(this.flagsKey, JSON.stringify(flagsArray));
      return true;
    } catch (error) {
      console.error('Error saving feature flags:', error);
      return false;
    }
  }

  async isEnabled(flagName: string, context?: any): Promise<boolean> {
    const flag = this.flags.get(flagName);
    
    if (!flag) {
      console.warn(`Feature flag '${flagName}' not found`);
      return false;
    }
    
    if (!flag.enabled) {
      return false;
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashString(`${flagName}:${context?.userId || 'anonymous'}`);
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }
    
    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      return this.evaluateConditions(flag.conditions, context);
    }
    
    return true;
  }

  async setFlag(name: string, enabled: boolean, options?: Partial<FeatureFlag>): Promise<boolean> {
    try {
      const existingFlag = this.flags.get(name);
      const now = new Date();
      
      const flag: FeatureFlag = {
        name,
        enabled,
        description: options?.description || existingFlag?.description || '',
        rolloutPercentage: options?.rolloutPercentage ?? existingFlag?.rolloutPercentage ?? 100,
        conditions: options?.conditions || existingFlag?.conditions,
        metadata: options?.metadata || existingFlag?.metadata,
        createdAt: existingFlag?.createdAt || now,
        updatedAt: now
      };
      
      this.flags.set(name, flag);
      return await this.saveFlags();
    } catch (error) {
      console.error(`Error setting feature flag '${name}':`, error);
      return false;
    }
  }

  async enableFlag(name: string): Promise<boolean> {
    return await this.setFlag(name, true);
  }

  async disableFlag(name: string): Promise<boolean> {
    return await this.setFlag(name, false);
  }

  async setRolloutPercentage(name: string, percentage: number): Promise<boolean> {
    const flag = this.flags.get(name);
    if (!flag) {
      return false;
    }
    
    return await this.setFlag(name, flag.enabled, { 
      ...flag, 
      rolloutPercentage: Math.max(0, Math.min(100, percentage)) 
    });
  }

  async addCondition(name: string, condition: FeatureFlagCondition): Promise<boolean> {
    const flag = this.flags.get(name);
    if (!flag) {
      return false;
    }
    
    const conditions = flag.conditions || [];
    conditions.push(condition);
    
    return await this.setFlag(name, flag.enabled, { ...flag, conditions });
  }

  async removeCondition(name: string, conditionIndex: number): Promise<boolean> {
    const flag = this.flags.get(name);
    if (!flag || !flag.conditions) {
      return false;
    }
    
    const conditions = [...flag.conditions];
    conditions.splice(conditionIndex, 1);
    
    return await this.setFlag(name, flag.enabled, { ...flag, conditions });
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  async deleteFlag(name: string): Promise<boolean> {
    try {
      this.flags.delete(name);
      return await this.saveFlags();
    } catch (error) {
      console.error(`Error deleting feature flag '${name}':`, error);
      return false;
    }
  }

  private async initializeDefaultFlags(): Promise<void> {
    const defaultFlags: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'animal_collection',
        enabled: true,
        description: 'Enable animal collection and management features',
        rolloutPercentage: 100
      },
      {
        name: 'battle_system',
        enabled: true,
        description: 'Enable turn-based battle system',
        rolloutPercentage: 100
      },
      {
        name: 'habitat_exploration',
        enabled: true,
        description: 'Enable habitat exploration and discovery',
        rolloutPercentage: 100
      },
      {
        name: 'trading_system',
        enabled: false,
        description: 'Enable animal trading between players',
        rolloutPercentage: 0
      },
      {
        name: 'guild_system',
        enabled: false,
        description: 'Enable guild/team features',
        rolloutPercentage: 0
      },
      {
        name: 'tournaments',
        enabled: false,
        description: 'Enable tournament and competitive features',
        rolloutPercentage: 0
      },
      {
        name: 'premium_features',
        enabled: true,
        description: 'Enable premium subscription features',
        rolloutPercentage: 100
      },
      {
        name: 'breeding_system',
        enabled: false,
        description: 'Enable animal breeding mechanics',
        rolloutPercentage: 0
      },
      {
        name: 'evolution_system',
        enabled: true,
        description: 'Enable animal evolution mechanics',
        rolloutPercentage: 50
      },
      {
        name: 'conservation_missions',
        enabled: true,
        description: 'Enable educational conservation missions',
        rolloutPercentage: 100
      },
      {
        name: 'social_sharing',
        enabled: true,
        description: 'Enable Reddit integration and social sharing',
        rolloutPercentage: 100
      },
      {
        name: 'advanced_analytics',
        enabled: false,
        description: 'Enable detailed analytics and tracking',
        rolloutPercentage: 10
      }
    ];
    
    const now = new Date();
    defaultFlags.forEach(flagData => {
      const flag: FeatureFlag = {
        ...flagData,
        createdAt: now,
        updatedAt: now
      };
      this.flags.set(flag.name, flag);
    });
    
    await this.saveFlags();
  }

  private evaluateConditions(conditions: FeatureFlagCondition[], context: any): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(condition: FeatureFlagCondition, context: any): boolean {
    let contextValue: any;
    
    switch (condition.type) {
      case 'user_level':
        contextValue = context?.userLevel || 0;
        break;
      case 'trainer_level':
        contextValue = context?.trainerLevel || 0;
        break;
      case 'random':
        contextValue = Math.random();
        break;
      case 'whitelist':
        contextValue = context?.userId;
        break;
      case 'blacklist':
        contextValue = context?.userId;
        break;
      case 'date_range':
        contextValue = new Date();
        break;
      default:
        return false;
    }
    
    switch (condition.operator) {
      case 'eq':
        return contextValue === condition.value;
      case 'gt':
        return contextValue > condition.value;
      case 'lt':
        return contextValue < condition.value;
      case 'gte':
        return contextValue >= condition.value;
      case 'lte':
        return contextValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      default:
        return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Bulk operations
  async enableMultipleFlags(flagNames: string[]): Promise<boolean> {
    try {
      for (const name of flagNames) {
        await this.enableFlag(name);
      }
      return true;
    } catch (error) {
      console.error('Error enabling multiple flags:', error);
      return false;
    }
  }

  async disableMultipleFlags(flagNames: string[]): Promise<boolean> {
    try {
      for (const name of flagNames) {
        await this.disableFlag(name);
      }
      return true;
    } catch (error) {
      console.error('Error disabling multiple flags:', error);
      return false;
    }
  }

  // Flag analytics
  async getFlagUsageStats(): Promise<Record<string, { enabled: boolean; rollout: number; conditions: number }>> {
    const stats: Record<string, { enabled: boolean; rollout: number; conditions: number }> = {};
    
    this.flags.forEach((flag, name) => {
      stats[name] = {
        enabled: flag.enabled,
        rollout: flag.rolloutPercentage,
        conditions: flag.conditions?.length || 0
      };
    });
    
    return stats;
  }

  // Environment-specific flag management
  async loadEnvironmentFlags(environment: 'development' | 'staging' | 'production'): Promise<void> {
    const envFlags = {
      development: {
        trading_system: true,
        guild_system: true,
        tournaments: true,
        breeding_system: true,
        advanced_analytics: true
      },
      staging: {
        trading_system: true,
        guild_system: true,
        tournaments: false,
        breeding_system: true,
        advanced_analytics: true
      },
      production: {
        // Use default values or specific production overrides
      }
    };
    
    const flags = envFlags[environment];
    if (flags) {
      for (const [name, enabled] of Object.entries(flags)) {
        await this.setFlag(name, enabled);
      }
    }
  }
}