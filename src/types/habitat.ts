import { HabitatType, Rarity, Requirement, WeatherEffect, Event } from './common.js';

export interface Habitat {
  id: string;
  name: string;
  type: HabitatType;
  description: string;
  availableAnimals: AnimalEncounter[];
  unlockRequirements: Requirement[];
  weatherEffects: WeatherEffect[];
  specialEvents: Event[];
  explorationCost: number;
  maxDailyExplorations: number;
  discoveryBonus: number;
  imageUrl?: string;
  backgroundMusic?: string;
}

export interface AnimalEncounter {
  speciesId: string;
  encounterRate: number;
  minLevel: number;
  maxLevel: number;
  rarity: Rarity;
  shinyChance: number;
  timeOfDay?: TimeOfDay[];
  weatherRequirement?: string;
  seasonRequirement?: Season[];
  specialConditions?: EncounterCondition[];
}

export enum TimeOfDay {
  DAWN = 'dawn',
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

export interface EncounterCondition {
  type: string;
  value: any;
  description: string;
}

export interface ExplorationResult {
  success: boolean;
  animalsEncountered: EncounteredAnimal[];
  itemsFound: string[];
  experienceGained: number;
  discoveryMade?: Discovery;
  puzzleRequired?: ExplorationPuzzle;
}

export interface EncounteredAnimal {
  speciesId: string;
  level: number;
  shiny: boolean;
  rarity: Rarity;
  captureAttempted: boolean;
  captureSuccess?: boolean;
  puzzleDifficulty: number;
}

export interface Discovery {
  type: string;
  name: string;
  description: string;
  rewards: string[];
  rarity: Rarity;
}

export interface ExplorationPuzzle {
  type: string;
  difficulty: number;
  timeLimit: number;
  hints: string[];
  solution: string;
  rewards: PuzzleReward[];
}

export interface PuzzleReward {
  type: string;
  value: any;
  description: string;
}

export interface HabitatProgress {
  habitatId: string;
  trainerId: string;
  explorationCount: number;
  lastExploration: Date;
  animalsDiscovered: string[];
  completionPercentage: number;
  achievements: string[];
  specialUnlocks: string[];
}

export interface ConservationMission {
  id: string;
  name: string;
  description: string;
  habitatId: string;
  objectives: MissionObjective[];
  rewards: MissionReward[];
  difficulty: number;
  duration: number;
  prerequisites: string[];
  educationalContent: EducationalContent;
}

export interface MissionObjective {
  id: string;
  description: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface MissionReward {
  type: string;
  value: any;
  description: string;
}

export interface EducationalContent {
  facts: string[];
  conservationInfo: string;
  partnerOrganization?: string;
  donationLink?: string;
  researchPapers?: string[];
}

// Habitat exploration functions
export function calculateEncounterChance(
  encounter: AnimalEncounter,
  trainerLevel: number,
  currentWeather?: string,
  timeOfDay?: TimeOfDay,
  season?: Season
): number {
  let chance = encounter.encounterRate;
  
  // Weather modifier
  if (encounter.weatherRequirement && currentWeather !== encounter.weatherRequirement) {
    chance *= 0.5;
  }
  
  // Time of day modifier
  if (encounter.timeOfDay && timeOfDay && !encounter.timeOfDay.includes(timeOfDay)) {
    chance *= 0.3;
  }
  
  // Season modifier
  if (encounter.seasonRequirement && season && !encounter.seasonRequirement.includes(season)) {
    chance *= 0.4;
  }
  
  // Trainer level bonus
  if (trainerLevel > 10) {
    chance *= 1 + (trainerLevel - 10) * 0.02;
  }
  
  return Math.min(1, Math.max(0, chance));
}

export function generateExplorationResult(
  habitat: Habitat,
  trainerLevel: number,
  explorationBonus: number = 1
): ExplorationResult {
  const result: ExplorationResult = {
    success: true,
    animalsEncountered: [],
    itemsFound: [],
    experienceGained: Math.floor(Math.random() * 50 + 25) * explorationBonus
  };
  
  // Generate animal encounters
  for (const encounter of habitat.availableAnimals) {
    const chance = calculateEncounterChance(encounter, trainerLevel);
    if (Math.random() < chance) {
      const level = Math.floor(Math.random() * (encounter.maxLevel - encounter.minLevel + 1)) + encounter.minLevel;
      const shiny = Math.random() < encounter.shinyChance;
      
      result.animalsEncountered.push({
        speciesId: encounter.speciesId,
        level,
        shiny,
        rarity: encounter.rarity,
        captureAttempted: false,
        puzzleDifficulty: Math.min(5, Math.max(1, level / 10))
      });
    }
  }
  
  // Limit encounters to prevent overwhelming
  result.animalsEncountered = result.animalsEncountered.slice(0, 3);
  
  return result;
}

export function validateHabitat(habitat: Partial<Habitat>): string[] {
  const errors: string[] = [];
  
  if (!habitat.id || habitat.id.trim().length === 0) {
    errors.push('Habitat ID is required');
  }
  
  if (!habitat.name || habitat.name.trim().length === 0) {
    errors.push('Habitat name is required');
  }
  
  if (!habitat.type) {
    errors.push('Habitat type is required');
  }
  
  if (habitat.explorationCost !== undefined && habitat.explorationCost < 0) {
    errors.push('Exploration cost cannot be negative');
  }
  
  if (habitat.maxDailyExplorations !== undefined && habitat.maxDailyExplorations < 1) {
    errors.push('Max daily explorations must be at least 1');
  }
  
  return errors;
}