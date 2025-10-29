import { Achievement } from '../types/common.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  hidden: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon?: string;
}

export enum AchievementCategory {
  GAMEPLAY = 'gameplay',
  EDUCATIONAL = 'educational',
  SOCIAL = 'social',
  COLLECTION = 'collection',
  BATTLE = 'battle',
  EXPLORATION = 'exploration',
  TRAINING = 'training',
  CONSERVATION = 'conservation'
}

export enum AchievementType {
  COUNTER = 'counter',        // Count-based (catch 100 animals)
  MILESTONE = 'milestone',    // Single achievement (reach level 50)
  COLLECTION = 'collection',  // Collect specific items/animals
  STREAK = 'streak',         // Consecutive actions
  CONDITIONAL = 'conditional' // Complex conditions
}

export interface AchievementRequirement {
  type: string;
  target: number;
  condition?: any;
  description: string;
}

export interface AchievementReward {
  type: 'currency' | 'item' | 'unlock' | 'title' | 'cosmetic';
  id: string;
  quantity: number;
  description: string;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  completed: boolean;
  completedAt?: Date;
  milestones: number[];
}

export class AchievementSystem {
  private static achievements: Map<string, AchievementDefinition> = new Map();

  /**
   * Initialize achievement definitions
   */
  public static initialize(): void {
    this.loadAchievementDefinitions();
  }

  /**
   * Load all achievement definitions
   */
  private static loadAchievementDefinitions(): void {
    const definitions: AchievementDefinition[] = [
      // Gameplay Achievements
      {
        id: 'first_capture',
        name: 'First Friend',
        description: 'Capture your first animal',
        category: AchievementCategory.GAMEPLAY,
        type: AchievementType.MILESTONE,
        requirements: [{ type: 'animals_captured', target: 1, description: 'Capture 1 animal' }],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 100, description: '100 PawCoins' },
          { type: 'item', id: 'basic_capture_kit', quantity: 5, description: '5 Basic Capture Kits' }
        ],
        hidden: false,
        rarity: 'common',
        points: 10
      },
      {
        id: 'animal_collector',
        name: 'Animal Collector',
        description: 'Capture 50 different animal species',
        category: AchievementCategory.COLLECTION,
        type: AchievementType.COUNTER,
        requirements: [{ type: 'unique_species_captured', target: 50, description: 'Capture 50 unique species' }],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 1000, description: '1000 PawCoins' },
          { type: 'title', id: 'collector', quantity: 1, description: 'Collector Title' }
        ],
        hidden: false,
        rarity: 'rare',
        points: 100
      },
      {
        id: 'master_trainer',
        name: 'Master Trainer',
        description: 'Train an animal to level 50',
        category: AchievementCategory.TRAINING,
        type: AchievementType.MILESTONE,
        requirements: [{ type: 'animal_max_level', target: 50, description: 'Train an animal to level 50' }],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 500, description: '500 Research Points' },
          { type: 'unlock', id: 'advanced_training', quantity: 1, description: 'Advanced Training Unlocked' }
        ],
        hidden: false,
        rarity: 'epic',
        points: 200
      },

      // Educational Achievements
      {
        id: 'fact_learner',
        name: 'Fact Learner',
        description: 'Read 100 animal facts',
        category: AchievementCategory.EDUCATIONAL,
        type: AchievementType.COUNTER,
        requirements: [{ type: 'facts_read', target: 100, description: 'Read 100 animal facts' }],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 200, description: '200 Research Points' },
          { type: 'unlock', id: 'fact_database', quantity: 1, description: 'Fact Database Unlocked' }
        ],
        hidden: false,
        rarity: 'uncommon',
        points: 50
      },
      {
        id: 'conservationist',
        name: 'Conservationist',
        description: 'Complete 10 conservation missions',
        category: AchievementCategory.CONSERVATION,
        type: AchievementType.COUNTER,
        requirements: [{ type: 'conservation_missions', target: 10, description: 'Complete 10 conservation missions' }],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 1000, description: '1000 Research Points' },
          { type: 'title', id: 'conservationist', quantity: 1, description: 'Conservationist Title' },
          { type: 'unlock', id: 'endangered_species', quantity: 1, description: 'Endangered Species Habitat' }
        ],
        hidden: false,
        rarity: 'epic',
        points: 300
      },

      // Social Achievements
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Share 25 achievements on Reddit',
        category: AchievementCategory.SOCIAL,
        type: AchievementType.COUNTER,
        requirements: [{ type: 'achievements_shared', target: 25, description: 'Share 25 achievements' }],
        rewards: [
          { type: 'cosmetic', id: 'social_badge', quantity: 1, description: 'Social Media Badge' },
          { type: 'unlock', id: 'sharing_tools', quantity: 1, description: 'Advanced Sharing Tools' }
        ],
        hidden: false,
        rarity: 'rare',
        points: 150
      },

      // Battle Achievements
      {
        id: 'battle_champion',
        name: 'Battle Champion',
        description: 'Win 100 trainer battles',
        category: AchievementCategory.BATTLE,
        type: AchievementType.COUNTER,
        requirements: [{ type: 'trainer_battles_won', target: 100, description: 'Win 100 trainer battles' }],
        rewards: [
          { type: 'currency', id: 'battleTokens', quantity: 500, description: '500 Battle Tokens' },
          { type: 'title', id: 'champion', quantity: 1, description: 'Champion Title' },
          { type: 'unlock', id: 'elite_tournaments', quantity: 1, description: 'Elite Tournaments' }
        ],
        hidden: false,
        rarity: 'legendary',
        points: 500
      },

      // Exploration Achievements
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Discover all 8 habitat types',
        category: AchievementCategory.EXPLORATION,
        type: AchievementType.COLLECTION,
        requirements: [{ type: 'habitats_explored', target: 8, description: 'Explore all 8 habitats' }],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 2000, description: '2000 PawCoins' },
          { type: 'unlock', id: 'legendary_habitats', quantity: 1, description: 'Legendary Habitats' },
          { type: 'title', id: 'explorer', quantity: 1, description: 'Explorer Title' }
        ],
        hidden: false,
        rarity: 'epic',
        points: 250
      },

      // Hidden/Special Achievements
      {
        id: 'shiny_hunter',
        name: 'Shiny Hunter',
        description: 'Capture a shiny animal',
        category: AchievementCategory.COLLECTION,
        type: AchievementType.MILESTONE,
        requirements: [{ type: 'shiny_captured', target: 1, description: 'Capture 1 shiny animal' }],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 5000, description: '5000 PawCoins' },
          { type: 'title', id: 'shiny_hunter', quantity: 1, description: 'Shiny Hunter Title' },
          { type: 'unlock', id: 'shiny_tracker', quantity: 1, description: 'Shiny Tracker Tool' }
        ],
        hidden: true,
        rarity: 'legendary',
        points: 1000
      }
    ];

    definitions.forEach(def => {
      this.achievements.set(def.id, def);
    });
  }

  /**
   * Check and update achievement progress for a trainer
   */
  public static checkAchievements(trainer: TrainerProfile, eventType: string, eventData: any): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const [id, definition] of this.achievements) {
      // Skip if already completed
      if (trainer.achievements.find(a => a.id === id)) {
        continue;
      }

      // Check if this event is relevant to this achievement
      if (this.isEventRelevant(definition, eventType)) {
        const progress = this.calculateProgress(trainer, definition, eventData);
        
        if (progress.completed) {
          const achievement: Achievement = {
            id: definition.id,
            name: definition.name,
            description: definition.description,
            category: definition.category,
            unlockedAt: new Date(),
            progress: progress.current,
            maxProgress: progress.target
          };

          newAchievements.push(achievement);
          trainer.achievements.push(achievement);

          // Apply rewards
          this.applyRewards(trainer, definition.rewards);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check if an event is relevant to an achievement
   */
  private static isEventRelevant(definition: AchievementDefinition, eventType: string): boolean {
    return definition.requirements.some(req => req.type === eventType);
  }

  /**
   * Calculate achievement progress
   */
  private static calculateProgress(
    trainer: TrainerProfile, 
    definition: AchievementDefinition, 
    eventData: any
  ): AchievementProgress {
    const requirement = definition.requirements[0]; // Simplified for single requirement
    let current = 0;

    switch (requirement.type) {
      case 'animals_captured':
        current = trainer.stats.totalAnimalsCapture;
        break;
      case 'unique_species_captured':
        // This would need to be tracked separately
        current = eventData.uniqueSpeciesCount || 0;
        break;
      case 'animal_max_level':
        current = eventData.maxAnimalLevel || 0;
        break;
      case 'facts_read':
        // This would need to be tracked separately
        current = eventData.factsRead || 0;
        break;
      case 'conservation_missions':
        // This would need to be tracked separately
        current = eventData.conservationMissions || 0;
        break;
      case 'achievements_shared':
        // This would need to be tracked separately
        current = eventData.achievementsShared || 0;
        break;
      case 'trainer_battles_won':
        current = trainer.stats.totalBattlesWon;
        break;
      case 'habitats_explored':
        current = trainer.stats.totalHabitatsExplored;
        break;
      case 'shiny_captured':
        current = eventData.shinyCaptured || 0;
        break;
      default:
        current = 0;
    }

    return {
      achievementId: definition.id,
      current,
      target: requirement.target,
      completed: current >= requirement.target,
      milestones: []
    };
  }

  /**
   * Apply achievement rewards to trainer
   */
  private static applyRewards(trainer: TrainerProfile, rewards: AchievementReward[]): void {
    rewards.forEach(reward => {
      switch (reward.type) {
        case 'currency':
          if (reward.id in trainer.currency) {
            trainer.currency[reward.id as keyof typeof trainer.currency] += reward.quantity;
          }
          break;
        case 'item':
          // Add item to inventory (simplified)
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
          // This would update trainer's available titles
          break;
        case 'unlock':
          // This would unlock new features/content
          break;
        case 'cosmetic':
          // This would add cosmetic items
          break;
      }
    });
  }

  /**
   * Get all available achievements
   */
  public static getAllAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get achievements by category
   */
  public static getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
    return Array.from(this.achievements.values()).filter(a => a.category === category);
  }

  /**
   * Get trainer's achievement progress
   */
  public static getTrainerProgress(trainer: TrainerProfile): Map<string, AchievementProgress> {
    const progress = new Map<string, AchievementProgress>();

    for (const [id, definition] of this.achievements) {
      const completed = trainer.achievements.find(a => a.id === id);
      
      if (completed) {
        progress.set(id, {
          achievementId: id,
          current: completed.maxProgress,
          target: completed.maxProgress,
          completed: true,
          completedAt: completed.unlockedAt,
          milestones: []
        });
      } else {
        // Calculate current progress
        const currentProgress = this.calculateProgress(trainer, definition, {});
        progress.set(id, currentProgress);
      }
    }

    return progress;
  }

  /**
   * Get achievement definition by ID
   */
  public static getAchievement(id: string): AchievementDefinition | undefined {
    return this.achievements.get(id);
  }

  /**
   * Get achievements that can be shared
   */
  public static getShareableAchievements(trainer: TrainerProfile): Achievement[] {
    return trainer.achievements.filter(achievement => {
      const definition = this.achievements.get(achievement.id);
      return definition && !definition.hidden;
    });
  }

  /**
   * Generate achievement sharing content
   */
  public static generateSharingContent(achievement: Achievement): {
    title: string;
    description: string;
    imageUrl?: string;
  } {
    const definition = this.achievements.get(achievement.id);
    
    return {
      title: `🏆 Achievement Unlocked: ${achievement.name}`,
      description: `${achievement.description}\n\nEarned on ${achievement.unlockedAt.toLocaleDateString()}`,
      imageUrl: definition?.icon
    };
  }

  /**
   * Get milestone achievements (special recognition)
   */
  public static getMilestoneAchievements(): AchievementDefinition[] {
    return Array.from(this.achievements.values()).filter(a => 
      a.rarity === 'legendary' || a.points >= 500
    );
  }

  /**
   * Calculate total achievement points for trainer
   */
  public static calculateTotalPoints(trainer: TrainerProfile): number {
    return trainer.achievements.reduce((total, achievement) => {
      const definition = this.achievements.get(achievement.id);
      return total + (definition?.points || 0);
    }, 0);
  }

  /**
   * Get achievement statistics
   */
  public static getAchievementStats(trainer: TrainerProfile): {
    total: number;
    completed: number;
    points: number;
    byCategory: Record<string, number>;
  } {
    const total = this.achievements.size;
    const completed = trainer.achievements.length;
    const points = this.calculateTotalPoints(trainer);
    
    const byCategory: Record<string, number> = {};
    Object.values(AchievementCategory).forEach(category => {
      byCategory[category] = trainer.achievements.filter(a => {
        const def = this.achievements.get(a.id);
        return def?.category === category;
      }).length;
    });

    return { total, completed, points, byCategory };
  }
}