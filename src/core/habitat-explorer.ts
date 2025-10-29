import { HabitatType, Rarity } from '../types/common.js';
import { Habitat, ExplorationResult, AnimalEncounter, WeatherEffect } from '../types/habitat.js';
import { DiscoverySystem, DiscoveryResult } from './discovery-system.js';
import { animalDatabase } from '../data/animal-database-manager.js';

export interface BiomeRegion {
  id: string;
  name: string;
  description: string;
  habitat: HabitatType;
  unlockLevel: number;
  explorationCost: number;
  maxDailyExplorations: number;
  weatherEffects: WeatherEffect[];
  specialFeatures: string[];
  backgroundImage?: string;
  ambientSounds?: string[];
}

export interface ExplorationSession {
  regionId: string;
  trainerId: string;
  startTime: Date;
  explorationsRemaining: number;
  weatherBonus: number;
  timeOfDayBonus: number;
  discoveries: DiscoveryResult[];
  totalExperience: number;
}

export interface WeatherCondition {
  type: string;
  name: string;
  description: string;
  effects: {
    encounterRateMultiplier: number;
    rarityBonus: number;
    shinyBonus: number;
    affectedHabitats: HabitatType[];
  };
  duration: number; // in minutes
}

export class HabitatExplorer {
  private static readonly BIOME_REGIONS: BiomeRegion[] = [
    {
      id: 'temperate_forest',
      name: 'Temperate Forest',
      description: 'A lush woodland filled with diverse wildlife and towering trees.',
      habitat: HabitatType.FOREST,
      unlockLevel: 1,
      explorationCost: 1,
      maxDailyExplorations: 5,
      weatherEffects: [
        { type: 'rain', multiplier: 1.2, description: 'Rain brings out more forest creatures' },
        { type: 'fog', multiplier: 0.8, description: 'Fog makes animals harder to spot' }
      ],
      specialFeatures: ['Ancient Oak Grove', 'Hidden Waterfall', 'Mushroom Circles'],
      backgroundImage: 'forest_bg.jpg',
      ambientSounds: ['birds_chirping.mp3', 'wind_through_trees.mp3']
    },
    {
      id: 'coral_reef',
      name: 'Coral Reef',
      description: 'A vibrant underwater ecosystem teeming with colorful marine life.',
      habitat: HabitatType.OCEAN,
      unlockLevel: 5,
      explorationCost: 2,
      maxDailyExplorations: 4,
      weatherEffects: [
        { type: 'clear_water', multiplier: 1.3, description: 'Crystal clear water improves visibility' },
        { type: 'storm', multiplier: 0.6, description: 'Rough seas make exploration dangerous' }
      ],
      specialFeatures: ['Coral Gardens', 'Deep Blue Trench', 'Shipwreck Site'],
      backgroundImage: 'coral_reef_bg.jpg',
      ambientSounds: ['underwater_ambience.mp3', 'whale_songs.mp3']
    },
    {
      id: 'sahara_desert',
      name: 'Sahara Desert',
      description: 'Vast sand dunes hide resilient creatures adapted to extreme heat.',
      habitat: HabitatType.DESERT,
      unlockLevel: 8,
      explorationCost: 3,
      maxDailyExplorations: 3,
      weatherEffects: [
        { type: 'sandstorm', multiplier: 0.5, description: 'Sandstorms make exploration treacherous' },
        { type: 'cool_night', multiplier: 1.4, description: 'Cool nights bring out nocturnal animals' }
      ],
      specialFeatures: ['Oasis Springs', 'Ancient Ruins', 'Salt Flats'],
      backgroundImage: 'desert_bg.jpg',
      ambientSounds: ['desert_wind.mp3', 'distant_thunder.mp3']
    },
    {
      id: 'arctic_tundra',
      name: 'Arctic Tundra',
      description: 'A frozen wilderness where only the hardiest animals survive.',
      habitat: HabitatType.ARCTIC,
      unlockLevel: 12,
      explorationCost: 4,
      maxDailyExplorations: 2,
      weatherEffects: [
        { type: 'blizzard', multiplier: 0.3, description: 'Blizzards make exploration nearly impossible' },
        { type: 'aurora', multiplier: 1.8, description: 'Northern lights attract rare animals' }
      ],
      specialFeatures: ['Glacier Caves', 'Frozen Lakes', 'Ice Formations'],
      backgroundImage: 'arctic_bg.jpg',
      ambientSounds: ['howling_wind.mp3', 'ice_cracking.mp3']
    },
    {
      id: 'african_savanna',
      name: 'African Savanna',
      description: 'Endless grasslands where the great migration takes place.',
      habitat: HabitatType.GRASSLAND,
      unlockLevel: 6,
      explorationCost: 2,
      maxDailyExplorations: 4,
      weatherEffects: [
        { type: 'dry_season', multiplier: 1.1, description: 'Animals gather at water sources' },
        { type: 'wet_season', multiplier: 1.3, description: 'Abundant life during the rains' }
      ],
      specialFeatures: ['Acacia Groves', 'Watering Holes', 'Rocky Outcrops'],
      backgroundImage: 'savanna_bg.jpg',
      ambientSounds: ['savanna_ambience.mp3', 'lion_roars.mp3']
    },
    {
      id: 'rocky_mountains',
      name: 'Rocky Mountains',
      description: 'Towering peaks where altitude and weather create unique challenges.',
      habitat: HabitatType.MOUNTAIN,
      unlockLevel: 10,
      explorationCost: 3,
      maxDailyExplorations: 3,
      weatherEffects: [
        { type: 'thin_air', multiplier: 0.9, description: 'High altitude affects exploration' },
        { type: 'clear_skies', multiplier: 1.2, description: 'Clear weather improves visibility' }
      ],
      specialFeatures: ['Alpine Lakes', 'Rocky Cliffs', 'Hidden Valleys'],
      backgroundImage: 'mountain_bg.jpg',
      ambientSounds: ['mountain_wind.mp3', 'eagle_calls.mp3']
    },
    {
      id: 'everglades',
      name: 'Everglades',
      description: 'A unique wetland ecosystem with diverse aquatic and terrestrial life.',
      habitat: HabitatType.WETLAND,
      unlockLevel: 7,
      explorationCost: 2,
      maxDailyExplorations: 4,
      weatherEffects: [
        { type: 'high_tide', multiplier: 1.2, description: 'High tide brings marine visitors' },
        { type: 'drought', multiplier: 0.8, description: 'Low water levels concentrate animals' }
      ],
      specialFeatures: ['Mangrove Tunnels', 'Cypress Domes', 'Alligator Holes'],
      backgroundImage: 'wetland_bg.jpg',
      ambientSounds: ['swamp_ambience.mp3', 'frog_chorus.mp3']
    },
    {
      id: 'limestone_caves',
      name: 'Limestone Caves',
      description: 'Dark underground chambers home to unique cave-dwelling species.',
      habitat: HabitatType.CAVE,
      unlockLevel: 15,
      explorationCost: 4,
      maxDailyExplorations: 2,
      weatherEffects: [
        { type: 'stable_temperature', multiplier: 1.0, description: 'Constant cave conditions' },
        { type: 'flooding', multiplier: 0.4, description: 'Flooded passages limit access' }
      ],
      specialFeatures: ['Crystal Formations', 'Underground Rivers', 'Bat Colonies'],
      backgroundImage: 'cave_bg.jpg',
      ambientSounds: ['cave_drips.mp3', 'bat_echoes.mp3']
    }
  ];

  private static currentWeather: Map<string, WeatherCondition> = new Map();
  private static explorationSessions: Map<string, ExplorationSession> = new Map();

  /**
   * Get all available biome regions
   */
  public static getAllRegions(): BiomeRegion[] {
    return [...this.BIOME_REGIONS];
  }

  /**
   * Get regions unlocked for a trainer
   */
  public static getUnlockedRegions(trainerLevel: number): BiomeRegion[] {
    return this.BIOME_REGIONS.filter(region => region.unlockLevel <= trainerLevel);
  }

  /**
   * Get a specific region by ID
   */
  public static getRegion(regionId: string): BiomeRegion | undefined {
    return this.BIOME_REGIONS.find(region => region.id === regionId);
  }

  /**
   * Start an exploration session
   */
  public static startExploration(
    regionId: string,
    trainerId: string,
    trainerLevel: number
  ): ExplorationSession | null {
    const region = this.getRegion(regionId);
    if (!region) {
      return null;
    }

    // Check if trainer level is sufficient
    if (trainerLevel < region.unlockLevel) {
      return null;
    }

    // Get current weather effects
    const weather = this.getCurrentWeather(regionId);
    const weatherBonus = weather?.effects.encounterRateMultiplier || 1.0;
    
    // Calculate time of day bonus
    const timeOfDayBonus = this.getTimeOfDayBonus();

    const session: ExplorationSession = {
      regionId,
      trainerId,
      startTime: new Date(),
      explorationsRemaining: region.maxDailyExplorations,
      weatherBonus,
      timeOfDayBonus,
      discoveries: [],
      totalExperience: 0
    };

    this.explorationSessions.set(`${trainerId}_${regionId}`, session);
    return session;
  }

  /**
   * Perform a single exploration in a region
   */
  public static explore(
    sessionKey: string,
    hasShinyCharm: boolean = false
  ): DiscoveryResult | null {
    const session = this.explorationSessions.get(sessionKey);
    if (!session || session.explorationsRemaining <= 0) {
      return null;
    }

    const region = this.getRegion(session.regionId);
    if (!region) {
      return null;
    }

    // Get trainer level (would normally come from trainer data)
    const trainerLevel = 10; // Placeholder

    // Perform discovery
    const discovery = DiscoverySystem.discoverAnimal(
      region.habitat,
      trainerLevel,
      hasShinyCharm,
      session.weatherBonus,
      session.timeOfDayBonus
    );

    // Update session
    session.explorationsRemaining--;
    session.discoveries.push(discovery);
    
    if (discovery.success && discovery.animal) {
      session.totalExperience += discovery.animal.baseStats.health;
    }

    return discovery;
  }

  /**
   * Get current weather for a region
   */
  public static getCurrentWeather(regionId: string): WeatherCondition | undefined {
    return this.currentWeather.get(regionId);
  }

  /**
   * Set weather for a region
   */
  public static setWeather(regionId: string, weather: WeatherCondition): void {
    this.currentWeather.set(regionId, weather);
    
    // Auto-clear weather after duration
    setTimeout(() => {
      this.currentWeather.delete(regionId);
    }, weather.duration * 60 * 1000);
  }

  /**
   * Generate random weather event
   */
  public static generateRandomWeather(regionId: string): WeatherCondition | null {
    const region = this.getRegion(regionId);
    if (!region) {
      return null;
    }

    const weatherTypes = this.getWeatherTypesForHabitat(region.habitat);
    if (weatherTypes.length === 0) {
      return null;
    }

    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    this.setWeather(regionId, randomWeather);
    
    return randomWeather;
  }

  /**
   * Get exploration statistics for a trainer
   */
  public static getExplorationStats(trainerId: string): {
    totalExplorations: number;
    regionsExplored: number;
    animalsDiscovered: number;
    shinyAnimalsFound: number;
    favoriteRegion?: string;
  } {
    // This would typically come from persistent storage
    // Placeholder implementation
    return {
      totalExplorations: 0,
      regionsExplored: 0,
      animalsDiscovered: 0,
      shinyAnimalsFound: 0
    };
  }

  /**
   * Get daily exploration limits for a trainer
   */
  public static getDailyLimits(trainerId: string): Record<string, { used: number; max: number }> {
    const limits: Record<string, { used: number; max: number }> = {};
    
    this.BIOME_REGIONS.forEach(region => {
      const session = this.explorationSessions.get(`${trainerId}_${region.id}`);
      const used = session ? (region.maxDailyExplorations - session.explorationsRemaining) : 0;
      
      limits[region.id] = {
        used,
        max: region.maxDailyExplorations
      };
    });
    
    return limits;
  }

  /**
   * Get special events for regions
   */
  public static getSpecialEvents(): Array<{
    regionId: string;
    eventName: string;
    description: string;
    bonuses: string[];
    duration: string;
  }> {
    // Placeholder for special events system
    return [
      {
        regionId: 'coral_reef',
        eventName: 'Coral Spawning Season',
        description: 'Increased marine life activity during coral spawning.',
        bonuses: ['2x encounter rate', '+50% shiny chance'],
        duration: '3 days remaining'
      },
      {
        regionId: 'arctic_tundra',
        eventName: 'Aurora Borealis',
        description: 'The northern lights attract rare arctic animals.',
        bonuses: ['Legendary encounter rate +200%', 'Unique aurora variants'],
        duration: '12 hours remaining'
      }
    ];
  }

  // Private helper methods
  private static getTimeOfDayBonus(): number {
    const hour = new Date().getHours();
    
    // Dawn and dusk have higher encounter rates
    if ((hour >= 5 && hour <= 7) || (hour >= 18 && hour <= 20)) {
      return 1.3;
    }
    
    // Night has different animals
    if (hour >= 22 || hour <= 4) {
      return 1.1;
    }
    
    // Day is normal
    return 1.0;
  }

  private static getWeatherTypesForHabitat(habitat: HabitatType): WeatherCondition[] {
    const weatherTypes: Record<HabitatType, WeatherCondition[]> = {
      [HabitatType.FOREST]: [
        {
          type: 'rain',
          name: 'Forest Rain',
          description: 'Gentle rain brings forest creatures out to drink.',
          effects: {
            encounterRateMultiplier: 1.2,
            rarityBonus: 0.1,
            shinyBonus: 0.05,
            affectedHabitats: [HabitatType.FOREST]
          },
          duration: 120
        },
        {
          type: 'fog',
          name: 'Morning Fog',
          description: 'Thick fog makes animals harder to spot but some prefer it.',
          effects: {
            encounterRateMultiplier: 0.8,
            rarityBonus: 0.2,
            shinyBonus: 0.1,
            affectedHabitats: [HabitatType.FOREST]
          },
          duration: 90
        }
      ],
      [HabitatType.OCEAN]: [
        {
          type: 'clear_water',
          name: 'Crystal Clear Waters',
          description: 'Perfect visibility underwater reveals hidden marine life.',
          effects: {
            encounterRateMultiplier: 1.3,
            rarityBonus: 0.15,
            shinyBonus: 0.08,
            affectedHabitats: [HabitatType.OCEAN]
          },
          duration: 180
        }
      ],
      [HabitatType.DESERT]: [
        {
          type: 'cool_night',
          name: 'Cool Desert Night',
          description: 'Cooler temperatures bring out nocturnal desert dwellers.',
          effects: {
            encounterRateMultiplier: 1.4,
            rarityBonus: 0.2,
            shinyBonus: 0.1,
            affectedHabitats: [HabitatType.DESERT]
          },
          duration: 240
        }
      ],
      [HabitatType.ARCTIC]: [
        {
          type: 'aurora',
          name: 'Aurora Borealis',
          description: 'The northern lights create a magical atmosphere.',
          effects: {
            encounterRateMultiplier: 1.8,
            rarityBonus: 0.5,
            shinyBonus: 0.3,
            affectedHabitats: [HabitatType.ARCTIC]
          },
          duration: 60
        }
      ],
      [HabitatType.GRASSLAND]: [
        {
          type: 'migration',
          name: 'Great Migration',
          description: 'Animals are on the move across the grasslands.',
          effects: {
            encounterRateMultiplier: 1.5,
            rarityBonus: 0.3,
            shinyBonus: 0.15,
            affectedHabitats: [HabitatType.GRASSLAND]
          },
          duration: 300
        }
      ],
      [HabitatType.MOUNTAIN]: [
        {
          type: 'clear_skies',
          name: 'Clear Mountain Skies',
          description: 'Perfect weather for mountain exploration.',
          effects: {
            encounterRateMultiplier: 1.2,
            rarityBonus: 0.1,
            shinyBonus: 0.05,
            affectedHabitats: [HabitatType.MOUNTAIN]
          },
          duration: 150
        }
      ],
      [HabitatType.WETLAND]: [
        {
          type: 'high_tide',
          name: 'High Tide',
          description: 'Rising waters bring marine visitors to the wetlands.',
          effects: {
            encounterRateMultiplier: 1.2,
            rarityBonus: 0.15,
            shinyBonus: 0.08,
            affectedHabitats: [HabitatType.WETLAND]
          },
          duration: 120
        }
      ],
      [HabitatType.CAVE]: [
        {
          type: 'stable_temperature',
          name: 'Perfect Cave Conditions',
          description: 'Ideal temperature and humidity in the caves.',
          effects: {
            encounterRateMultiplier: 1.0,
            rarityBonus: 0.05,
            shinyBonus: 0.02,
            affectedHabitats: [HabitatType.CAVE]
          },
          duration: 360
        }
      ]
    };

    return weatherTypes[habitat] || [];
  }
}