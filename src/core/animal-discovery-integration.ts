import { HabitatExplorer, BiomeRegion, ExplorationSession } from './habitat-explorer.js';
import { DiscoverySystem, DiscoveryResult, CaptureAttempt, CaptureResult } from './discovery-system.js';
import { CollectionManager, CollectionStats, AnimalWithMetadata } from './collection-manager.js';
import { ShinySystem, ShinyEffectType } from './shiny-system.js';
import { EvolutionSystem, EvolutionResult } from './evolution-system.js';
import { AnimalStorage } from '../storage/animal-storage.js';
import { HabitatType, Rarity } from '../types/common.js';
import { Animal, AnimalSpecies } from '../types/animal.js';

/**
 * Main integration class that coordinates animal discovery, capture, and collection management
 */
export class AnimalDiscoveryIntegration {
  private animalStorage: AnimalStorage;
  private collectionManager: CollectionManager;

  constructor(animalStorage: AnimalStorage) {
    this.animalStorage = animalStorage;
    this.collectionManager = new CollectionManager(animalStorage);
  }

  /**
   * Get available exploration regions for a trainer
   */
  async getAvailableRegions(trainerId: string, trainerLevel: number): Promise<{
    unlocked: BiomeRegion[];
    locked: BiomeRegion[];
    dailyLimits: Record<string, { used: number; max: number }>;
  }> {
    const allRegions = HabitatExplorer.getAllRegions();
    const unlockedRegions = HabitatExplorer.getUnlockedRegions(trainerLevel);
    const lockedRegions = allRegions.filter(region => region.unlockLevel > trainerLevel);
    const dailyLimits = HabitatExplorer.getDailyLimits(trainerId);

    return {
      unlocked: unlockedRegions,
      locked: lockedRegions,
      dailyLimits
    };
  }

  /**
   * Start exploration in a specific region
   */
  async startExploration(
    regionId: string,
    trainerId: string,
    trainerLevel: number
  ): Promise<{
    success: boolean;
    session?: ExplorationSession;
    error?: string;
  }> {
    const session = HabitatExplorer.startExploration(regionId, trainerId, trainerLevel);
    
    if (!session) {
      return {
        success: false,
        error: 'Unable to start exploration. Check region availability and trainer level.'
      };
    }

    return {
      success: true,
      session
    };
  }

  /**
   * Perform animal discovery during exploration
   */
  async discoverAnimal(
    sessionKey: string,
    hasShinyCharm: boolean = false
  ): Promise<{
    success: boolean;
    discovery?: DiscoveryResult;
    error?: string;
  }> {
    const discovery = HabitatExplorer.explore(sessionKey, hasShinyCharm);
    
    if (!discovery) {
      return {
        success: false,
        error: 'No more explorations available or invalid session.'
      };
    }

    return {
      success: true,
      discovery
    };
  }

  /**
   * Attempt to capture a discovered animal
   */
  async attemptCapture(
    trainerId: string,
    discovery: DiscoveryResult,
    attempt: CaptureAttempt
  ): Promise<{
    success: boolean;
    result?: CaptureResult;
    error?: string;
  }> {
    if (!discovery.success || !discovery.animal || !discovery.puzzle) {
      return {
        success: false,
        error: 'Invalid discovery data for capture attempt.'
      };
    }

    const captureResult = DiscoverySystem.attemptCapture(
      discovery.animal,
      discovery.puzzle,
      attempt,
      trainerId,
      discovery.shiny
    );

    // If capture was successful, save the animal to storage
    if (captureResult.success && captureResult.animal) {
      const saved = await this.animalStorage.addAnimalToTrainer(trainerId, captureResult.animal);
      if (!saved) {
        return {
          success: false,
          error: 'Failed to save captured animal to collection.'
        };
      }
    }

    return {
      success: true,
      result: captureResult
    };
  }

  /**
   * Get trainer's complete collection with management features
   */
  async getTrainerCollection(trainerId: string): Promise<{
    animals: AnimalWithMetadata[];
    stats: CollectionStats;
    completionData: {
      habitatCompletion: Record<HabitatType, { caught: number; total: number; percentage: number }>;
      rarityCompletion: Record<Rarity, { caught: number; total: number; percentage: number }>;
    };
  }> {
    const animals = await this.collectionManager.getCollection(trainerId);
    const stats = await this.collectionManager.getCollectionStats(trainerId);
    const habitatCompletion = await this.collectionManager.getHabitatCompletion(trainerId);
    const rarityCompletion = await this.collectionManager.getRarityCompletion(trainerId);

    return {
      animals,
      stats,
      completionData: {
        habitatCompletion,
        rarityCompletion
      }
    };
  }

  /**
   * Manage animal favorites
   */
  async toggleFavorite(trainerId: string, animalId: string, isFavorite: boolean): Promise<boolean> {
    if (isFavorite) {
      return await this.collectionManager.addToFavorites(trainerId, animalId);
    } else {
      return await this.collectionManager.removeFromFavorites(trainerId, animalId);
    }
  }

  /**
   * Set animal nickname
   */
  async setAnimalNickname(trainerId: string, animalId: string, nickname: string): Promise<boolean> {
    return await this.collectionManager.setNickname(trainerId, animalId, nickname);
  }

  /**
   * Add tags to animal
   */
  async addAnimalTags(trainerId: string, animalId: string, tags: string[]): Promise<boolean> {
    return await this.collectionManager.addTags(trainerId, animalId, tags);
  }

  /**
   * Check if animal can evolve and get evolution info
   */
  async checkEvolution(animalId: string): Promise<{
    canEvolve: boolean;
    evolutionPreview?: AnimalSpecies;
    requirements: string[];
    missingRequirements: string[];
  }> {
    const animal = await this.animalStorage.getAnimal(animalId);
    if (!animal) {
      return {
        canEvolve: false,
        requirements: [],
        missingRequirements: ['Animal not found']
      };
    }

    const canEvolve = EvolutionSystem.canEvolve(animal);
    const evolutionPreview = EvolutionSystem.getEvolutionPreview(animal);
    const requirements = EvolutionSystem.getEvolutionRequirementsText(animal);
    const missingRequirements = EvolutionSystem.getMissingRequirements(animal);

    return {
      canEvolve,
      evolutionPreview: evolutionPreview || undefined,
      requirements,
      missingRequirements
    };
  }

  /**
   * Attempt to evolve an animal
   */
  async evolveAnimal(animalId: string): Promise<{
    success: boolean;
    result?: EvolutionResult;
    error?: string;
  }> {
    const animal = await this.animalStorage.getAnimal(animalId);
    if (!animal) {
      return {
        success: false,
        error: 'Animal not found'
      };
    }

    const evolutionResult = EvolutionSystem.evolveAnimal(animal);
    
    if (evolutionResult.success && evolutionResult.evolvedAnimal) {
      // Save the evolved animal and remove the original
      const saved = await this.animalStorage.saveAnimal(evolutionResult.evolvedAnimal);
      if (saved) {
        await this.animalStorage.removeAnimalFromTrainer(animal.trainerId, animal.id);
      } else {
        return {
          success: false,
          error: 'Failed to save evolved animal'
        };
      }
    }

    return {
      success: evolutionResult.success,
      result: evolutionResult,
      error: evolutionResult.error
    };
  }

  /**
   * Get shiny hunting information
   */
  getShinyHuntingInfo(hasShinyCharm: boolean = false, speciesMasteryLevel: number = 0): {
    currentRate: string;
    tips: string[];
    achievements: Array<{ name: string; description: string; reward: string }>;
  } {
    const currentRate = ShinySystem.calculateShinyRate(hasShinyCharm, speciesMasteryLevel);
    const tips = ShinySystem.getShinyHuntingTips();
    
    const achievements = [
      {
        name: 'Shiny Hunter',
        description: 'Catch your first shiny animal',
        reward: 'Shiny Hunter Badge'
      },
      {
        name: 'Shiny Collector',
        description: 'Catch 10 different shiny animals',
        reward: 'Increased shiny encounter rate'
      },
      {
        name: 'Shiny Master',
        description: 'Catch 50 different shiny animals',
        reward: 'Shiny Master Title'
      }
    ];

    return {
      currentRate,
      tips,
      achievements
    };
  }

  /**
   * Get current weather and special events
   */
  getCurrentEvents(): {
    weatherEvents: Array<{
      regionId: string;
      regionName: string;
      weather: string;
      description: string;
      bonuses: string[];
    }>;
    specialEvents: Array<{
      regionId: string;
      eventName: string;
      description: string;
      bonuses: string[];
      duration: string;
    }>;
  } {
    const regions = HabitatExplorer.getAllRegions();
    const weatherEvents = regions.map(region => {
      const weather = HabitatExplorer.getCurrentWeather(region.id);
      return {
        regionId: region.id,
        regionName: region.name,
        weather: weather?.name || 'Clear',
        description: weather?.description || 'Normal weather conditions',
        bonuses: weather ? [
          `${Math.round((weather.effects.encounterRateMultiplier - 1) * 100)}% encounter rate`,
          `+${Math.round(weather.effects.rarityBonus * 100)}% rare animal chance`,
          `+${Math.round(weather.effects.shinyBonus * 100)}% shiny chance`
        ] : []
      };
    }).filter(event => event.weather !== 'Clear');

    const specialEvents = HabitatExplorer.getSpecialEvents();

    return {
      weatherEvents,
      specialEvents
    };
  }

  /**
   * Export trainer's collection data
   */
  async exportCollection(trainerId: string): Promise<string> {
    return await this.collectionManager.exportCollection(trainerId);
  }

  /**
   * Get discovery statistics for achievements and progress tracking
   */
  async getDiscoveryStatistics(trainerId: string): Promise<{
    totalAnimalsDiscovered: number;
    uniqueSpeciesCount: number;
    shinyAnimalsFound: number;
    legendaryAnimalsFound: number;
    regionsExplored: number;
    totalExplorations: number;
    evolutionsPerformed: number;
    completionPercentage: number;
    achievements: string[];
  }> {
    const collection = await this.collectionManager.getCollection(trainerId);
    const stats = await this.collectionManager.getCollectionStats(trainerId);
    const explorationStats = HabitatExplorer.getExplorationStats(trainerId);

    const legendaryCount = collection.filter(animal => animal.rarity === Rarity.LEGENDARY).length;
    const evolutionsPerformed = collection.filter(animal => animal.evolutionStage > 1).length;

    // Calculate achievements (simplified)
    const achievements: string[] = [];
    if (stats.totalAnimals >= 1) achievements.push('First Capture');
    if (stats.shinyCount >= 1) achievements.push('Shiny Hunter');
    if (stats.totalAnimals >= 50) achievements.push('Animal Collector');
    if (legendaryCount >= 1) achievements.push('Legendary Trainer');
    if (stats.completionPercentage >= 25) achievements.push('Quarter Master');
    if (stats.completionPercentage >= 50) achievements.push('Half Way There');
    if (stats.completionPercentage >= 75) achievements.push('Almost Complete');
    if (stats.completionPercentage >= 100) achievements.push('Pokédex Master');

    return {
      totalAnimalsDiscovered: stats.totalAnimals,
      uniqueSpeciesCount: stats.uniqueSpecies,
      shinyAnimalsFound: stats.shinyCount,
      legendaryAnimalsFound: legendaryCount,
      regionsExplored: explorationStats.regionsExplored,
      totalExplorations: explorationStats.totalExplorations,
      evolutionsPerformed,
      completionPercentage: stats.completionPercentage,
      achievements
    };
  }
}