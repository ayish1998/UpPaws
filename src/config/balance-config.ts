import { StorageClient } from '../storage/redis-client.js';
import { HabitatType } from '../types/common.js';

export interface BalanceConfig {
  // Animal stats balance
  statCaps: {
    health: number;
    attack: number;
    defense: number;
    speed: number;
    intelligence: number;
    stamina: number;
  };
  
  // Type effectiveness multipliers
  typeEffectiveness: Record<string, Record<string, number>>;
  
  // Experience curves
  experienceCurves: {
    trainer: ExperienceCurve;
    animal: ExperienceCurve;
  };
  
  // Battle balance
  battleBalance: {
    criticalHitChance: number;
    criticalHitMultiplier: number;
    statusEffectDurations: Record<string, number>;
    weatherEffectMultipliers: Record<string, number>;
  };
  
  // Economy balance
  economyBalance: {
    currencyRates: {
      pawCoinsPerPuzzle: number;
      researchPointsPerDiscovery: number;
      battleTokensPerWin: number;
    };
    itemPrices: Record<string, number>;
    tradingFees: number;
  };
  
  // Progression balance
  progressionBalance: {
    levelUpRequirements: Record<number, number>;
    badgeRequirements: Record<string, any>;
    achievementThresholds: Record<string, number>;
  };
}

export interface ExperienceCurve {
  type: 'linear' | 'exponential' | 'logarithmic';
  baseAmount: number;
  multiplier: number;
  cap?: number;
}

export class BalanceConfigManager {
  private config: BalanceConfig | null = null;
  private readonly configKey = 'game:balance_config';
  
  constructor(private storage: StorageClient) {}

  async getConfig(): Promise<BalanceConfig> {
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
      console.error('Error loading balance config:', error);
      return this.getDefaultConfig();
    }
  }

  async updateConfig(updates: Partial<BalanceConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...updates };
      
      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('Error updating balance config:', error);
      return false;
    }
  }

  async saveConfig(config: BalanceConfig): Promise<boolean> {
    try {
      await this.storage.set(this.configKey, JSON.stringify(config));
      this.config = config;
      return true;
    } catch (error) {
      console.error('Error saving balance config:', error);
      return false;
    }
  }

  private getDefaultConfig(): BalanceConfig {
    return {
      statCaps: {
        health: 999,
        attack: 255,
        defense: 255,
        speed: 255,
        intelligence: 255,
        stamina: 255
      },
      
      typeEffectiveness: {
        [HabitatType.FOREST]: {
          [HabitatType.OCEAN]: 2.0,
          [HabitatType.DESERT]: 0.5,
          [HabitatType.ARCTIC]: 0.5
        },
        [HabitatType.OCEAN]: {
          [HabitatType.DESERT]: 2.0,
          [HabitatType.MOUNTAIN]: 2.0,
          [HabitatType.FOREST]: 0.5
        },
        [HabitatType.DESERT]: {
          [HabitatType.FOREST]: 2.0,
          [HabitatType.ARCTIC]: 0.5,
          [HabitatType.OCEAN]: 0.5
        },
        [HabitatType.ARCTIC]: {
          [HabitatType.FOREST]: 2.0,
          [HabitatType.MOUNTAIN]: 2.0,
          [HabitatType.DESERT]: 0.5
        },
        [HabitatType.JUNGLE]: {
          [HabitatType.DESERT]: 2.0,
          [HabitatType.ARCTIC]: 0.5
        },
        [HabitatType.SAVANNA]: {
          [HabitatType.FOREST]: 2.0,
          [HabitatType.JUNGLE]: 0.5
        },
        [HabitatType.MOUNTAIN]: {
          [HabitatType.FOREST]: 2.0,
          [HabitatType.OCEAN]: 0.5
        },
        [HabitatType.GRASSLAND]: {
          [HabitatType.DESERT]: 2.0,
          [HabitatType.MOUNTAIN]: 0.5
        }
      },
      
      experienceCurves: {
        trainer: {
          type: 'exponential',
          baseAmount: 100,
          multiplier: 1.2,
          cap: 1000000
        },
        animal: {
          type: 'exponential',
          baseAmount: 125,
          multiplier: 1.15,
          cap: 500000
        }
      },
      
      battleBalance: {
        criticalHitChance: 0.0625, // 1/16
        criticalHitMultiplier: 1.5,
        statusEffectDurations: {
          sleep: 3,
          paralysis: 4,
          poison: 5,
          burn: 5,
          freeze: 2,
          confusion: 3
        },
        weatherEffectMultipliers: {
          sunny: 1.5, // Fire-type moves
          rainy: 1.5, // Water-type moves
          sandstorm: 0.8, // Reduces accuracy
          hail: 0.9, // Damages non-ice types
          fog: 0.6 // Reduces accuracy significantly
        }
      },
      
      economyBalance: {
        currencyRates: {
          pawCoinsPerPuzzle: 25,
          researchPointsPerDiscovery: 10,
          battleTokensPerWin: 5
        },
        itemPrices: {
          'basic_capture_aid': 50,
          'advanced_capture_aid': 150,
          'health_potion': 100,
          'energy_drink': 75,
          'stat_booster': 200,
          'evolution_stone': 500,
          'rare_candy': 1000
        },
        tradingFees: 0.05 // 5% fee
      },
      
      progressionBalance: {
        levelUpRequirements: {
          1: 0,
          2: 100,
          3: 250,
          4: 450,
          5: 700,
          10: 2500,
          20: 10000,
          50: 125000,
          100: 1000000
        },
        badgeRequirements: {
          'forest_explorer': { habitatExplorations: 10, speciesDiscovered: 5 },
          'ocean_master': { habitatExplorations: 15, speciesDiscovered: 8 },
          'battle_champion': { battlesWon: 50, winStreak: 10 },
          'researcher': { speciesDiscovered: 100, factsLearned: 200 }
        },
        achievementThresholds: {
          'first_capture': 1,
          'collector': 50,
          'master_collector': 200,
          'shiny_hunter': 5,
          'battle_veteran': 100,
          'explorer': 25,
          'conservationist': 10
        }
      }
    };
  }

  // Calculation methods
  async calculateExperienceRequired(level: number, curveType: 'trainer' | 'animal'): Promise<number> {
    const config = await this.getConfig();
    const curve = config.experienceCurves[curveType];
    
    switch (curve.type) {
      case 'linear':
        return curve.baseAmount * level;
      
      case 'exponential':
        return Math.floor(curve.baseAmount * Math.pow(curve.multiplier, level - 1));
      
      case 'logarithmic':
        return Math.floor(curve.baseAmount * Math.log(level + 1) * curve.multiplier);
      
      default:
        return curve.baseAmount * level;
    }
  }

  async getTypeEffectiveness(attackingType: HabitatType, defendingType: HabitatType): Promise<number> {
    const config = await this.getConfig();
    return config.typeEffectiveness[attackingType]?.[defendingType] || 1.0;
  }

  async getCriticalHitChance(): Promise<number> {
    const config = await this.getConfig();
    return config.battleBalance.criticalHitChance;
  }

  async getItemPrice(itemId: string): Promise<number> {
    const config = await this.getConfig();
    return config.economyBalance.itemPrices[itemId] || 0;
  }

  async getAchievementThreshold(achievementId: string): Promise<number> {
    const config = await this.getConfig();
    return config.progressionBalance.achievementThresholds[achievementId] || 1;
  }

  // Balance testing and validation
  async validateBalance(): Promise<string[]> {
    const config = await this.getConfig();
    const issues: string[] = [];
    
    // Check stat caps
    Object.entries(config.statCaps).forEach(([stat, cap]) => {
      if (cap <= 0) {
        issues.push(`Stat cap for ${stat} must be positive`);
      }
    });
    
    // Check type effectiveness
    Object.entries(config.typeEffectiveness).forEach(([attackType, defenses]) => {
      Object.entries(defenses).forEach(([defenseType, multiplier]) => {
        if (multiplier < 0) {
          issues.push(`Type effectiveness multiplier cannot be negative: ${attackType} vs ${defenseType}`);
        }
      });
    });
    
    // Check experience curves
    if (config.experienceCurves.trainer.baseAmount <= 0) {
      issues.push('Trainer experience base amount must be positive');
    }
    
    if (config.experienceCurves.animal.baseAmount <= 0) {
      issues.push('Animal experience base amount must be positive');
    }
    
    // Check currency rates
    Object.entries(config.economyBalance.currencyRates).forEach(([currency, rate]) => {
      if (rate <= 0) {
        issues.push(`Currency rate for ${currency} must be positive`);
      }
    });
    
    return issues;
  }

  // A/B testing support
  async createBalanceVariant(variantName: string, changes: Partial<BalanceConfig>): Promise<boolean> {
    try {
      const baseConfig = await this.getConfig();
      const variantConfig = { ...baseConfig, ...changes };
      
      const variantKey = `${this.configKey}:variant:${variantName}`;
      await this.storage.set(variantKey, JSON.stringify(variantConfig));
      
      return true;
    } catch (error) {
      console.error(`Error creating balance variant ${variantName}:`, error);
      return false;
    }
  }

  async loadBalanceVariant(variantName: string): Promise<boolean> {
    try {
      const variantKey = `${this.configKey}:variant:${variantName}`;
      const variantData = await this.storage.get(variantKey);
      
      if (!variantData) {
        return false;
      }
      
      this.config = JSON.parse(variantData);
      return true;
    } catch (error) {
      console.error(`Error loading balance variant ${variantName}:`, error);
      return false;
    }
  }
}