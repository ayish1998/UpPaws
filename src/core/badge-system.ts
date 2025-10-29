import { Badge, HabitatType } from '../types/common.js';
import { TrainerProfile } from '../types/trainer.js';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  habitatType?: HabitatType;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirements: BadgeRequirement[];
  rewards: BadgeReward[];
  icon: string;
  color: string;
  unlockOrder?: number;
}

export enum BadgeCategory {
  GYM = 'gym',
  ELITE = 'elite',
  CHAMPION = 'champion',
  ACHIEVEMENT = 'achievement',
  SPECIAL = 'special',
  SEASONAL = 'seasonal'
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface BadgeRequirement {
  type: string;
  value: any;
  description: string;
}

export interface BadgeReward {
  type: 'currency' | 'item' | 'unlock' | 'title' | 'bonus';
  id: string;
  quantity: number;
  description: string;
}

export interface BadgeProgress {
  badgeId: string;
  progress: number;
  maxProgress: number;
  canEarn: boolean;
  missingRequirements: string[];
}

export class BadgeSystem {
  private static badges: Map<string, BadgeDefinition> = new Map();

  /**
   * Initialize badge system
   */
  public static initialize(): void {
    this.loadBadgeDefinitions();
  }

  /**
   * Load all badge definitions
   */
  private static loadBadgeDefinitions(): void {
    const definitions: BadgeDefinition[] = [
      // Gym Badges
      {
        id: 'forest_badge',
        name: 'Forest Badge',
        description: 'Mastery over forest creatures and ecosystems',
        habitatType: HabitatType.FOREST,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.COMMON,
        requirements: [
          { type: 'gym_challenge', value: 'forest_gym', description: 'Complete Forest Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 1000, description: '1000 PawCoins' },
          { type: 'unlock', id: 'forest_advanced', quantity: 1, description: 'Advanced Forest Areas' }
        ],
        icon: '🌲',
        color: '#228B22',
        unlockOrder: 1
      },
      {
        id: 'ocean_badge',
        name: 'Ocean Badge',
        description: 'Command over the mysteries of the deep blue sea',
        habitatType: HabitatType.OCEAN,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.COMMON,
        requirements: [
          { type: 'gym_challenge', value: 'ocean_gym', description: 'Complete Ocean Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 1500, description: '1500 PawCoins' },
          { type: 'unlock', id: 'deep_ocean', quantity: 1, description: 'Deep Ocean Access' }
        ],
        icon: '🌊',
        color: '#1E90FF',
        unlockOrder: 2
      },
      {
        id: 'desert_badge',
        name: 'Desert Badge',
        description: 'Survival and mastery in the harsh desert environment',
        habitatType: HabitatType.DESERT,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.UNCOMMON,
        requirements: [
          { type: 'gym_challenge', value: 'desert_gym', description: 'Complete Desert Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 2000, description: '2000 PawCoins' },
          { type: 'bonus', id: 'heat_resistance', quantity: 1, description: 'Heat Resistance Bonus' }
        ],
        icon: '🏜️',
        color: '#DAA520',
        unlockOrder: 3
      },
      {
        id: 'arctic_badge',
        name: 'Arctic Badge',
        description: 'Endurance and expertise in frozen wastelands',
        habitatType: HabitatType.ARCTIC,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.UNCOMMON,
        requirements: [
          { type: 'gym_challenge', value: 'arctic_gym', description: 'Complete Arctic Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 2500, description: '2500 PawCoins' },
          { type: 'bonus', id: 'cold_resistance', quantity: 1, description: 'Cold Resistance Bonus' }
        ],
        icon: '🏔️',
        color: '#87CEEB',
        unlockOrder: 4
      },
      {
        id: 'jungle_badge',
        name: 'Jungle Badge',
        description: 'Navigation and survival in dense jungle environments',
        habitatType: HabitatType.JUNGLE,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.RARE,
        requirements: [
          { type: 'gym_challenge', value: 'jungle_gym', description: 'Complete Jungle Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 1000, description: '1000 Research Points' },
          { type: 'unlock', id: 'canopy_access', quantity: 1, description: 'Jungle Canopy Access' }
        ],
        icon: '🌴',
        color: '#006400',
        unlockOrder: 5
      },
      {
        id: 'mountain_badge',
        name: 'Mountain Badge',
        description: 'Conquest of the highest peaks and their inhabitants',
        habitatType: HabitatType.MOUNTAIN,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.RARE,
        requirements: [
          { type: 'gym_challenge', value: 'mountain_gym', description: 'Complete Mountain Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'battleTokens', quantity: 500, description: '500 Battle Tokens' },
          { type: 'unlock', id: 'peak_access', quantity: 1, description: 'Mountain Peak Access' }
        ],
        icon: '⛰️',
        color: '#8B4513',
        unlockOrder: 6
      },
      {
        id: 'savanna_badge',
        name: 'Savanna Badge',
        description: 'Understanding of the great plains and their wildlife',
        habitatType: HabitatType.SAVANNA,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.RARE,
        requirements: [
          { type: 'gym_challenge', value: 'savanna_gym', description: 'Complete Savanna Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 3000, description: '3000 PawCoins' },
          { type: 'unlock', id: 'migration_routes', quantity: 1, description: 'Migration Route Access' }
        ],
        icon: '🦁',
        color: '#CD853F',
        unlockOrder: 7
      },
      {
        id: 'grassland_badge',
        name: 'Grassland Badge',
        description: 'Harmony with the vast grasslands and their creatures',
        habitatType: HabitatType.GRASSLAND,
        category: BadgeCategory.GYM,
        rarity: BadgeRarity.EPIC,
        requirements: [
          { type: 'gym_challenge', value: 'grassland_gym', description: 'Complete Grassland Gym Challenge' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 4000, description: '4000 PawCoins' },
          { type: 'title', id: 'gym_master', quantity: 1, description: 'Gym Master Title' }
        ],
        icon: '🌾',
        color: '#9ACD32',
        unlockOrder: 8
      },

      // Elite Four Badges
      {
        id: 'knowledge_elite_badge',
        name: 'Knowledge Elite Badge',
        description: 'Defeated the Knowledge Keeper of the Elite Four',
        category: BadgeCategory.ELITE,
        rarity: BadgeRarity.EPIC,
        requirements: [
          { type: 'elite_battle', value: 'elite_researcher', description: 'Defeat Dr. Sarah Chen' }
        ],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 2000, description: '2000 Research Points' },
          { type: 'unlock', id: 'legendary_research', quantity: 1, description: 'Legendary Research' }
        ],
        icon: '📚',
        color: '#4169E1',
        unlockOrder: 9
      },
      {
        id: 'battle_elite_badge',
        name: 'Battle Elite Badge',
        description: 'Defeated the Battle Master of the Elite Four',
        category: BadgeCategory.ELITE,
        rarity: BadgeRarity.EPIC,
        requirements: [
          { type: 'elite_battle', value: 'elite_battler', description: 'Defeat Commander Rex' }
        ],
        rewards: [
          { type: 'currency', id: 'battleTokens', quantity: 1000, description: '1000 Battle Tokens' },
          { type: 'unlock', id: 'legendary_battles', quantity: 1, description: 'Legendary Battles' }
        ],
        icon: '⚔️',
        color: '#DC143C',
        unlockOrder: 10
      },
      {
        id: 'conservation_elite_badge',
        name: 'Conservation Elite Badge',
        description: 'Defeated the Guardian of the Elite Four',
        category: BadgeCategory.ELITE,
        rarity: BadgeRarity.EPIC,
        requirements: [
          { type: 'elite_battle', value: 'elite_conservationist', description: 'Defeat Dr. Maya Patel' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 5000, description: '5000 PawCoins' },
          { type: 'unlock', id: 'conservation_sanctuary', quantity: 1, description: 'Conservation Sanctuary' }
        ],
        icon: '🌱',
        color: '#228B22',
        unlockOrder: 11
      },
      {
        id: 'grand_elite_badge',
        name: 'Grand Elite Badge',
        description: 'Defeated the Grand Champion of the Elite Four',
        category: BadgeCategory.ELITE,
        rarity: BadgeRarity.LEGENDARY,
        requirements: [
          { type: 'elite_battle', value: 'elite_champion', description: 'Defeat Professor Wilde' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 10000, description: '10000 PawCoins' },
          { type: 'title', id: 'elite_champion', quantity: 1, description: 'Elite Champion Title' }
        ],
        icon: '👑',
        color: '#FFD700',
        unlockOrder: 12
      },

      // Champion Badge
      {
        id: 'champion_badge',
        name: 'Champion Badge',
        description: 'The ultimate badge - proof of being the Regional Champion',
        category: BadgeCategory.CHAMPION,
        rarity: BadgeRarity.LEGENDARY,
        requirements: [
          { type: 'champion_battle', value: 'regional_champion', description: 'Become Regional Champion' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 25000, description: '25000 PawCoins' },
          { type: 'currency', id: 'researchPoints', quantity: 10000, description: '10000 Research Points' },
          { type: 'currency', id: 'battleTokens', quantity: 5000, description: '5000 Battle Tokens' },
          { type: 'title', id: 'regional_champion', quantity: 1, description: 'Regional Champion Title' },
          { type: 'unlock', id: 'champion_privileges', quantity: 1, description: 'Champion Privileges' }
        ],
        icon: '🏆',
        color: '#FFD700',
        unlockOrder: 13
      },

      // Achievement Badges
      {
        id: 'collector_badge',
        name: 'Collector Badge',
        description: 'Awarded for exceptional collection achievements',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: BadgeRarity.RARE,
        requirements: [
          { type: 'animals_captured', value: 100, description: 'Capture 100 unique species' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 2000, description: '2000 PawCoins' },
          { type: 'bonus', id: 'capture_rate', quantity: 10, description: '10% Capture Rate Bonus' }
        ],
        icon: '📋',
        color: '#8A2BE2'
      },
      {
        id: 'researcher_badge',
        name: 'Researcher Badge',
        description: 'Recognition for dedication to animal research',
        category: BadgeCategory.ACHIEVEMENT,
        rarity: BadgeRarity.UNCOMMON,
        requirements: [
          { type: 'facts_learned', value: 500, description: 'Learn 500 animal facts' }
        ],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 1000, description: '1000 Research Points' },
          { type: 'unlock', id: 'research_tools', quantity: 1, description: 'Advanced Research Tools' }
        ],
        icon: '🔬',
        color: '#4682B4'
      },

      // Special Badges
      {
        id: 'shiny_hunter_badge',
        name: 'Shiny Hunter Badge',
        description: 'Awarded to those who find the rarest shiny animals',
        category: BadgeCategory.SPECIAL,
        rarity: BadgeRarity.LEGENDARY,
        requirements: [
          { type: 'shiny_captured', value: 10, description: 'Capture 10 shiny animals' }
        ],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 15000, description: '15000 PawCoins' },
          { type: 'bonus', id: 'shiny_rate', quantity: 25, description: '25% Shiny Encounter Rate Bonus' },
          { type: 'title', id: 'shiny_hunter', quantity: 1, description: 'Shiny Hunter Title' }
        ],
        icon: '✨',
        color: '#FF69B4'
      },
      {
        id: 'conservationist_badge',
        name: 'Conservationist Badge',
        description: 'Dedicated to protecting endangered species',
        category: BadgeCategory.SPECIAL,
        rarity: BadgeRarity.EPIC,
        requirements: [
          { type: 'conservation_missions', value: 50, description: 'Complete 50 conservation missions' }
        ],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 3000, description: '3000 Research Points' },
          { type: 'unlock', id: 'endangered_sanctuary', quantity: 1, description: 'Endangered Species Sanctuary' },
          { type: 'title', id: 'conservationist', quantity: 1, description: 'Conservationist Title' }
        ],
        icon: '🛡️',
        color: '#32CD32'
      }
    ];

    definitions.forEach(def => {
      this.badges.set(def.id, def);
    });
  }

  /**
   * Check if trainer can earn a badge
   */
  public static canEarnBadge(trainer: TrainerProfile, badgeId: string): boolean {
    const definition = this.badges.get(badgeId);
    if (!definition) return false;

    // Check if already earned
    if (trainer.badges.some(badge => badge.id === badgeId)) {
      return false;
    }

    // Check requirements
    return this.meetsRequirements(trainer, definition.requirements);
  }

  /**
   * Check if trainer meets badge requirements
   */
  private static meetsRequirements(trainer: TrainerProfile, requirements: BadgeRequirement[]): boolean {
    return requirements.every(req => {
      switch (req.type) {
        case 'gym_challenge':
        case 'elite_battle':
        case 'champion_battle':
          // These would be checked by the progression system
          return true; // Simplified for now
        case 'animals_captured':
          return trainer.stats.totalAnimalsCapture >= req.value;
        case 'facts_learned':
          // This would need to be tracked separately
          return false; // Placeholder
        case 'shiny_captured':
          // This would need to be tracked separately
          return false; // Placeholder
        case 'conservation_missions':
          // This would need to be tracked separately
          return false; // Placeholder
        default:
          return false;
      }
    });
  }

  /**
   * Award badge to trainer
   */
  public static awardBadge(trainer: TrainerProfile, badgeId: string): boolean {
    const definition = this.badges.get(badgeId);
    if (!definition || !this.canEarnBadge(trainer, badgeId)) {
      return false;
    }

    const badge: Badge = {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      habitatType: definition.habitatType,
      earnedAt: new Date(),
      gymLeader: definition.category === BadgeCategory.GYM ? 'Gym Leader' : undefined
    };

    trainer.badges.push(badge);

    // Apply rewards
    definition.rewards.forEach(reward => {
      this.applyBadgeReward(trainer, reward);
    });

    return true;
  }

  /**
   * Apply badge reward to trainer
   */
  private static applyBadgeReward(trainer: TrainerProfile, reward: BadgeReward): void {
    switch (reward.type) {
      case 'currency':
        const currencyType = reward.id as keyof typeof trainer.currency;
        if (currencyType in trainer.currency) {
          trainer.currency[currencyType] += reward.quantity;
        }
        break;
      case 'item':
        const existingItem = trainer.inventory.find(item => item.id === reward.id);
        if (existingItem) {
          existingItem.quantity += reward.quantity;
        } else {
          trainer.inventory.push({
            id: reward.id,
            name: reward.description,
            description: reward.description,
            type: 'capture' as any,
            rarity: 'common' as any,
            quantity: reward.quantity
          });
        }
        break;
      case 'title':
        // Titles would be handled by a separate system
        break;
      case 'unlock':
        // Unlocks are handled by the unlock system
        break;
      case 'bonus':
        // Bonuses would be applied in relevant systems
        break;
    }
  }

  /**
   * Get badge progress for trainer
   */
  public static getBadgeProgress(trainer: TrainerProfile): Map<string, BadgeProgress> {
    const progress = new Map<string, BadgeProgress>();

    for (const [id, definition] of this.badges) {
      const earned = trainer.badges.some(badge => badge.id === id);
      const canEarn = !earned && this.meetsRequirements(trainer, definition.requirements);
      const missingRequirements = earned ? [] : this.getMissingRequirements(trainer, definition.requirements);

      progress.set(id, {
        badgeId: id,
        progress: earned ? 100 : this.calculateProgress(trainer, definition.requirements),
        maxProgress: 100,
        canEarn,
        missingRequirements
      });
    }

    return progress;
  }

  /**
   * Get missing requirements for badge
   */
  private static getMissingRequirements(trainer: TrainerProfile, requirements: BadgeRequirement[]): string[] {
    return requirements
      .filter(req => !this.meetsRequirements(trainer, [req]))
      .map(req => req.description);
  }

  /**
   * Calculate progress percentage for requirements
   */
  private static calculateProgress(trainer: TrainerProfile, requirements: BadgeRequirement[]): number {
    if (requirements.length === 0) return 100;

    const totalProgress = requirements.reduce((sum, req) => {
      let current = 0;
      let target = 1;

      switch (req.type) {
        case 'animals_captured':
          current = trainer.stats.totalAnimalsCapture;
          target = req.value;
          break;
        case 'facts_learned':
          current = 0; // Would need to be tracked
          target = req.value;
          break;
        case 'shiny_captured':
          current = 0; // Would need to be tracked
          target = req.value;
          break;
        case 'conservation_missions':
          current = 0; // Would need to be tracked
          target = req.value;
          break;
        default:
          current = this.meetsRequirements(trainer, [req]) ? 1 : 0;
          target = 1;
      }

      return sum + Math.min(current / target, 1);
    }, 0);

    return Math.floor((totalProgress / requirements.length) * 100);
  }

  /**
   * Get badges by category
   */
  public static getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
    return Array.from(this.badges.values()).filter(badge => badge.category === category);
  }

  /**
   * Get gym badges in order
   */
  public static getGymBadgesInOrder(): BadgeDefinition[] {
    return this.getBadgesByCategory(BadgeCategory.GYM)
      .sort((a, b) => (a.unlockOrder || 0) - (b.unlockOrder || 0));
  }

  /**
   * Get trainer's badge statistics
   */
  public static getBadgeStats(trainer: TrainerProfile): {
    total: number;
    earned: number;
    byCategory: Record<string, number>;
    byRarity: Record<string, number>;
    completionPercentage: number;
  } {
    const total = this.badges.size;
    const earned = trainer.badges.length;
    
    const byCategory: Record<string, number> = {};
    const byRarity: Record<string, number> = {};

    Object.values(BadgeCategory).forEach(category => {
      byCategory[category] = trainer.badges.filter(badge => {
        const def = this.badges.get(badge.id);
        return def?.category === category;
      }).length;
    });

    Object.values(BadgeRarity).forEach(rarity => {
      byRarity[rarity] = trainer.badges.filter(badge => {
        const def = this.badges.get(badge.id);
        return def?.rarity === rarity;
      }).length;
    });

    return {
      total,
      earned,
      byCategory,
      byRarity,
      completionPercentage: Math.floor((earned / total) * 100)
    };
  }

  /**
   * Get badge definition
   */
  public static getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
    return this.badges.get(badgeId);
  }

  /**
   * Get next badge to earn
   */
  public static getNextBadge(trainer: TrainerProfile): BadgeDefinition | null {
    // Find the next gym badge in order
    const gymBadges = this.getGymBadgesInOrder();
    for (const badge of gymBadges) {
      if (!trainer.badges.some(b => b.id === badge.id) && this.canEarnBadge(trainer, badge.id)) {
        return badge;
      }
    }

    // If all gym badges earned, check Elite Four
    const eliteBadges = this.getBadgesByCategory(BadgeCategory.ELITE)
      .sort((a, b) => (a.unlockOrder || 0) - (b.unlockOrder || 0));
    
    for (const badge of eliteBadges) {
      if (!trainer.badges.some(b => b.id === badge.id) && this.canEarnBadge(trainer, badge.id)) {
        return badge;
      }
    }

    // Check champion badge
    const championBadge = this.getBadgesByCategory(BadgeCategory.CHAMPION)[0];
    if (championBadge && !trainer.badges.some(b => b.id === championBadge.id) && this.canEarnBadge(trainer, championBadge.id)) {
      return championBadge;
    }

    return null;
  }
}