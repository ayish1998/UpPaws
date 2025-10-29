import { TrainerProfile, TrainerStats } from '../types/trainer.js';
import { Badge, HabitatType, TrainerPath } from '../types/common.js';
import { AchievementSystem } from './achievement-system.js';
import { UnlockSystem } from './unlock-system.js';

export interface ProgressionEvent {
  type: ProgressionEventType;
  data: any;
  timestamp: Date;
  experienceGained: number;
}

export enum ProgressionEventType {
  ANIMAL_CAPTURED = 'animal_captured',
  BATTLE_WON = 'battle_won',
  BATTLE_LOST = 'battle_lost',
  PUZZLE_SOLVED = 'puzzle_solved',
  HABITAT_EXPLORED = 'habitat_explored',
  ANIMAL_TRAINED = 'animal_trained',
  ACHIEVEMENT_EARNED = 'achievement_earned',
  BADGE_EARNED = 'badge_earned',
  CONSERVATION_MISSION = 'conservation_mission',
  SOCIAL_INTERACTION = 'social_interaction'
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  experienceGained: number;
  rewardsEarned: LevelUpReward[];
  achievementsUnlocked: string[];
  contentUnlocked: string[];
}

export interface LevelUpReward {
  type: 'currency' | 'item' | 'unlock' | 'bonus';
  id: string;
  quantity: number;
  description: string;
}

export interface GymChallenge {
  id: string;
  name: string;
  habitatType: HabitatType;
  gymLeader: string;
  description: string;
  requirements: GymRequirement[];
  challenges: Challenge[];
  badge: Badge;
  rewards: LevelUpReward[];
}

export interface GymRequirement {
  type: 'level' | 'animals_captured' | 'habitat_explored' | 'previous_badge';
  value: any;
  description: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'battle' | 'puzzle' | 'collection' | 'knowledge';
  difficulty: number;
  requirements: any;
  completed: boolean;
}

export interface EliteFourMember {
  id: string;
  name: string;
  title: string;
  specialization: TrainerPath;
  description: string;
  requirements: GymRequirement[];
  team: string[]; // Animal species IDs
  rewards: LevelUpReward[];
}

export class TrainerProgressionSystem {
  private static gymChallenges: Map<string, GymChallenge> = new Map();
  private static eliteFour: EliteFourMember[] = [];
  private static championData: any = null;

  /**
   * Initialize progression system
   */
  public static initialize(): void {
    this.loadGymChallenges();
    this.loadEliteFour();
    this.loadChampionData();
  }

  /**
   * Process a progression event and update trainer
   */
  public static processProgressionEvent(
    trainer: TrainerProfile,
    eventType: ProgressionEventType,
    eventData: any
  ): LevelUpResult {
    const experienceGained = this.calculateExperienceGain(eventType, eventData, trainer);
    const oldLevel = trainer.level;
    
    // Add experience
    trainer.experience += experienceGained;
    
    // Calculate new level
    const newLevel = this.calculateLevelFromExperience(trainer.experience);
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      trainer.level = newLevel;
    }

    // Update stats
    this.updateTrainerStats(trainer, eventType, eventData);

    // Check for achievements
    const newAchievements = AchievementSystem.checkAchievements(trainer, eventType, eventData);
    
    // Check for unlocks
    const newUnlocks = UnlockSystem.checkUnlocks(trainer);

    // Get level up rewards
    const rewardsEarned = leveledUp ? this.getLevelUpRewards(oldLevel, newLevel) : [];
    
    // Apply rewards
    rewardsEarned.forEach(reward => this.applyReward(trainer, reward));

    return {
      leveledUp,
      newLevel,
      experienceGained,
      rewardsEarned,
      achievementsUnlocked: newAchievements.map(a => a.id),
      contentUnlocked: newUnlocks
    };
  }

  /**
   * Calculate experience gain from event
   */
  private static calculateExperienceGain(
    eventType: ProgressionEventType,
    eventData: any,
    trainer: TrainerProfile
  ): number {
    const baseExperience: Record<ProgressionEventType, number> = {
      [ProgressionEventType.ANIMAL_CAPTURED]: 50,
      [ProgressionEventType.BATTLE_WON]: 100,
      [ProgressionEventType.BATTLE_LOST]: 25,
      [ProgressionEventType.PUZZLE_SOLVED]: 30,
      [ProgressionEventType.HABITAT_EXPLORED]: 75,
      [ProgressionEventType.ANIMAL_TRAINED]: 40,
      [ProgressionEventType.ACHIEVEMENT_EARNED]: 200,
      [ProgressionEventType.BADGE_EARNED]: 500,
      [ProgressionEventType.CONSERVATION_MISSION]: 150,
      [ProgressionEventType.SOCIAL_INTERACTION]: 20
    };

    let experience = baseExperience[eventType] || 0;

    // Apply multipliers based on event data
    switch (eventType) {
      case ProgressionEventType.ANIMAL_CAPTURED:
        if (eventData.rarity === 'legendary') experience *= 3;
        else if (eventData.rarity === 'epic') experience *= 2;
        else if (eventData.rarity === 'rare') experience *= 1.5;
        if (eventData.shiny) experience *= 2;
        break;
      
      case ProgressionEventType.BATTLE_WON:
        if (eventData.battleType === 'gym') experience *= 2;
        else if (eventData.battleType === 'tournament') experience *= 1.5;
        if (eventData.difficulty) experience *= eventData.difficulty;
        break;
      
      case ProgressionEventType.PUZZLE_SOLVED:
        if (eventData.difficulty) experience *= eventData.difficulty;
        if (eventData.timeBonus) experience += eventData.timeBonus;
        break;
    }

    // Specialization bonus
    const specializationBonus = this.getSpecializationBonus(trainer.specialization, eventType);
    experience = Math.floor(experience * specializationBonus);

    return experience;
  }

  /**
   * Get specialization bonus for event type
   */
  private static getSpecializationBonus(specialization: TrainerPath, eventType: ProgressionEventType): number {
    const bonuses: Record<TrainerPath, Partial<Record<ProgressionEventType, number>>> = {
      [TrainerPath.BATTLE]: {
        [ProgressionEventType.BATTLE_WON]: 1.3,
        [ProgressionEventType.ANIMAL_TRAINED]: 1.2
      },
      [TrainerPath.RESEARCH]: {
        [ProgressionEventType.PUZZLE_SOLVED]: 1.3,
        [ProgressionEventType.HABITAT_EXPLORED]: 1.2,
        [ProgressionEventType.ANIMAL_CAPTURED]: 1.1
      },
      [TrainerPath.CONSERVATION]: {
        [ProgressionEventType.CONSERVATION_MISSION]: 1.5,
        [ProgressionEventType.SOCIAL_INTERACTION]: 1.2,
        [ProgressionEventType.ACHIEVEMENT_EARNED]: 1.1
      }
    };

    return bonuses[specialization]?.[eventType] || 1.0;
  }

  /**
   * Update trainer stats based on event
   */
  private static updateTrainerStats(
    trainer: TrainerProfile,
    eventType: ProgressionEventType,
    eventData: any
  ): void {
    switch (eventType) {
      case ProgressionEventType.ANIMAL_CAPTURED:
        trainer.stats.totalAnimalsCapture++;
        break;
      case ProgressionEventType.BATTLE_WON:
        trainer.stats.totalBattlesWon++;
        break;
      case ProgressionEventType.BATTLE_LOST:
        trainer.stats.totalBattlesLost++;
        break;
      case ProgressionEventType.PUZZLE_SOLVED:
        trainer.stats.totalPuzzlesSolved++;
        break;
      case ProgressionEventType.HABITAT_EXPLORED:
        trainer.stats.totalHabitatsExplored++;
        if (eventData.habitatType && !trainer.stats.favoriteHabitat) {
          trainer.stats.favoriteHabitat = eventData.habitatType;
        }
        break;
    }

    // Update play time (simplified)
    trainer.stats.totalPlayTime += eventData.sessionTime || 0;
    trainer.lastActiveAt = new Date();
  }

  /**
   * Calculate level from total experience
   */
  private static calculateLevelFromExperience(experience: number): number {
    // Using a more complex formula for balanced progression
    // Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, etc.
    let level = 1;
    let requiredExp = 0;
    
    while (experience >= requiredExp) {
      level++;
      requiredExp += level * 100; // Each level requires more XP
    }
    
    return Math.min(level - 1, 100); // Cap at level 100
  }

  /**
   * Get experience required for next level
   */
  public static getExperienceForNextLevel(currentLevel: number): number {
    return (currentLevel + 1) * 100;
  }

  /**
   * Get level up rewards
   */
  private static getLevelUpRewards(oldLevel: number, newLevel: number): LevelUpReward[] {
    const rewards: LevelUpReward[] = [];

    for (let level = oldLevel + 1; level <= newLevel; level++) {
      // Base rewards for every level
      rewards.push({
        type: 'currency',
        id: 'pawCoins',
        quantity: level * 50,
        description: `${level * 50} PawCoins`
      });

      // Special rewards at milestone levels
      if (level % 5 === 0) {
        rewards.push({
          type: 'currency',
          id: 'researchPoints',
          quantity: level * 10,
          description: `${level * 10} Research Points`
        });
      }

      if (level % 10 === 0) {
        rewards.push({
          type: 'item',
          id: 'premium_capture_kit',
          quantity: 1,
          description: 'Premium Capture Kit'
        });
      }

      // Major milestone rewards
      if (level === 25) {
        rewards.push({
          type: 'unlock',
          id: 'advanced_training',
          quantity: 1,
          description: 'Advanced Training Unlocked'
        });
      }

      if (level === 50) {
        rewards.push({
          type: 'unlock',
          id: 'elite_four_access',
          quantity: 1,
          description: 'Elite Four Access Unlocked'
        });
      }
    }

    return rewards;
  }

  /**
   * Apply reward to trainer
   */
  private static applyReward(trainer: TrainerProfile, reward: LevelUpReward): void {
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
      case 'unlock':
        // Unlocks are handled by the unlock system
        break;
    }
  }

  /**
   * Load gym challenges
   */
  private static loadGymChallenges(): void {
    const gyms: GymChallenge[] = [
      {
        id: 'forest_gym',
        name: 'Forest Sanctuary Gym',
        habitatType: HabitatType.FOREST,
        gymLeader: 'Ranger Oak',
        description: 'Master the mysteries of the forest and its creatures',
        requirements: [
          { type: 'level', value: 10, description: 'Reach trainer level 10' },
          { type: 'animals_captured', value: 5, description: 'Capture 5 forest animals' }
        ],
        challenges: [
          {
            id: 'forest_knowledge',
            name: 'Forest Knowledge',
            description: 'Answer questions about forest ecosystems',
            type: 'knowledge',
            difficulty: 1,
            requirements: { correctAnswers: 8, totalQuestions: 10 },
            completed: false
          },
          {
            id: 'forest_battle',
            name: 'Forest Guardian Battle',
            description: 'Defeat Ranger Oak in battle',
            type: 'battle',
            difficulty: 2,
            requirements: { opponent: 'ranger_oak', winCondition: 'defeat_all' },
            completed: false
          }
        ],
        badge: {
          id: 'forest_badge',
          name: 'Forest Badge',
          description: 'Proof of mastery over forest creatures',
          habitatType: HabitatType.FOREST,
          earnedAt: new Date(),
          gymLeader: 'Ranger Oak'
        },
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 1000, description: '1000 PawCoins' },
          { type: 'item', id: 'forest_capture_kit', quantity: 5, description: '5 Forest Capture Kits' }
        ]
      },
      {
        id: 'ocean_gym',
        name: 'Deep Blue Gym',
        habitatType: HabitatType.OCEAN,
        gymLeader: 'Captain Marina',
        description: 'Dive deep and master the ocean\'s mysteries',
        requirements: [
          { type: 'level', value: 15, description: 'Reach trainer level 15' },
          { type: 'previous_badge', value: 'forest_badge', description: 'Earn Forest Badge' },
          { type: 'animals_captured', value: 3, description: 'Capture 3 ocean animals' }
        ],
        challenges: [
          {
            id: 'ocean_exploration',
            name: 'Deep Sea Exploration',
            description: 'Explore the deepest parts of the ocean habitat',
            type: 'collection',
            difficulty: 2,
            requirements: { deepSeaAnimals: 2, explorationDepth: 1000 },
            completed: false
          },
          {
            id: 'ocean_battle',
            name: 'Tidal Battle',
            description: 'Defeat Captain Marina in an ocean-themed battle',
            type: 'battle',
            difficulty: 3,
            requirements: { opponent: 'captain_marina', environment: 'ocean' },
            completed: false
          }
        ],
        badge: {
          id: 'ocean_badge',
          name: 'Ocean Badge',
          description: 'Proof of mastery over ocean creatures',
          habitatType: HabitatType.OCEAN,
          earnedAt: new Date(),
          gymLeader: 'Captain Marina'
        },
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 1500, description: '1500 PawCoins' },
          { type: 'unlock', id: 'deep_ocean_habitat', quantity: 1, description: 'Deep Ocean Habitat' }
        ]
      }
      // Additional gyms would be defined here...
    ];

    gyms.forEach(gym => {
      this.gymChallenges.set(gym.id, gym);
    });
  }

  /**
   * Load Elite Four data
   */
  private static loadEliteFour(): void {
    this.eliteFour = [
      {
        id: 'elite_researcher',
        name: 'Dr. Sarah Chen',
        title: 'The Knowledge Keeper',
        specialization: TrainerPath.RESEARCH,
        description: 'Master of animal behavior and ecosystem science',
        requirements: [
          { type: 'level', value: 50, description: 'Reach trainer level 50' },
          { type: 'animals_captured', value: 100, description: 'Capture 100 unique species' }
        ],
        team: ['elephant', 'dolphin', 'owl', 'octopus', 'chimpanzee'],
        rewards: [
          { type: 'currency', id: 'researchPoints', quantity: 2000, description: '2000 Research Points' },
          { type: 'unlock', id: 'legendary_research', quantity: 1, description: 'Legendary Research Access' }
        ]
      },
      {
        id: 'elite_battler',
        name: 'Commander Rex',
        title: 'The Battle Master',
        specialization: TrainerPath.BATTLE,
        description: 'Legendary trainer known for strategic brilliance',
        requirements: [
          { type: 'level', value: 50, description: 'Reach trainer level 50' },
          { type: 'previous_badge', value: 'elite_researcher', description: 'Defeat Dr. Sarah Chen' }
        ],
        team: ['lion', 'eagle', 'shark', 'bear', 'tiger'],
        rewards: [
          { type: 'currency', id: 'battleTokens', quantity: 1000, description: '1000 Battle Tokens' },
          { type: 'unlock', id: 'legendary_battles', quantity: 1, description: 'Legendary Battle Mode' }
        ]
      },
      {
        id: 'elite_conservationist',
        name: 'Dr. Maya Patel',
        title: 'The Guardian',
        specialization: TrainerPath.CONSERVATION,
        description: 'Devoted to protecting endangered species',
        requirements: [
          { type: 'level', value: 50, description: 'Reach trainer level 50' },
          { type: 'previous_badge', value: 'elite_battler', description: 'Defeat Commander Rex' }
        ],
        team: ['panda', 'rhino', 'snow_leopard', 'orangutan', 'sea_turtle'],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 5000, description: '5000 PawCoins' },
          { type: 'unlock', id: 'conservation_sanctuary', quantity: 1, description: 'Conservation Sanctuary' }
        ]
      },
      {
        id: 'elite_champion',
        name: 'Professor Wilde',
        title: 'The Grand Champion',
        specialization: TrainerPath.RESEARCH, // Balanced across all paths
        description: 'The ultimate trainer who has mastered all aspects of animal training',
        requirements: [
          { type: 'level', value: 60, description: 'Reach trainer level 60' },
          { type: 'previous_badge', value: 'elite_conservationist', description: 'Defeat Dr. Maya Patel' }
        ],
        team: ['legendary_phoenix', 'legendary_dragon', 'legendary_kraken', 'legendary_griffin', 'legendary_unicorn'],
        rewards: [
          { type: 'currency', id: 'pawCoins', quantity: 10000, description: '10000 PawCoins' },
          { type: 'currency', id: 'researchPoints', quantity: 5000, description: '5000 Research Points' },
          { type: 'currency', id: 'battleTokens', quantity: 2000, description: '2000 Battle Tokens' },
          { type: 'unlock', id: 'champion_status', quantity: 1, description: 'Champion Status' }
        ]
      }
    ];
  }

  /**
   * Load champion data
   */
  private static loadChampionData(): void {
    this.championData = {
      title: 'Regional Champion',
      description: 'The ultimate achievement in animal training',
      requirements: [
        { type: 'level', value: 75, description: 'Reach trainer level 75' },
        { type: 'previous_badge', value: 'elite_champion', description: 'Defeat Professor Wilde' }
      ],
      benefits: [
        'Access to legendary animal habitats',
        'Champion-exclusive tournaments',
        'Special champion outfit and title',
        'Ability to mentor new trainers'
      ]
    };
  }

  /**
   * Get available gym challenges for trainer
   */
  public static getAvailableGyms(trainer: TrainerProfile): GymChallenge[] {
    const available: GymChallenge[] = [];
    
    for (const gym of this.gymChallenges.values()) {
      if (this.meetsGymRequirements(trainer, gym.requirements)) {
        available.push(gym);
      }
    }
    
    return available;
  }

  /**
   * Check if trainer meets gym requirements
   */
  private static meetsGymRequirements(trainer: TrainerProfile, requirements: GymRequirement[]): boolean {
    return requirements.every(req => {
      switch (req.type) {
        case 'level':
          return trainer.level >= req.value;
        case 'animals_captured':
          return trainer.stats.totalAnimalsCapture >= req.value;
        case 'habitat_explored':
          return trainer.stats.totalHabitatsExplored >= req.value;
        case 'previous_badge':
          return trainer.badges.some(badge => badge.id === req.value);
        default:
          return false;
      }
    });
  }

  /**
   * Complete gym challenge
   */
  public static completeGymChallenge(trainer: TrainerProfile, gymId: string): boolean {
    const gym = this.gymChallenges.get(gymId);
    if (!gym || !this.meetsGymRequirements(trainer, gym.requirements)) {
      return false;
    }

    // Award badge
    const badge: Badge = {
      ...gym.badge,
      earnedAt: new Date()
    };
    trainer.badges.push(badge);

    // Apply rewards
    gym.rewards.forEach(reward => this.applyReward(trainer, reward));

    // Process progression event
    this.processProgressionEvent(trainer, ProgressionEventType.BADGE_EARNED, {
      badgeId: badge.id,
      gymId: gymId,
      habitatType: gym.habitatType
    });

    return true;
  }

  /**
   * Get Elite Four progress
   */
  public static getEliteFourProgress(trainer: TrainerProfile): {
    member: EliteFourMember;
    canChallenge: boolean;
    defeated: boolean;
  }[] {
    return this.eliteFour.map(member => ({
      member,
      canChallenge: this.meetsGymRequirements(trainer, member.requirements),
      defeated: trainer.badges.some(badge => badge.id === member.id)
    }));
  }

  /**
   * Get trainer progression summary
   */
  public static getProgressionSummary(trainer: TrainerProfile): {
    level: number;
    experience: number;
    experienceToNext: number;
    badges: number;
    totalBadges: number;
    eliteFourDefeated: number;
    isChampion: boolean;
    nextMilestone: string;
  } {
    const experienceToNext = this.getExperienceForNextLevel(trainer.level) - 
                            (trainer.experience - this.getExperienceForLevel(trainer.level));
    
    const eliteFourDefeated = this.eliteFour.filter(member => 
      trainer.badges.some(badge => badge.id === member.id)
    ).length;
    
    const isChampion = trainer.badges.some(badge => badge.id === 'champion_status');
    
    let nextMilestone = 'Complete more challenges';
    if (trainer.level < 10) {
      nextMilestone = 'Reach level 10 to challenge first gym';
    } else if (trainer.badges.length < this.gymChallenges.size) {
      nextMilestone = 'Complete more gym challenges';
    } else if (trainer.level < 50) {
      nextMilestone = 'Reach level 50 to challenge Elite Four';
    } else if (eliteFourDefeated < 4) {
      nextMilestone = 'Defeat Elite Four members';
    } else if (!isChampion) {
      nextMilestone = 'Challenge the Champion';
    } else {
      nextMilestone = 'Defend your Champion title';
    }

    return {
      level: trainer.level,
      experience: trainer.experience,
      experienceToNext,
      badges: trainer.badges.length,
      totalBadges: this.gymChallenges.size + this.eliteFour.length + 1, // +1 for champion
      eliteFourDefeated,
      isChampion,
      nextMilestone
    };
  }

  /**
   * Get experience required for a specific level
   */
  private static getExperienceForLevel(level: number): number {
    let totalExp = 0;
    for (let i = 1; i < level; i++) {
      totalExp += i * 100;
    }
    return totalExp;
  }
}