import { HabitatType } from '../types/common.js';
import { Habitat } from '../types/habitat.js';
import { TrainerProfile } from '../types/trainer.js';
import { HabitatExplorationService } from './habitat-exploration.js';

export interface WorldMapRegion {
  id: string;
  name: string;
  description: string;
  coordinates: MapCoordinates;
  habitatIds: string[];
  unlockRequirements: UnlockRequirement[];
  isHidden: boolean;
  discoveryRewards: DiscoveryReward[];
  connections: string[]; // Connected region IDs
  backgroundImage: string;
  ambientSounds: string[];
}

export interface MapCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UnlockRequirement {
  type: 'level' | 'achievement' | 'badge' | 'discovery' | 'quest';
  value: any;
  description: string;
}

export interface DiscoveryReward {
  type: 'currency' | 'item' | 'animal' | 'achievement';
  value: any;
  quantity?: number;
  description: string;
}

export interface DailyExpedition {
  id: string;
  name: string;
  description: string;
  habitatId: string;
  difficulty: number;
  attemptsRemaining: number;
  maxAttempts: number;
  rewards: ExpeditionReward[];
  requirements: string[];
  expiresAt: Date;
  isCompleted: boolean;
}

export interface ExpeditionReward {
  type: string;
  value: any;
  rarity: string;
  description: string;
}

export class WorldMapService {
  private static instance: WorldMapService;
  private regions: Map<string, WorldMapRegion> = new Map();
  private hiddenAreas: Map<string, HiddenArea> = new Map();
  private dailyExpeditions: Map<string, DailyExpedition[]> = new Map();
  private explorationService: HabitatExplorationService;

  private constructor() {
    this.explorationService = HabitatExplorationService.getInstance();
    this.initializeWorldMap();
    this.initializeHiddenAreas();
    this.generateDailyExpeditions();
  }

  public static getInstance(): WorldMapService {
    if (!WorldMapService.instance) {
      WorldMapService.instance = new WorldMapService();
    }
    return WorldMapService.instance;
  }

  private initializeWorldMap(): void {
    const regions: WorldMapRegion[] = [
      {
        id: 'starter_valley',
        name: 'Starter Valley',
        description: 'A peaceful valley where new trainers begin their journey.',
        coordinates: { x: 100, y: 300, width: 150, height: 120 },
        habitatIds: ['enchanted_forest'],
        unlockRequirements: [],
        isHidden: false,
        discoveryRewards: [
          { type: 'currency', value: 'pawCoins', quantity: 50, description: 'Welcome bonus' }
        ],
        connections: ['coastal_waters', 'desert_expanse'],
        backgroundImage: '/images/regions/starter_valley.jpg',
        ambientSounds: ['/audio/ambient/forest_birds.mp3', '/audio/ambient/gentle_stream.mp3']
      },
      {
        id: 'coastal_waters',
        name: 'Coastal Waters',
        description: 'Pristine coastline where land meets the endless ocean.',
        coordinates: { x: 50, y: 150, width: 200, height: 100 },
        habitatIds: ['crystal_ocean'],
        unlockRequirements: [
          { type: 'level', value: 5, description: 'Reach trainer level 5' }
        ],
        isHidden: false,
        discoveryRewards: [
          { type: 'item', value: 'diving_gear', quantity: 1, description: 'Essential for deep ocean exploration' }
        ],
        connections: ['starter_valley', 'frozen_archipelago'],
        backgroundImage: '/images/regions/coastal_waters.jpg',
        ambientSounds: ['/audio/ambient/ocean_waves.mp3', '/audio/ambient/seagulls.mp3']
      },
      {
        id: 'desert_expanse',
        name: 'Desert Expanse',
        description: 'Vast golden dunes stretching to the horizon.',
        coordinates: { x: 300, y: 250, width: 180, height: 140 },
        habitatIds: ['golden_desert'],
        unlockRequirements: [
          { type: 'level', value: 10, description: 'Reach trainer level 10' }
        ],
        isHidden: false,
        discoveryRewards: [
          { type: 'item', value: 'heat_protection', quantity: 1, description: 'Protection from desert heat' }
        ],
        connections: ['starter_valley', 'mountain_range'],
        backgroundImage: '/images/regions/desert_expanse.jpg',
        ambientSounds: ['/audio/ambient/desert_wind.mp3', '/audio/ambient/sand_shifting.mp3']
      },
      {
        id: 'frozen_archipelago',
        name: 'Frozen Archipelago',
        description: 'Ice-covered islands in the far north.',
        coordinates: { x: 80, y: 50, width: 160, height: 80 },
        habitatIds: ['frozen_peaks'],
        unlockRequirements: [
          { type: 'level', value: 15, description: 'Reach trainer level 15' },
          { type: 'badge', value: 'ocean_explorer', description: 'Master the coastal waters' }
        ],
        isHidden: false,
        discoveryRewards: [
          { type: 'item', value: 'cold_weather_gear', quantity: 1, description: 'Essential arctic equipment' }
        ],
        connections: ['coastal_waters', 'hidden_aurora_caves'],
        backgroundImage: '/images/regions/frozen_archipelago.jpg',
        ambientSounds: ['/audio/ambient/arctic_wind.mp3', '/audio/ambient/ice_cracking.mp3']
      },
      {
        id: 'jungle_heart',
        name: 'Heart of the Jungle',
        description: 'Dense rainforest canopy hiding ancient secrets.',
        coordinates: { x: 400, y: 180, width: 140, height: 160 },
        habitatIds: ['emerald_jungle'],
        unlockRequirements: [
          { type: 'level', value: 20, description: 'Reach trainer level 20' },
          { type: 'achievement', value: 'rare_collector', description: 'Capture 10 rare animals' }
        ],
        isHidden: false,
        discoveryRewards: [
          { type: 'animal', value: 'jungle_guide_parrot', quantity: 1, description: 'A helpful jungle companion' }
        ],
        connections: ['mountain_range', 'hidden_temple_ruins'],
        backgroundImage: '/images/regions/jungle_heart.jpg',
        ambientSounds: ['/audio/ambient/jungle_sounds.mp3', '/audio/ambient/exotic_birds.mp3']
      },
      {
        id: 'savanna_kingdom',
        name: 'Savanna Kingdom',
        description: 'Endless grasslands where great herds roam.',
        coordinates: { x: 250, y: 350, width: 200, height: 120 },
        habitatIds: ['savanna_plains'],
        unlockRequirements: [
          { type: 'level', value: 8, description: 'Reach trainer level 8' }
        ],
        isHidden: false,
        discoveryRewards: [
          { type: 'achievement', value: 'savanna_explorer', description: 'First to explore the great plains' }
        ],
        connections: ['desert_expanse', 'mountain_range'],
        backgroundImage: '/images/regions/savanna_kingdom.jpg',
        ambientSounds: ['/audio/ambient/savanna_wind.mp3', '/audio/ambient/distant_roars.mp3']
      },
      {
        id: 'mountain_range',
        name: 'Skyward Peaks',
        description: 'Towering mountains that touch the clouds.',
        coordinates: { x: 350, y: 100, width: 120, height: 180 },
        habitatIds: ['sky_mountains'],
        unlockRequirements: [
          { type: 'level', value: 12, description: 'Reach trainer level 12' }
        ],
        isHidden: false,
        discoveryRewards: [
          { type: 'item', value: 'climbing_gear', quantity: 1, description: 'Equipment for high altitude exploration' }
        ],
        connections: ['desert_expanse', 'jungle_heart', 'savanna_kingdom'],
        backgroundImage: '/images/regions/mountain_range.jpg',
        ambientSounds: ['/audio/ambient/mountain_wind.mp3', '/audio/ambient/eagle_calls.mp3']
      }
    ];

    regions.forEach(region => {
      this.regions.set(region.id, region);
    });
  }

  private initializeHiddenAreas(): void {
    const hiddenAreas: HiddenArea[] = [
      {
        id: 'hidden_aurora_caves',
        name: 'Aurora Caves',
        description: 'Mystical ice caves that glow with ethereal light.',
        parentRegionId: 'frozen_archipelago',
        coordinates: { x: 120, y: 30, width: 60, height: 40 },
        unlockRequirements: [
          { type: 'achievement', value: 'arctic_master', description: 'Master all arctic habitats' },
          { type: 'discovery', value: 'aurora_crystal', description: 'Find the legendary Aurora Crystal' }
        ],
        specialRewards: [
          { type: 'animal', value: 'aurora_fox', rarity: 'legendary', description: 'A fox that glows with northern lights' }
        ],
        isDiscovered: false,
        discoveryDate: null
      },
      {
        id: 'hidden_temple_ruins',
        name: 'Ancient Temple Ruins',
        description: 'Overgrown ruins hiding legendary jungle guardians.',
        parentRegionId: 'jungle_heart',
        coordinates: { x: 450, y: 200, width: 50, height: 60 },
        unlockRequirements: [
          { type: 'achievement', value: 'jungle_archaeologist', description: 'Discover 5 ancient artifacts' },
          { type: 'level', value: 25, description: 'Reach trainer level 25' }
        ],
        specialRewards: [
          { type: 'animal', value: 'temple_guardian', rarity: 'legendary', description: 'Ancient protector of the ruins' }
        ],
        isDiscovered: false,
        discoveryDate: null
      },
      {
        id: 'hidden_crystal_caverns',
        name: 'Crystal Caverns',
        description: 'Underground caves filled with glowing crystals and rare minerals.',
        parentRegionId: 'mountain_range',
        coordinates: { x: 380, y: 150, width: 40, height: 50 },
        unlockRequirements: [
          { type: 'achievement', value: 'deep_explorer', description: 'Explore 100 cave systems' },
          { type: 'item', value: 'crystal_detector', description: 'Special equipment to detect crystal formations' }
        ],
        specialRewards: [
          { type: 'item', value: 'power_crystal', rarity: 'epic', description: 'Enhances animal abilities' }
        ],
        isDiscovered: false,
        discoveryDate: null
      }
    ];

    hiddenAreas.forEach(area => {
      this.hiddenAreas.set(area.id, area);
    });
  }

  private generateDailyExpeditions(): void {
    // Generate daily expeditions for each trainer
    // This would typically be called once per day
    const expeditionTemplates = [
      {
        name: 'Rare Animal Sighting',
        description: 'Reports of a rare animal in the {habitat}. Investigate immediately!',
        difficulty: 3,
        maxAttempts: 2,
        rewardTypes: ['rare_animal', 'experience', 'currency']
      },
      {
        name: 'Weather Phenomenon',
        description: 'Unusual weather patterns are affecting animal behavior in {habitat}.',
        difficulty: 2,
        maxAttempts: 3,
        rewardTypes: ['items', 'experience']
      },
      {
        name: 'Conservation Emergency',
        description: 'Animals in {habitat} need immediate help. Your expertise is required.',
        difficulty: 4,
        maxAttempts: 1,
        rewardTypes: ['achievement', 'rare_items', 'reputation']
      },
      {
        name: 'Research Opportunity',
        description: 'Scientists need data collection from {habitat} for important research.',
        difficulty: 1,
        maxAttempts: 5,
        rewardTypes: ['research_points', 'educational_content']
      }
    ];

    // This would be implemented to generate daily expeditions per trainer
    console.log('Daily expeditions system initialized');
  }

  // Public methods
  public getWorldMap(trainer: TrainerProfile): WorldMapData {
    const availableRegions = Array.from(this.regions.values()).filter(region => 
      this.isRegionUnlocked(region, trainer)
    );

    const discoveredHiddenAreas = Array.from(this.hiddenAreas.values()).filter(area => 
      this.isHiddenAreaDiscovered(area.id, trainer.trainerId)
    );

    return {
      regions: availableRegions,
      hiddenAreas: discoveredHiddenAreas,
      trainerLocation: this.getTrainerLocation(trainer.trainerId),
      weatherConditions: this.getGlobalWeatherConditions(),
      activeEvents: this.getActiveGlobalEvents()
    };
  }

  public getRegion(regionId: string): WorldMapRegion | undefined {
    return this.regions.get(regionId);
  }

  public getDailyExpeditions(trainerId: string): DailyExpedition[] {
    return this.dailyExpeditions.get(trainerId) || [];
  }

  public async startExpedition(expeditionId: string, trainerId: string): Promise<ExpeditionResult> {
    const expeditions = this.dailyExpeditions.get(trainerId) || [];
    const expedition = expeditions.find(exp => exp.id === expeditionId);

    if (!expedition) {
      throw new Error('Expedition not found');
    }

    if (expedition.attemptsRemaining <= 0) {
      throw new Error('No attempts remaining for this expedition');
    }

    if (expedition.isCompleted) {
      throw new Error('Expedition already completed');
    }

    // Simulate expedition outcome
    const success = Math.random() < (1 - expedition.difficulty * 0.2);
    expedition.attemptsRemaining--;

    if (success) {
      expedition.isCompleted = true;
      return {
        success: true,
        rewards: expedition.rewards,
        message: `Successfully completed ${expedition.name}!`,
        experienceGained: expedition.difficulty * 25
      };
    } else {
      return {
        success: false,
        rewards: [],
        message: `Failed to complete ${expedition.name}. ${expedition.attemptsRemaining} attempts remaining.`,
        experienceGained: expedition.difficulty * 5
      };
    }
  }

  public async discoverHiddenArea(areaId: string, trainerId: string): Promise<DiscoveryResult> {
    const area = this.hiddenAreas.get(areaId);
    if (!area) {
      throw new Error('Hidden area not found');
    }

    // Check if already discovered
    if (this.isHiddenAreaDiscovered(areaId, trainerId)) {
      throw new Error('Area already discovered');
    }

    // Check unlock requirements (this would be more complex in real implementation)
    const canDiscover = true; // Simplified for now

    if (canDiscover) {
      // Mark as discovered
      area.isDiscovered = true;
      area.discoveryDate = new Date();

      return {
        success: true,
        area: area,
        rewards: area.specialRewards,
        message: `Discovered the hidden ${area.name}!`
      };
    } else {
      return {
        success: false,
        area: null,
        rewards: [],
        message: 'Requirements not met to discover this area.'
      };
    }
  }

  // Private helper methods
  private isRegionUnlocked(region: WorldMapRegion, trainer: TrainerProfile): boolean {
    return region.unlockRequirements.every(requirement => {
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

  private isHiddenAreaDiscovered(areaId: string, trainerId: string): boolean {
    // This would check Redis or database for discovery status
    const area = this.hiddenAreas.get(areaId);
    return area?.isDiscovered || false;
  }

  private getTrainerLocation(trainerId: string): MapCoordinates {
    // This would fetch from Redis/database
    return { x: 175, y: 360, width: 10, height: 10 }; // Default to starter valley
  }

  private getGlobalWeatherConditions(): WeatherCondition[] {
    // Return current weather for all regions
    return [
      { regionId: 'coastal_waters', weather: 'stormy', intensity: 0.7 },
      { regionId: 'desert_expanse', weather: 'clear', intensity: 1.0 },
      { regionId: 'frozen_archipelago', weather: 'blizzard', intensity: 0.4 }
    ];
  }

  private getActiveGlobalEvents(): GlobalEvent[] {
    return [
      {
        id: 'migration_season',
        name: 'Great Migration',
        description: 'Animals are migrating between regions, increasing encounter rates!',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        effects: [
          { type: 'encounter_rate_boost', value: 1.5, regions: ['savanna_kingdom', 'coastal_waters'] }
        ]
      }
    ];
  }
}

// Supporting interfaces
interface HiddenArea {
  id: string;
  name: string;
  description: string;
  parentRegionId: string;
  coordinates: MapCoordinates;
  unlockRequirements: UnlockRequirement[];
  specialRewards: SpecialReward[];
  isDiscovered: boolean;
  discoveryDate: Date | null;
}

interface SpecialReward {
  type: string;
  value: string;
  rarity: string;
  description: string;
}

interface WorldMapData {
  regions: WorldMapRegion[];
  hiddenAreas: HiddenArea[];
  trainerLocation: MapCoordinates;
  weatherConditions: WeatherCondition[];
  activeEvents: GlobalEvent[];
}

interface WeatherCondition {
  regionId: string;
  weather: string;
  intensity: number;
}

interface GlobalEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  effects: EventEffect[];
}

interface EventEffect {
  type: string;
  value: number;
  regions: string[];
}

interface ExpeditionResult {
  success: boolean;
  rewards: ExpeditionReward[];
  message: string;
  experienceGained: number;
}

interface DiscoveryResult {
  success: boolean;
  area: HiddenArea | null;
  rewards: SpecialReward[];
  message: string;
}