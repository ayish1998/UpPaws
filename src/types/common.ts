// Common types and enums used across the system

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum HabitatType {
  FOREST = 'forest',
  OCEAN = 'ocean',
  DESERT = 'desert',
  ARCTIC = 'arctic',
  JUNGLE = 'jungle',
  SAVANNA = 'savanna',
  MOUNTAIN = 'mountain',
  GRASSLAND = 'grassland'
}

export enum TrainerPath {
  RESEARCH = 'research',
  BATTLE = 'battle',
  CONSERVATION = 'conservation'
}

export enum BattleType {
  WILD = 'wild',
  TRAINER = 'trainer',
  GYM = 'gym',
  TOURNAMENT = 'tournament',
  RAID = 'raid'
}

export enum BattleState {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Currency {
  pawCoins: number;
  researchPoints: number;
  battleTokens: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  habitatType: HabitatType;
  earnedAt: Date;
  gymLeader?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  quantity: number;
  effects?: ItemEffect[];
}

export enum ItemType {
  CAPTURE = 'capture',
  BATTLE = 'battle',
  TRAINING = 'training',
  COSMETIC = 'cosmetic'
}

export interface ItemEffect {
  type: string;
  value: number;
  duration?: number;
}

export interface Requirement {
  type: string;
  value: any;
  description: string;
}

export interface WeatherEffect {
  type: string;
  modifier: number;
  affectedTypes: HabitatType[];
}

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: string;
  rewards: Item[];
}