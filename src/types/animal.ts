import { Rarity, HabitatType } from './common.js';

export interface Animal {
  id: string;
  speciesId: string;
  name: string;
  nickname?: string;
  level: number;
  experience: number;
  stats: AnimalStats;
  moves: Move[];
  type: HabitatType[];
  rarity: Rarity;
  shiny: boolean;
  evolutionStage: number;
  captureDate: Date;
  trainerId: string;
  individualValues: IndividualValues;
  nature: AnimalNature;
  friendship: number;
  isEgg: boolean;
  breedingData?: BreedingData;
}

export interface AnimalStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
  stamina: number;
}

export interface Move {
  id: string;
  name: string;
  description: string;
  type: HabitatType;
  power: number;
  accuracy: number;
  energyCost: number;
  category: MoveCategory;
  effects: MoveEffect[];
  learnLevel: number;
}

export enum MoveCategory {
  PHYSICAL = 'physical',
  SPECIAL = 'special',
  STATUS = 'status'
}

export interface MoveEffect {
  type: string;
  chance: number;
  value: number;
  target: string;
}

export interface IndividualValues {
  health: number;
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
  stamina: number;
}

export interface AnimalNature {
  name: string;
  increasedStat: string;
  decreasedStat: string;
  description: string;
}

export interface BreedingData {
  parentIds: string[];
  eggSteps: number;
  hatchDate?: Date;
  inheritedMoves: string[];
}

export interface AnimalSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  habitat: HabitatType[];
  rarity: Rarity;
  baseStats: AnimalStats;
  learnableMoves: string[];
  evolutionChain?: EvolutionChain;
  conservationStatus: ConservationStatus;
  facts: string[];
  imageUrl?: string;
  emoji: string;
}

export interface EvolutionChain {
  stage: number;
  nextEvolution?: {
    speciesId: string;
    requirements: EvolutionRequirement[];
  };
  previousEvolution?: {
    speciesId: string;
  };
}

export interface EvolutionRequirement {
  type: string;
  value: any;
  description: string;
}

export enum ConservationStatus {
  LEAST_CONCERN = 'least_concern',
  NEAR_THREATENED = 'near_threatened',
  VULNERABLE = 'vulnerable',
  ENDANGERED = 'endangered',
  CRITICALLY_ENDANGERED = 'critically_endangered',
  EXTINCT_IN_WILD = 'extinct_in_wild',
  EXTINCT = 'extinct'
}

// Validation functions
export function validateAnimal(animal: Partial<Animal>): string[] {
  const errors: string[] = [];
  
  if (!animal.id || animal.id.trim().length === 0) {
    errors.push('Animal ID is required');
  }
  
  if (!animal.speciesId || animal.speciesId.trim().length === 0) {
    errors.push('Species ID is required');
  }
  
  if (!animal.name || animal.name.trim().length === 0) {
    errors.push('Animal name is required');
  }
  
  if (animal.level !== undefined && (animal.level < 1 || animal.level > 100)) {
    errors.push('Level must be between 1 and 100');
  }
  
  if (animal.friendship !== undefined && (animal.friendship < 0 || animal.friendship > 100)) {
    errors.push('Friendship must be between 0 and 100');
  }
  
  return errors;
}

export function calculateAnimalStats(
  baseStats: AnimalStats,
  level: number,
  individualValues: IndividualValues,
  nature: AnimalNature
): AnimalStats {
  const calculateStat = (base: number, iv: number, level: number, natureMod: number = 1): number => {
    return Math.floor(((2 * base + iv) * level / 100 + 5) * natureMod);
  };
  
  const natureMultiplier = (statName: string): number => {
    if (nature.increasedStat === statName) return 1.1;
    if (nature.decreasedStat === statName) return 0.9;
    return 1.0;
  };
  
  const health = Math.floor((2 * baseStats.health + individualValues.health) * level / 100 + level + 10);
  
  return {
    health,
    maxHealth: health,
    attack: calculateStat(baseStats.attack, individualValues.attack, level, natureMultiplier('attack')),
    defense: calculateStat(baseStats.defense, individualValues.defense, level, natureMultiplier('defense')),
    speed: calculateStat(baseStats.speed, individualValues.speed, level, natureMultiplier('speed')),
    intelligence: calculateStat(baseStats.intelligence, individualValues.intelligence, level, natureMultiplier('intelligence')),
    stamina: calculateStat(baseStats.stamina, individualValues.stamina, level, natureMultiplier('stamina'))
  };
}

export function generateRandomIVs(): IndividualValues {
  return {
    health: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
    intelligence: Math.floor(Math.random() * 32),
    stamina: Math.floor(Math.random() * 32)
  };
}