import { 
  Habitat, 
  ExplorationResult, 
  HabitatProgress, 
  AnimalEncounter,
  TimeOfDay,
  Season,
  calculateEncounterChance,
  generateExplorationResult
} from '../types/habitat.js';
import { HabitatType, Rarity } from '../types/common.js';
import { TrainerProfile } from '../types/trainer.js';
import { getAnimalsByHabitat, getAnimalById } from '../data/animal-database.js';

export class HabitatExplorationService {
  private static instance: HabitatExplorationService;
  private habitats: Map<string, Habitat> = new Map();
  private weatherSystem: WeatherSystem;

  private constructor() {
    this.weatherSystem = new WeatherSystem();
    this.initializeHabitats();
  }

  public static getInstance(): HabitatExplorationService {
    if (!HabitatExplorationService.instance) {
      HabitatExplorationService.instance = new HabitatExplorationService();
    }
    return HabitatExplorationService.instance;
  }

  private initializeHabitats(): void {
    // Initialize all habitat regions with their properties
    const habitatConfigs = [
      {
        id: 'enchanted_forest',
        name: 'Enchanted Forest',
        type: HabitatType.FOREST,
        description: 'A mystical woodland filled with ancient trees and hidden creatures.',
        explorationCost: 10,
        maxDailyExplorations: 3,
        discoveryBonus: 1.2,
        unlockRequirements: []
      },
      {
        id: 'crystal_ocean',
        name: 'Crystal Ocean',
        type: HabitatType.OCEAN,
        description: 'Pristine waters teeming with marine life and underwater mysteries.',
        explorationCost: 15,
        maxDailyExplorations: 2,
        discoveryBonus: 1.5,
        unlockRequirements: [
          { type: 'level', value: 5, description: 'Reach trainer level 5' }
        ]
      },
      {
        id: 'golden_desert',
        name: 'Golden Desert',
        type: HabitatType.DESERT,
        description: 'Vast sand dunes hiding resilient creatures adapted to extreme heat.',
        explorationCost: 20,
        maxDailyExplorations: 2,
        discoveryBonus: 1.3,
        unlockRequirements: [
          { type: 'level', value: 10, description: 'Reach trainer level 10' }
        ]
      },
      {
        id: 'frozen_peaks',
        name: 'Frozen Peaks',
        type: HabitatType.ARCTIC,
        description: 'Icy mountains where only the hardiest creatures survive.',
        explorationCost: 25,
        maxDailyExplorations: 1,
        discoveryBonus: 2.0,
        unlockRequirements: [
          { type: 'level', value: 15, description: 'Reach trainer level 15' },
          { type: 'badge', value: 'forest_master', description: 'Complete Forest Master badge' }
        ]
      },
      {
        id: 'emerald_jungle',
        name: 'Emerald Jungle',
        type: HabitatType.JUNGLE,
        description: 'Dense rainforest canopy hiding exotic and rare species.',
        explorationCost: 30,
        maxDailyExplorations: 1,
        discoveryBonus: 2.5,
        unlockRequirements: [
          { type: 'level', value: 20, description: 'Reach trainer level 20' },
          { type: 'achievement', value: 'rare_collector', description: 'Capture 10 rare animals' }
        ]
      },
      {
        id: 'savanna_plains',
        name: 'Savanna Plains',
        type: HabitatType.GRASSLAND,
        description: 'Endless grasslands where great herds roam under the African sun.',
        explorationCost: 18,
        maxDailyExplorations: 2,
        discoveryBonus: 1.4,
        unlockRequirements: [
          { type: 'level', value: 8, description: 'Reach trainer level 8' }
        ]
      },
      {
        id: 'sky_mountains',
        name: 'Sky Mountains',
        type: HabitatType.MOUNTAIN,
        description: 'Towering peaks where eagles soar and rare mountain dwellers thrive.',
        explorationCost: 22,
        maxDailyExplorations: 2,
        discoveryBonus: 1.6,
        unlockRequirements: [
          { type: 'level', value: 12, description: 'Reach trainer level 12' }
        ]
      }
    ];

    habitatConfigs.forEach(config => {
      const habitat = this.createHabitat(config);
      this.habitats.set(habitat.id, habitat);
    });
  }

  private createHabitat(config: any): Habitat {
    const availableAnimals = this.generateAnimalEncounters(config.type);
    
    return {
      id: config.id,
      name: config.name,
      type: config.type,
      description: config.description,
      availableAnimals,
      unlockRequirements: config.unlockRequirements,
      weatherEffects: this.generateWeatherEffects(config.type),
      specialEvents: [],
      explorationCost: config.explorationCost,
      maxDailyExplorations: config.maxDailyExplorations,
      discoveryBonus: config.discoveryBonus,
      imageUrl: `/images/habitats/${config.id}.jpg`,
      backgroundMusic: `/audio/habitats/${config.id}.mp3`
    };
  }

  private generateAnimalEncounters(habitatType: HabitatType): AnimalEncounter[] {
    const habitatAnimals = getAnimalsByHabitat(habitatType);
    
    return habitatAnimals.map(animal => ({
      speciesId: animal.id,
      encounterRate: this.calculateBaseEncounterRate(animal.rarity),
      minLevel: this.getMinLevelForRarity(animal.rarity),
      maxLevel: this.getMaxLevelForRarity(animal.rarity),
      rarity: animal.rarity,
      shinyChance: this.getShinyChance(animal.rarity),
      timeOfDay: this.getTimeOfDayPreference(animal.id),
      seasonRequirement: this.getSeasonRequirement(animal.id),
      specialConditions: []
    }));
  }

  private calculateBaseEncounterRate(rarity: Rarity): number {
    switch (rarity) {
      case Rarity.COMMON: return 0.4;
      case Rarity.UNCOMMON: return 0.25;
      case Rarity.RARE: return 0.15;
      case Rarity.EPIC: return 0.08;
      case Rarity.LEGENDARY: return 0.03;
      default: return 0.2;
    }
  }

  private getMinLevelForRarity(rarity: Rarity): number {
    switch (rarity) {
      case Rarity.COMMON: return 1;
      case Rarity.UNCOMMON: return 3;
      case Rarity.RARE: return 8;
      case Rarity.EPIC: return 15;
      case Rarity.LEGENDARY: return 25;
      default: return 1;
    }
  }

  private getMaxLevelForRarity(rarity: Rarity): number {
    switch (rarity) {
      case Rarity.COMMON: return 15;
      case Rarity.UNCOMMON: return 25;
      case Rarity.RARE: return 35;
      case Rarity.EPIC: return 45;
      case Rarity.LEGENDARY: return 50;
      default: return 20;
    }
  }

  private getShinyChance(rarity: Rarity): number {
    const baseChance = 0.001; // 1 in 1000
    switch (rarity) {
      case Rarity.LEGENDARY: return baseChance * 3;
      case Rarity.EPIC: return baseChance * 2;
      default: return baseChance;
    }
  }

  private getTimeOfDayPreference(animalId: string): TimeOfDay[] | undefined {
    // Some animals are more active at certain times
    if (animalId.includes('owl') || animalId.includes('bat')) {
      return [TimeOfDay.NIGHT, TimeOfDay.EVENING];
    }
    if (animalId.includes('eagle') || animalId.includes('hawk')) {
      return [TimeOfDay.MORNING, TimeOfDay.AFTERNOON];
    }
    return undefined; // Available all day
  }

  private getSeasonRequirement(animalId: string): Season[] | undefined {
    // Some animals are seasonal
    if (animalId.includes('arctic') || animalId.includes('polar')) {
      return [Season.WINTER];
    }
    if (animalId.includes('desert')) {
      return [Season.SUMMER, Season.SPRING];
    }
    return undefined; // Available all seasons
  }

  private generateWeatherEffects(habitatType: HabitatType) {
    const effects = [];
    
    switch (habitatType) {
      case HabitatType.OCEAN:
        effects.push({
          type: 'storm',
          modifier: 0.7,
          affectedTypes: [HabitatType.OCEAN]
        });
        break;
      case HabitatType.DESERT:
        effects.push({
          type: 'sandstorm',
          modifier: 0.5,
          affectedTypes: [HabitatType.DESERT]
        });
        break;
      case HabitatType.ARCTIC:
        effects.push({
          type: 'blizzard',
          modifier: 0.3,
          affectedTypes: [HabitatType.ARCTIC]
        });
        break;
    }
    
    return effects;
  }

  // Public methods for exploration
  public async exploreHabitat(
    habitatId: string, 
    trainer: TrainerProfile,
    expeditionType: 'normal' | 'extended' = 'normal'
  ): Promise<ExplorationResult> {
    const habitat = this.habitats.get(habitatId);
    if (!habitat) {
      throw new Error(`Habitat ${habitatId} not found`);
    }

    // Check if habitat is unlocked
    if (!this.isHabitatUnlocked(habitat, trainer)) {
      throw new Error(`Habitat ${habitat.name} is not unlocked`);
    }

    // Check daily exploration limit
    const progress = await this.getHabitatProgress(habitatId, trainer.trainerId);
    if (progress.explorationCount >= habitat.maxDailyExplorations) {
      throw new Error(`Daily exploration limit reached for ${habitat.name}`);
    }

    // Check if trainer has enough currency
    const cost = expeditionType === 'extended' ? habitat.explorationCost * 2 : habitat.explorationCost;
    if (trainer.currency.pawCoins < cost) {
      throw new Error('Insufficient PawCoins for exploration');
    }

    // Get current weather and time
    const currentWeather = this.weatherSystem.getCurrentWeather(habitatId);
    const currentTime = this.getCurrentTimeOfDay();
    const currentSeason = this.getCurrentSeason();

    // Generate exploration result
    const explorationBonus = expeditionType === 'extended' ? habitat.discoveryBonus * 1.5 : habitat.discoveryBonus;
    const result = generateExplorationResult(habitat, trainer.level, explorationBonus);

    // Apply weather effects
    if (currentWeather) {
      result.animalsEncountered = result.animalsEncountered.filter(encounter => {
        return Math.random() > (1 - currentWeather.encounterModifier);
      });
    }

    // Update habitat progress
    await this.updateHabitatProgress(habitatId, trainer.trainerId, result);

    return result;
  }

  public getAvailableHabitats(trainer: TrainerProfile): Habitat[] {
    return Array.from(this.habitats.values()).filter(habitat => 
      this.isHabitatUnlocked(habitat, trainer)
    );
  }

  public getHabitat(habitatId: string): Habitat | undefined {
    return this.habitats.get(habitatId);
  }

  public getAllHabitats(): Habitat[] {
    return Array.from(this.habitats.values());
  }

  private isHabitatUnlocked(habitat: Habitat, trainer: TrainerProfile): boolean {
    return habitat.unlockRequirements.every(requirement => {
      switch (requirement.type) {
        case 'level':
          return trainer.level >= requirement.value;
        case 'badge':
          return trainer.badges.some(badge => badge.id === requirement.value);
        case 'achievement':
          return trainer.achievements.some(achievement => achievement.id === requirement.value);
        default:
          return true;
      }
    });
  }

  private async getHabitatProgress(habitatId: string, trainerId: string): Promise<HabitatProgress> {
    // This would typically fetch from Redis, but for now return default
    return {
      habitatId,
      trainerId,
      explorationCount: 0,
      lastExploration: new Date(),
      animalsDiscovered: [],
      completionPercentage: 0,
      achievements: [],
      specialUnlocks: []
    };
  }

  private async updateHabitatProgress(habitatId: string, trainerId: string, result: ExplorationResult): Promise<void> {
    // This would typically update Redis with the new progress
    // For now, we'll just log the update
    console.log(`Updated habitat progress for ${trainerId} in ${habitatId}:`, result);
  }

  private getCurrentTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) return TimeOfDay.DAWN;
    if (hour >= 8 && hour < 12) return TimeOfDay.MORNING;
    if (hour >= 12 && hour < 17) return TimeOfDay.AFTERNOON;
    if (hour >= 17 && hour < 20) return TimeOfDay.EVENING;
    return TimeOfDay.NIGHT;
  }

  private getCurrentSeason(): Season {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return Season.SPRING;
    if (month >= 5 && month <= 7) return Season.SUMMER;
    if (month >= 8 && month <= 10) return Season.AUTUMN;
    return Season.WINTER;
  }
}

// Weather system for dynamic weather effects
class WeatherSystem {
  private currentWeather: Map<string, WeatherCondition> = new Map();

  constructor() {
    this.initializeWeather();
  }

  private initializeWeather(): void {
    // Initialize random weather for each habitat
    const habitats = ['enchanted_forest', 'crystal_ocean', 'golden_desert', 'frozen_peaks', 'emerald_jungle', 'savanna_plains', 'sky_mountains'];
    
    habitats.forEach(habitatId => {
      this.currentWeather.set(habitatId, this.generateRandomWeather(habitatId));
    });

    // Update weather every hour
    setInterval(() => {
      this.updateWeather();
    }, 3600000); // 1 hour
  }

  private generateRandomWeather(habitatId: string): WeatherCondition {
    const weatherTypes = this.getWeatherTypesForHabitat(habitatId);
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    return {
      type: randomWeather.type,
      intensity: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      duration: Math.random() * 4 + 2, // 2 to 6 hours
      encounterModifier: randomWeather.encounterModifier,
      description: randomWeather.description
    };
  }

  private getWeatherTypesForHabitat(habitatId: string) {
    const baseWeathers = [
      { type: 'clear', encounterModifier: 1.0, description: 'Clear skies' },
      { type: 'cloudy', encounterModifier: 0.9, description: 'Overcast' }
    ];

    if (habitatId.includes('ocean')) {
      return [
        ...baseWeathers,
        { type: 'storm', encounterModifier: 0.6, description: 'Stormy seas' },
        { type: 'fog', encounterModifier: 0.7, description: 'Dense fog' }
      ];
    }

    if (habitatId.includes('desert')) {
      return [
        ...baseWeathers,
        { type: 'sandstorm', encounterModifier: 0.4, description: 'Sandstorm' },
        { type: 'heat_wave', encounterModifier: 0.8, description: 'Extreme heat' }
      ];
    }

    if (habitatId.includes('arctic') || habitatId.includes('frozen')) {
      return [
        ...baseWeathers,
        { type: 'blizzard', encounterModifier: 0.3, description: 'Blizzard' },
        { type: 'aurora', encounterModifier: 1.3, description: 'Northern lights' }
      ];
    }

    return baseWeathers;
  }

  public getCurrentWeather(habitatId: string): WeatherCondition | undefined {
    return this.currentWeather.get(habitatId);
  }

  private updateWeather(): void {
    this.currentWeather.forEach((weather, habitatId) => {
      // 30% chance to change weather each hour
      if (Math.random() < 0.3) {
        this.currentWeather.set(habitatId, this.generateRandomWeather(habitatId));
      }
    });
  }
}

interface WeatherCondition {
  type: string;
  intensity: number;
  duration: number;
  encounterModifier: number;
  description: string;
}