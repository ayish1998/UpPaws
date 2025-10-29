import { TrainerProfile } from '../types/trainer.js';
import { HabitatType } from '../types/common.js';

export interface UnlockableContent {
  id: string;
  name: string;
  description: string;
  type: UnlockType;
  category: UnlockCategory;
  requirements: UnlockRequirement[];
  rewards: UnlockReward[];
  icon?: string;
  previewImage?: string;
}

export enum UnlockType {
  HABITAT = 'habitat',
  THEME = 'theme',
  FEATURE = 'feature',
  ANIMAL_SPECIES = 'animal_species',
  TRAINING_METHOD = 'training_method',
  BATTLE_MODE = 'battle_mode',
  COSMETIC = 'cosmetic',
  TOOL = 'tool'
}

export enum UnlockCategory {
  EXPLORATION = 'exploration',
  PROGRESSION = 'progression',
  ACHIEVEMENT = 'achievement',
  SOCIAL = 'social',
  PREMIUM = 'premium',
  SEASONAL = 'seasonal'
}

export interface UnlockRequirement {
  type: 'level' | 'achievement' | 'badge' | 'currency' | 'animal_count' | 'battle_wins' | 'streak';
  value: any;
  description: string;
}

export interface UnlockReward {
  type: 'access' | 'bonus' | 'cosmetic' | 'currency';
  id: string;
  value: any;
  description: string;
}

export interface UnlockProgress {
  unlockId: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  canUnlock: boolean;
  missingRequirements: string[];
}

export class UnlockSystem {
  private static unlockables: Map<string, UnlockableContent> = new Map();
  private static trainerUnlocks: Map<string, Set<string>> = new Map();

  /**
   * Initialize unlock system with content definitions
   */
  public static initialize(): void {
    this.loadUnlockableContent();
  }

  /**
   * Load all unlockable content definitions
   */
  private static loadUnlockableContent(): void {
    const content: UnlockableContent[] = [
      // Habitat Unlocks
      {
        id: 'arctic_habitat',
        name: 'Arctic Habitat',
        description: 'Explore the frozen tundra and discover arctic animals',
        type: UnlockType.HABITAT,
        category: UnlockCategory.EXPLORATION,
        requirements: [
          { type: 'level', value: 10, description: 'Reach trainer level 10' },
          { type: 'animal_count', value: 15, description: 'Capture 15 animals' }
        ],
        rewards: [
          { type: 'access', id: 'arctic_habitat', value: true, description: 'Access to Arctic Habitat' },
          { type: 'bonus', id: 'cold_resistance', value: 0.2, description: '20% bonus in cold environments' }
        ],
        icon: '🏔️'
      },
      {
        id: 'deep_ocean_habitat',
        name: 'Deep Ocean Habitat',
        description: 'Dive into the mysterious depths of the ocean',
        type: UnlockType.HABITAT,
        category: UnlockCategory.EXPLORATION,
        requirements: [
          { type: 'level', value: 20, description: 'Reach trainer level 20' },
          { type: 'badge', value: 'ocean_badge', description: 'Earn Ocean Badge' }
        ],
        rewards: [
          { type: 'access', id: 'deep_ocean_habitat', value: true, description: 'Access to Deep Ocean Habitat' }
        ],
        icon: '🌊'
      },

      // Theme Unlocks
      {
        id: 'night_theme',
        name: 'Night Theme',
        description: 'Dark theme for nighttime exploration',
        type: UnlockType.THEME,
        category: UnlockCategory.PROGRESSION,
        requirements: [
          { type: 'achievement', value: 'night_owl', description: 'Complete Night Owl achievement' }
        ],
        rewards: [
          { type: 'cosmetic', id: 'night_theme', value: true, description: 'Night Theme Unlocked' }
        ],
        icon: '🌙'
      },
      {
        id: 'conservation_theme',
        name: 'Conservation Theme',
        description: 'Earth-friendly theme celebrating conservation',
        type: UnlockType.THEME,
        category: UnlockCategory.ACHIEVEMENT,
        requirements: [
          { type: 'achievement', value: 'conservationist', description: 'Complete Conservationist achievement' }
        ],
        rewards: [
          { type: 'cosmetic', id: 'conservation_theme', value: true, description: 'Conservation Theme Unlocked' }
        ],
        icon: '🌱'
      },

      // Feature Unlocks
      {
        id: 'advanced_training',
        name: 'Advanced Training',
        description: 'Unlock specialized training methods for your animals',
        type: UnlockType.TRAINING_METHOD,
        category: UnlockCategory.PROGRESSION,
        requirements: [
          { type: 'level', value: 25, description: 'Reach trainer level 25' },
          { type: 'animal_count', value: 30, description: 'Train 30 animals to level 10+' }
        ],
        rewards: [
          { type: 'access', id: 'advanced_training', value: true, description: 'Advanced Training Methods' },
          { type: 'bonus', id: 'training_efficiency', value: 0.5, description: '50% faster training' }
        ],
        icon: '💪'
      },
      {
        id: 'breeding_facility',
        name: 'Breeding Facility',
        description: 'Breed animals to discover new species combinations',
        type: UnlockType.FEATURE,
        category: UnlockCategory.PROGRESSION,
        requirements: [
          { type: 'level', value: 30, description: 'Reach trainer level 30' },
          { type: 'achievement', value: 'master_trainer', description: 'Complete Master Trainer achievement' }
        ],
        rewards: [
          { type: 'access', id: 'breeding_facility', value: true, description: 'Animal Breeding Facility' }
        ],
        icon: '🥚'
      },

      // Battle Mode Unlocks
      {
        id: 'tournament_mode',
        name: 'Tournament Mode',
        description: 'Compete in structured tournaments against other trainers',
        type: UnlockType.BATTLE_MODE,
        category: UnlockCategory.PROGRESSION,
        requirements: [
          { type: 'level', value: 15, description: 'Reach trainer level 15' },
          { type: 'battle_wins', value: 10, description: 'Win 10 trainer battles' }
        ],
        rewards: [
          { type: 'access', id: 'tournament_mode', value: true, description: 'Tournament Battles' }
        ],
        icon: '🏆'
      },
      {
        id: 'raid_battles',
        name: 'Raid Battles',
        description: 'Team up with other trainers to battle legendary animals',
        type: UnlockType.BATTLE_MODE,
        category: UnlockCategory.SOCIAL,
        requirements: [
          { type: 'level', value: 40, description: 'Reach trainer level 40' },
          { type: 'achievement', value: 'battle_champion', description: 'Complete Battle Champion achievement' }
        ],
        rewards: [
          { type: 'access', id: 'raid_battles', value: true, description: 'Raid Battle Mode' }
        ],
        icon: '⚔️'
      },

      // Tool Unlocks
      {
        id: 'shiny_tracker',
        name: 'Shiny Tracker',
        description: 'Track and locate shiny animals more easily',
        type: UnlockType.TOOL,
        category: UnlockCategory.ACHIEVEMENT,
        requirements: [
          { type: 'achievement', value: 'shiny_hunter', description: 'Complete Shiny Hunter achievement' }
        ],
        rewards: [
          { type: 'access', id: 'shiny_tracker', value: true, description: 'Shiny Animal Tracker' },
          { type: 'bonus', id: 'shiny_encounter_rate', value: 0.1, description: '10% higher shiny encounter rate' }
        ],
        icon: '✨'
      },
      {
        id: 'habitat_scanner',
        name: 'Habitat Scanner',
        description: 'Scan habitats to find rare animals and hidden areas',
        type: UnlockType.TOOL,
        category: UnlockCategory.EXPLORATION,
        requirements: [
          { type: 'level', value: 35, description: 'Reach trainer level 35' },
          { type: 'achievement', value: 'explorer', description: 'Complete Explorer achievement' }
        ],
        rewards: [
          { type: 'access', id: 'habitat_scanner', value: true, description: 'Habitat Scanner Tool' }
        ],
        icon: '🔍'
      },

      // Cosmetic Unlocks
      {
        id: 'champion_outfit',
        name: 'Champion Outfit',
        description: 'Exclusive outfit for battle champions',
        type: UnlockType.COSMETIC,
        category: UnlockCategory.ACHIEVEMENT,
        requirements: [
          { type: 'achievement', value: 'battle_champion', description: 'Complete Battle Champion achievement' }
        ],
        rewards: [
          { type: 'cosmetic', id: 'champion_outfit', value: true, description: 'Champion Trainer Outfit' }
        ],
        icon: '👑'
      },
      {
        id: 'researcher_badge',
        name: 'Researcher Badge',
        description: 'Special badge for dedicated researchers',
        type: UnlockType.COSMETIC,
        category: UnlockCategory.ACHIEVEMENT,
        requirements: [
          { type: 'achievement', value: 'fact_learner', description: 'Complete Fact Learner achievement' },
          { type: 'level', value: 20, description: 'Reach trainer level 20' }
        ],
        rewards: [
          { type: 'cosmetic', id: 'researcher_badge', value: true, description: 'Researcher Badge' }
        ],
        icon: '🔬'
      }
    ];

    content.forEach(item => {
      this.unlockables.set(item.id, item);
    });
  }

  /**
   * Check what content a trainer has unlocked
   */
  public static checkUnlocks(trainer: TrainerProfile): string[] {
    const newUnlocks: string[] = [];
    const trainerUnlocks = this.getTrainerUnlocks(trainer.trainerId);

    for (const [id, content] of this.unlockables) {
      if (!trainerUnlocks.has(id) && this.meetsRequirements(trainer, content.requirements)) {
        newUnlocks.push(id);
        trainerUnlocks.add(id);
        
        // Apply unlock rewards
        this.applyUnlockRewards(trainer, content.rewards);
      }
    }

    return newUnlocks;
  }

  /**
   * Check if trainer meets unlock requirements
   */
  private static meetsRequirements(trainer: TrainerProfile, requirements: UnlockRequirement[]): boolean {
    return requirements.every(req => {
      switch (req.type) {
        case 'level':
          return trainer.level >= req.value;
        case 'achievement':
          return trainer.achievements.some(a => a.id === req.value);
        case 'badge':
          return trainer.badges.some(b => b.id === req.value);
        case 'currency':
          const currencyType = req.value.type as keyof typeof trainer.currency;
          return trainer.currency[currencyType] >= req.value.amount;
        case 'animal_count':
          return trainer.stats.totalAnimalsCapture >= req.value;
        case 'battle_wins':
          return trainer.stats.totalBattlesWon >= req.value;
        case 'streak':
          return trainer.stats.currentStreak >= req.value;
        default:
          return false;
      }
    });
  }

  /**
   * Apply unlock rewards to trainer
   */
  private static applyUnlockRewards(trainer: TrainerProfile, rewards: UnlockReward[]): void {
    rewards.forEach(reward => {
      switch (reward.type) {
        case 'access':
          // Access rewards are handled by checking unlocks
          break;
        case 'bonus':
          // Bonuses would be applied in relevant systems
          break;
        case 'cosmetic':
          // Cosmetic items would be added to trainer's collection
          break;
        case 'currency':
          const currencyType = reward.id as keyof typeof trainer.currency;
          if (currencyType in trainer.currency) {
            trainer.currency[currencyType] += reward.value;
          }
          break;
      }
    });
  }

  /**
   * Get trainer's unlocked content
   */
  private static getTrainerUnlocks(trainerId: string): Set<string> {
    if (!this.trainerUnlocks.has(trainerId)) {
      this.trainerUnlocks.set(trainerId, new Set());
    }
    return this.trainerUnlocks.get(trainerId)!;
  }

  /**
   * Check if trainer has unlocked specific content
   */
  public static hasUnlocked(trainerId: string, unlockId: string): boolean {
    const trainerUnlocks = this.trainerUnlocks.get(trainerId);
    return trainerUnlocks ? trainerUnlocks.has(unlockId) : false;
  }

  /**
   * Get unlock progress for trainer
   */
  public static getUnlockProgress(trainer: TrainerProfile): Map<string, UnlockProgress> {
    const progress = new Map<string, UnlockProgress>();
    const trainerUnlocks = this.getTrainerUnlocks(trainer.trainerId);

    for (const [id, content] of this.unlockables) {
      const unlocked = trainerUnlocks.has(id);
      const canUnlock = !unlocked && this.meetsRequirements(trainer, content.requirements);
      const missingRequirements = unlocked ? [] : this.getMissingRequirements(trainer, content.requirements);

      progress.set(id, {
        unlockId: id,
        unlocked,
        progress: unlocked ? 100 : this.calculateProgress(trainer, content.requirements),
        maxProgress: 100,
        canUnlock,
        missingRequirements
      });
    }

    return progress;
  }

  /**
   * Get missing requirements for an unlock
   */
  private static getMissingRequirements(trainer: TrainerProfile, requirements: UnlockRequirement[]): string[] {
    return requirements
      .filter(req => !this.meetsRequirements(trainer, [req]))
      .map(req => req.description);
  }

  /**
   * Calculate progress percentage for requirements
   */
  private static calculateProgress(trainer: TrainerProfile, requirements: UnlockRequirement[]): number {
    if (requirements.length === 0) return 100;

    const totalProgress = requirements.reduce((sum, req) => {
      let current = 0;
      let target = 1;

      switch (req.type) {
        case 'level':
          current = trainer.level;
          target = req.value;
          break;
        case 'animal_count':
          current = trainer.stats.totalAnimalsCapture;
          target = req.value;
          break;
        case 'battle_wins':
          current = trainer.stats.totalBattlesWon;
          target = req.value;
          break;
        case 'streak':
          current = trainer.stats.currentStreak;
          target = req.value;
          break;
        case 'achievement':
        case 'badge':
          current = this.meetsRequirements(trainer, [req]) ? 1 : 0;
          target = 1;
          break;
        default:
          current = 0;
          target = 1;
      }

      return sum + Math.min(current / target, 1);
    }, 0);

    return Math.floor((totalProgress / requirements.length) * 100);
  }

  /**
   * Get unlockable content by type
   */
  public static getUnlockablesByType(type: UnlockType): UnlockableContent[] {
    return Array.from(this.unlockables.values()).filter(u => u.type === type);
  }

  /**
   * Get unlockable content by category
   */
  public static getUnlockablesByCategory(category: UnlockCategory): UnlockableContent[] {
    return Array.from(this.unlockables.values()).filter(u => u.category === category);
  }

  /**
   * Get all available habitats for trainer
   */
  public static getAvailableHabitats(trainerId: string): HabitatType[] {
    const trainerUnlocks = this.getTrainerUnlocks(trainerId);
    const availableHabitats: HabitatType[] = [
      HabitatType.FOREST,    // Always available
      HabitatType.GRASSLAND, // Always available
      HabitatType.OCEAN      // Always available
    ];

    // Add unlocked habitats
    if (trainerUnlocks.has('arctic_habitat')) {
      availableHabitats.push(HabitatType.ARCTIC);
    }
    if (trainerUnlocks.has('deep_ocean_habitat')) {
      // This would be a special ocean variant
    }
    // Add other habitat unlocks...

    return availableHabitats;
  }

  /**
   * Get unlock content definition
   */
  public static getUnlockContent(id: string): UnlockableContent | undefined {
    return this.unlockables.get(id);
  }

  /**
   * Force unlock content for trainer (admin/testing)
   */
  public static forceUnlock(trainerId: string, unlockId: string): boolean {
    const content = this.unlockables.get(unlockId);
    if (!content) return false;

    const trainerUnlocks = this.getTrainerUnlocks(trainerId);
    trainerUnlocks.add(unlockId);
    return true;
  }

  /**
   * Get unlock statistics for trainer
   */
  public static getUnlockStats(trainerId: string): {
    total: number;
    unlocked: number;
    available: number;
    byType: Record<string, number>;
  } {
    const total = this.unlockables.size;
    const trainerUnlocks = this.getTrainerUnlocks(trainerId);
    const unlocked = trainerUnlocks.size;
    
    // Count available unlocks (not yet unlocked but requirements met)
    // This would require trainer profile to calculate properly
    const available = 0; // Simplified

    const byType: Record<string, number> = {};
    Object.values(UnlockType).forEach(type => {
      byType[type] = Array.from(trainerUnlocks).filter(id => {
        const content = this.unlockables.get(id);
        return content?.type === type;
      }).length;
    });

    return { total, unlocked, available, byType };
  }
}