import { TrainerProfile } from '../types/trainer.js';
import { HabitatType, Rarity } from '../types/common.js';
import { HabitatExplorationService } from './habitat-exploration.js';
import { WorldMapService } from './world-map.js';

export interface DailyExpedition {
  id: string;
  name: string;
  description: string;
  habitatId: string;
  difficulty: ExpeditionDifficulty;
  attemptsRemaining: number;
  maxAttempts: number;
  rewards: ExpeditionReward[];
  requirements: ExpeditionRequirement[];
  expiresAt: Date;
  isCompleted: boolean;
  expeditionType: ExpeditionType;
  specialConditions: SpecialCondition[];
}

export enum ExpeditionDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  EXPERT = 4,
  LEGENDARY = 5
}

export enum ExpeditionType {
  RARE_SIGHTING = 'rare_sighting',
  WEATHER_EVENT = 'weather_event',
  CONSERVATION = 'conservation',
  RESEARCH = 'research',
  EMERGENCY = 'emergency',
  SEASONAL = 'seasonal'
}

export interface ExpeditionReward {
  type: 'currency' | 'item' | 'animal' | 'experience' | 'achievement';
  value: any;
  quantity: number;
  rarity?: Rarity;
  description: string;
}

export interface ExpeditionRequirement {
  type: 'level' | 'item' | 'achievement' | 'habitat_progress';
  value: any;
  description: string;
}

export interface SpecialCondition {
  type: 'weather' | 'time' | 'season' | 'equipment';
  value: any;
  description: string;
}

export interface ExpeditionResult {
  success: boolean;
  rewards: ExpeditionReward[];
  animalsEncountered: EncounteredAnimal[];
  experienceGained: number;
  message: string;
  specialDiscoveries: Discovery[];
}

export interface EncounteredAnimal {
  speciesId: string;
  level: number;
  shiny: boolean;
  rarity: Rarity;
  captured: boolean;
}

export interface Discovery {
  type: 'location' | 'artifact' | 'phenomenon';
  name: string;
  description: string;
  rewards: ExpeditionReward[];
}

export class DailyExpeditionService {
  private static instance: DailyExpeditionService;
  private expeditions: Map<string, DailyExpedition[]> = new Map(); // trainerId -> expeditions
  private expeditionTemplates: ExpeditionTemplate[] = [];
  private habitatService: HabitatExplorationService;
  private worldMapService: WorldMapService;

  private constructor() {
    this.habitatService = HabitatExplorationService.getInstance();
    this.worldMapService = WorldMapService.getInstance();
    this.initializeExpeditionTemplates();
    this.scheduleDaily();
  }

  public static getInstance(): DailyExpeditionService {
    if (!DailyExpeditionService.instance) {
      DailyExpeditionService.instance = new DailyExpeditionService();
    }
    return DailyExpeditionService.instance;
  }

  private initializeExpeditionTemplates(): void {
    this.expeditionTemplates = [
      // Rare Sighting Expeditions
      {
        id: 'rare_sighting_forest',
        name: 'Mysterious Forest Sighting',
        description: 'Rangers report unusual animal activity in the {habitat}. A rare species may have appeared!',
        type: ExpeditionType.RARE_SIGHTING,
        habitatTypes: [HabitatType.FOREST],
        difficulty: ExpeditionDifficulty.MEDIUM,
        maxAttempts: 2,
        duration: 12, // hours
        baseRewards: [
          { type: 'experience', value: 100, quantity: 1, description: 'Exploration experience' },
          { type: 'currency', value: 'pawCoins', quantity: 50, description: 'Expedition bonus' }
        ],
        rareRewards: [
          { type: 'animal', value: 'rare_forest_animal', quantity: 1, rarity: Rarity.RARE, description: 'Rare forest creature' }
        ],
        requirements: [
          { type: 'level', value: 5, description: 'Minimum trainer level 5' }
        ]
      },
      {
        id: 'legendary_ocean_encounter',
        name: 'Legendary Ocean Encounter',
        description: 'Deep sea sensors detected a massive creature in the {habitat}. This could be legendary!',
        type: ExpeditionType.RARE_SIGHTING,
        habitatTypes: [HabitatType.OCEAN],
        difficulty: ExpeditionDifficulty.LEGENDARY,
        maxAttempts: 1,
        duration: 24,
        baseRewards: [
          { type: 'experience', value: 500, quantity: 1, description: 'Legendary encounter experience' },
          { type: 'currency', value: 'researchPoints', quantity: 100, description: 'Research contribution' }
        ],
        rareRewards: [
          { type: 'animal', value: 'legendary_sea_creature', quantity: 1, rarity: Rarity.LEGENDARY, description: 'Legendary ocean dweller' }
        ],
        requirements: [
          { type: 'level', value: 25, description: 'Minimum trainer level 25' },
          { type: 'achievement', value: 'ocean_master', description: 'Master of ocean habitats' }
        ]
      },

      // Weather Event Expeditions
      {
        id: 'aurora_phenomenon',
        name: 'Aurora Phenomenon',
        description: 'The northern lights are unusually active in {habitat}, affecting animal behavior.',
        type: ExpeditionType.WEATHER_EVENT,
        habitatTypes: [HabitatType.ARCTIC],
        difficulty: ExpeditionDifficulty.HARD,
        maxAttempts: 3,
        duration: 8,
        baseRewards: [
          { type: 'experience', value: 150, quantity: 1, description: 'Aurora observation experience' },
          { type: 'item', value: 'aurora_crystal', quantity: 1, description: 'Crystallized aurora energy' }
        ],
        rareRewards: [
          { type: 'animal', value: 'aurora_variant', quantity: 1, rarity: Rarity.EPIC, description: 'Aurora-touched creature' }
        ],
        requirements: [
          { type: 'level', value: 15, description: 'Minimum trainer level 15' }
        ],
        specialConditions: [
          { type: 'weather', value: 'aurora', description: 'Aurora must be active' }
        ]
      },
      {
        id: 'sandstorm_shelter',
        name: 'Sandstorm Shelter',
        description: 'A massive sandstorm in {habitat} has driven animals to seek shelter. Help them!',
        type: ExpeditionType.WEATHER_EVENT,
        habitatTypes: [HabitatType.DESERT],
        difficulty: ExpeditionDifficulty.MEDIUM,
        maxAttempts: 4,
        duration: 6,
        baseRewards: [
          { type: 'experience', value: 75, quantity: 1, description: 'Rescue experience' },
          { type: 'currency', value: 'pawCoins', quantity: 30, description: 'Rescue reward' }
        ],
        rareRewards: [
          { type: 'achievement', value: 'desert_rescuer', quantity: 1, description: 'Desert animal rescuer' }
        ],
        requirements: [
          { type: 'level', value: 8, description: 'Minimum trainer level 8' }
        ]
      },

      // Conservation Expeditions
      {
        id: 'endangered_species_protection',
        name: 'Endangered Species Protection',
        description: 'Critical conservation work needed in {habitat} to protect endangered species.',
        type: ExpeditionType.CONSERVATION,
        habitatTypes: [HabitatType.JUNGLE, HabitatType.FOREST],
        difficulty: ExpeditionDifficulty.EXPERT,
        maxAttempts: 2,
        duration: 18,
        baseRewards: [
          { type: 'experience', value: 200, quantity: 1, description: 'Conservation experience' },
          { type: 'currency', value: 'researchPoints', quantity: 75, description: 'Conservation contribution' },
          { type: 'achievement', value: 'conservationist', quantity: 1, description: 'Wildlife protector' }
        ],
        rareRewards: [
          { type: 'animal', value: 'rescued_endangered', quantity: 1, rarity: Rarity.EPIC, description: 'Rescued endangered animal' }
        ],
        requirements: [
          { type: 'level', value: 20, description: 'Minimum trainer level 20' },
          { type: 'achievement', value: 'animal_lover', description: 'Proven dedication to animals' }
        ]
      },

      // Research Expeditions
      {
        id: 'behavioral_study',
        name: 'Animal Behavior Study',
        description: 'Scientists need behavioral data from animals in {habitat} for important research.',
        type: ExpeditionType.RESEARCH,
        habitatTypes: [HabitatType.GRASSLAND, HabitatType.SAVANNA],
        difficulty: ExpeditionDifficulty.EASY,
        maxAttempts: 5,
        duration: 4,
        baseRewards: [
          { type: 'experience', value: 50, quantity: 1, description: 'Research experience' },
          { type: 'currency', value: 'researchPoints', quantity: 25, description: 'Research contribution' }
        ],
        rareRewards: [
          { type: 'item', value: 'research_data', quantity: 1, description: 'Valuable research data' }
        ],
        requirements: [
          { type: 'level', value: 3, description: 'Minimum trainer level 3' }
        ]
      },

      // Emergency Expeditions
      {
        id: 'habitat_restoration',
        name: 'Emergency Habitat Restoration',
        description: 'Environmental damage in {habitat} requires immediate restoration efforts.',
        type: ExpeditionType.EMERGENCY,
        habitatTypes: [HabitatType.FOREST, HabitatType.OCEAN, HabitatType.JUNGLE],
        difficulty: ExpeditionDifficulty.HARD,
        maxAttempts: 1,
        duration: 12,
        baseRewards: [
          { type: 'experience', value: 300, quantity: 1, description: 'Restoration experience' },
          { type: 'currency', value: 'pawCoins', quantity: 100, description: 'Emergency response reward' },
          { type: 'achievement', value: 'habitat_restorer', quantity: 1, description: 'Environmental hero' }
        ],
        rareRewards: [
          { type: 'item', value: 'restoration_kit', quantity: 1, description: 'Advanced restoration equipment' }
        ],
        requirements: [
          { type: 'level', value: 18, description: 'Minimum trainer level 18' }
        ]
      },

      // Seasonal Expeditions
      {
        id: 'migration_tracking',
        name: 'Great Migration Tracking',
        description: 'Track the seasonal migration patterns in {habitat} for conservation data.',
        type: ExpeditionType.SEASONAL,
        habitatTypes: [HabitatType.GRASSLAND, HabitatType.ARCTIC],
        difficulty: ExpeditionDifficulty.MEDIUM,
        maxAttempts: 3,
        duration: 10,
        baseRewards: [
          { type: 'experience', value: 120, quantity: 1, description: 'Migration tracking experience' },
          { type: 'currency', value: 'researchPoints', quantity: 40, description: 'Migration data value' }
        ],
        rareRewards: [
          { type: 'animal', value: 'migrating_species', quantity: 1, rarity: Rarity.UNCOMMON, description: 'Migrating animal' }
        ],
        requirements: [
          { type: 'level', value: 12, description: 'Minimum trainer level 12' }
        ],
        specialConditions: [
          { type: 'season', value: ['spring', 'autumn'], description: 'Only during migration seasons' }
        ]
      }
    ];
  }

  public async generateDailyExpeditions(trainer: TrainerProfile): Promise<DailyExpedition[]> {
    const existingExpeditions = this.expeditions.get(trainer.trainerId) || [];
    
    // Remove expired expeditions
    const activeExpeditions = existingExpeditions.filter(exp => exp.expiresAt > new Date());
    
    // Generate new expeditions if needed (max 3 per day)
    const expeditionsToGenerate = Math.max(0, 3 - activeExpeditions.length);
    const newExpeditions: DailyExpedition[] = [];

    for (let i = 0; i < expeditionsToGenerate; i++) {
      const expedition = this.generateRandomExpedition(trainer);
      if (expedition) {
        newExpeditions.push(expedition);
      }
    }

    const allExpeditions = [...activeExpeditions, ...newExpeditions];
    this.expeditions.set(trainer.trainerId, allExpeditions);
    
    return allExpeditions;
  }

  private generateRandomExpedition(trainer: TrainerProfile): DailyExpedition | null {
    // Get available habitats for the trainer
    const availableHabitats = this.habitatService.getAvailableHabitats(trainer);
    if (availableHabitats.length === 0) return null;

    // Filter templates based on trainer level and requirements
    const eligibleTemplates = this.expeditionTemplates.filter(template => 
      this.meetsRequirements(template.requirements, trainer)
    );

    if (eligibleTemplates.length === 0) return null;

    // Select random template
    const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
    
    // Select random habitat that matches template
    const matchingHabitats = availableHabitats.filter(habitat => 
      template.habitatTypes.includes(habitat.type)
    );

    if (matchingHabitats.length === 0) return null;

    const selectedHabitat = matchingHabitats[Math.floor(Math.random() * matchingHabitats.length)];

    // Generate expedition
    const expeditionId = `${template.id}_${trainer.trainerId}_${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + template.duration);

    return {
      id: expeditionId,
      name: template.name,
      description: template.description.replace('{habitat}', selectedHabitat.name),
      habitatId: selectedHabitat.id,
      difficulty: template.difficulty,
      attemptsRemaining: template.maxAttempts,
      maxAttempts: template.maxAttempts,
      rewards: [...template.baseRewards],
      requirements: template.requirements,
      expiresAt,
      isCompleted: false,
      expeditionType: template.type,
      specialConditions: template.specialConditions || []
    };
  }

  public async startExpedition(expeditionId: string, trainerId: string): Promise<ExpeditionResult> {
    const expeditions = this.expeditions.get(trainerId) || [];
    const expedition = expeditions.find(exp => exp.id === expeditionId);

    if (!expedition) {
      throw new Error('Expedition not found');
    }

    if (expedition.attemptsRemaining <= 0) {
      throw new Error('No attempts remaining');
    }

    if (expedition.isCompleted) {
      throw new Error('Expedition already completed');
    }

    if (expedition.expiresAt < new Date()) {
      throw new Error('Expedition has expired');
    }

    // Check special conditions
    if (!this.checkSpecialConditions(expedition.specialConditions)) {
      throw new Error('Special conditions not met');
    }

    // Simulate expedition
    expedition.attemptsRemaining--;
    const result = await this.simulateExpedition(expedition);

    if (result.success) {
      expedition.isCompleted = true;
    }

    return result;
  }

  private async simulateExpedition(expedition: DailyExpedition): Promise<ExpeditionResult> {
    const baseSuccessRate = this.calculateSuccessRate(expedition.difficulty);
    const success = Math.random() < baseSuccessRate;

    const result: ExpeditionResult = {
      success,
      rewards: [],
      animalsEncountered: [],
      experienceGained: 0,
      message: '',
      specialDiscoveries: []
    };

    if (success) {
      // Award base rewards
      result.rewards = [...expedition.rewards];
      result.experienceGained = expedition.difficulty * 50;
      result.message = `Successfully completed ${expedition.name}!`;

      // Chance for bonus rewards based on expedition type
      if (Math.random() < 0.3) { // 30% chance for bonus
        result.rewards.push({
          type: 'currency',
          value: 'pawCoins',
          quantity: expedition.difficulty * 20,
          description: 'Expedition bonus'
        });
      }

      // Generate animal encounters for certain expedition types
      if (expedition.expeditionType === ExpeditionType.RARE_SIGHTING) {
        const encounter = this.generateAnimalEncounter(expedition);
        if (encounter) {
          result.animalsEncountered.push(encounter);
        }
      }

      // Chance for special discoveries
      if (Math.random() < 0.1) { // 10% chance
        const discovery = this.generateSpecialDiscovery(expedition);
        if (discovery) {
          result.specialDiscoveries.push(discovery);
        }
      }

    } else {
      result.experienceGained = expedition.difficulty * 10;
      result.message = `Failed to complete ${expedition.name}. ${expedition.attemptsRemaining} attempts remaining.`;
      
      // Small consolation reward
      result.rewards.push({
        type: 'experience',
        value: result.experienceGained,
        quantity: 1,
        description: 'Learning experience'
      });
    }

    return result;
  }

  private calculateSuccessRate(difficulty: ExpeditionDifficulty): number {
    switch (difficulty) {
      case ExpeditionDifficulty.EASY: return 0.9;
      case ExpeditionDifficulty.MEDIUM: return 0.7;
      case ExpeditionDifficulty.HARD: return 0.5;
      case ExpeditionDifficulty.EXPERT: return 0.3;
      case ExpeditionDifficulty.LEGENDARY: return 0.1;
      default: return 0.5;
    }
  }

  private generateAnimalEncounter(expedition: DailyExpedition): EncounteredAnimal | null {
    // This would use the habitat service to generate appropriate encounters
    const rarityChance = Math.random();
    let rarity: Rarity;

    if (rarityChance < 0.05) rarity = Rarity.LEGENDARY;
    else if (rarityChance < 0.15) rarity = Rarity.EPIC;
    else if (rarityChance < 0.35) rarity = Rarity.RARE;
    else if (rarityChance < 0.65) rarity = Rarity.UNCOMMON;
    else rarity = Rarity.COMMON;

    return {
      speciesId: `expedition_encounter_${expedition.difficulty}`,
      level: expedition.difficulty * 5 + Math.floor(Math.random() * 10),
      shiny: Math.random() < 0.01, // 1% shiny chance
      rarity,
      captured: Math.random() < 0.8 // 80% capture rate for expeditions
    };
  }

  private generateSpecialDiscovery(expedition: DailyExpedition): Discovery | null {
    const discoveries = [
      {
        type: 'artifact' as const,
        name: 'Ancient Relic',
        description: 'An mysterious artifact from a lost civilization.',
        rewards: [
          { type: 'currency' as const, value: 'researchPoints', quantity: 100, description: 'Archaeological value' }
        ]
      },
      {
        type: 'location' as const,
        name: 'Hidden Grove',
        description: 'A secret location where rare animals gather.',
        rewards: [
          { type: 'achievement' as const, value: 'explorer', quantity: 1, description: 'Discovered hidden location' }
        ]
      },
      {
        type: 'phenomenon' as const,
        name: 'Unusual Weather Pattern',
        description: 'A rare meteorological event affecting local wildlife.',
        rewards: [
          { type: 'item' as const, value: 'weather_data', quantity: 1, description: 'Valuable weather research data' }
        ]
      }
    ];

    return discoveries[Math.floor(Math.random() * discoveries.length)];
  }

  private meetsRequirements(requirements: ExpeditionRequirement[], trainer: TrainerProfile): boolean {
    return requirements.every(req => {
      switch (req.type) {
        case 'level':
          return trainer.level >= req.value;
        case 'achievement':
          return trainer.achievements.some(achievement => achievement.id === req.value);
        case 'item':
          return trainer.inventory.some(item => item.id === req.value);
        default:
          return true;
      }
    });
  }

  private checkSpecialConditions(conditions: SpecialCondition[]): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'season':
          const currentSeason = this.getCurrentSeason();
          return condition.value.includes(currentSeason);
        case 'weather':
          // This would check current weather conditions
          return true; // Simplified for now
        case 'time':
          const currentHour = new Date().getHours();
          return currentHour >= condition.value.start && currentHour <= condition.value.end;
        default:
          return true;
      }
    });
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private scheduleDaily(): void {
    // Schedule daily expedition refresh at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.refreshAllExpeditions();
      // Then schedule every 24 hours
      setInterval(() => {
        this.refreshAllExpeditions();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private refreshAllExpeditions(): void {
    // Clear expired expeditions for all trainers
    this.expeditions.forEach((expeditions, trainerId) => {
      const activeExpeditions = expeditions.filter(exp => exp.expiresAt > new Date());
      this.expeditions.set(trainerId, activeExpeditions);
    });
  }

  public getDailyExpeditions(trainerId: string): DailyExpedition[] {
    return this.expeditions.get(trainerId) || [];
  }
}

// Supporting interfaces
interface ExpeditionTemplate {
  id: string;
  name: string;
  description: string;
  type: ExpeditionType;
  habitatTypes: HabitatType[];
  difficulty: ExpeditionDifficulty;
  maxAttempts: number;
  duration: number; // hours
  baseRewards: ExpeditionReward[];
  rareRewards?: ExpeditionReward[];
  requirements: ExpeditionRequirement[];
  specialConditions?: SpecialCondition[];
}