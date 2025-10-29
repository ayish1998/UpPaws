import { BattleType, BattleState } from './common.js';
import { Animal, Move } from './animal.js';
import { TrainerProfile } from './trainer.js';

export interface Battle {
  battleId: string;
  type: BattleType;
  participants: BattleParticipant[];
  teams: Animal[][];
  currentTurn: number;
  battleState: BattleState;
  moves: BattleMove[];
  result?: BattleResult;
  replay: BattleReplay;
  settings: BattleSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface BattleParticipant {
  trainerId: string;
  trainerName: string;
  teamIndex: number;
  isReady: boolean;
  isAI: boolean;
  aiDifficulty?: number;
}

export interface BattleMove {
  turnNumber: number;
  participantIndex: number;
  animalIndex: number;
  move: Move;
  targetIndex: number;
  damage: number;
  effectiveness: number;
  critical: boolean;
  effects: BattleMoveEffect[];
  timestamp: Date;
}

export interface BattleMoveEffect {
  type: string;
  value: number;
  duration: number;
  targetIndex: number;
}

export interface BattleResult {
  winnerId?: string;
  loserId?: string;
  isDraw: boolean;
  experienceGained: Record<string, number>;
  itemsWon: Record<string, string[]>;
  currencyWon: Record<string, number>;
  achievements: string[];
}

export interface BattleReplay {
  version: string;
  battleId: string;
  participants: BattleParticipant[];
  initialTeams: Animal[][];
  moves: BattleMove[];
  result: BattleResult;
  metadata: BattleReplayMetadata;
}

export interface BattleReplayMetadata {
  duration: number;
  totalTurns: number;
  averageTurnTime: number;
  spectators: number;
  tags: string[];
}

export interface BattleSettings {
  maxAnimalsPerTeam: number;
  turnTimeLimit: number;
  allowItems: boolean;
  allowSwitching: boolean;
  battleFormat: BattleFormat;
  weatherConditions?: WeatherCondition;
  terrainEffects?: TerrainEffect;
}

export enum BattleFormat {
  SINGLE = 'single',
  DOUBLE = 'double',
  TRIPLE = 'triple',
  ROTATION = 'rotation',
  RAID = 'raid'
}

export interface WeatherCondition {
  type: string;
  duration: number;
  effects: WeatherEffect[];
}

export interface WeatherEffect {
  statModifier: string;
  multiplier: number;
  affectedTypes: string[];
}

export interface TerrainEffect {
  type: string;
  duration: number;
  effects: TerrainModifier[];
}

export interface TerrainModifier {
  moveType: string;
  powerMultiplier: number;
  statusImmunity?: string[];
}

export interface BattleAction {
  type: BattleActionType;
  participantIndex: number;
  animalIndex: number;
  moveIndex?: number;
  targetIndex?: number;
  itemId?: string;
  switchToIndex?: number;
}

export enum BattleActionType {
  ATTACK = 'attack',
  SWITCH = 'switch',
  USE_ITEM = 'use_item',
  FORFEIT = 'forfeit'
}

export interface TypeEffectiveness {
  attackingType: string;
  defendingType: string;
  multiplier: number;
}

// Battle calculation functions
export function calculateDamage(
  attacker: Animal,
  defender: Animal,
  move: Move,
  effectiveness: number,
  critical: boolean = false,
  weather?: WeatherCondition
): number {
  const level = attacker.level;
  const attack = move.category === 'physical' ? attacker.stats.attack : attacker.stats.intelligence;
  const defense = move.category === 'physical' ? defender.stats.defense : defender.stats.intelligence;
  
  // Base damage calculation
  let damage = ((((2 * level / 5 + 2) * move.power * attack / defense) / 50) + 2);
  
  // Apply type effectiveness
  damage *= effectiveness;
  
  // Apply critical hit
  if (critical) {
    damage *= 1.5;
  }
  
  // Apply weather effects
  if (weather) {
    const weatherEffect = weather.effects.find(e => e.affectedTypes.includes(move.type));
    if (weatherEffect) {
      damage *= weatherEffect.multiplier;
    }
  }
  
  // Add random factor (85-100%)
  damage *= (Math.random() * 0.15 + 0.85);
  
  return Math.max(1, Math.floor(damage));
}

export function getTypeEffectiveness(attackingType: string, defendingTypes: string[]): number {
  // Simplified type effectiveness chart
  const effectiveness: Record<string, Record<string, number>> = {
    forest: { ocean: 2, desert: 0.5, arctic: 0.5 },
    ocean: { desert: 2, mountain: 2, forest: 0.5 },
    desert: { forest: 2, arctic: 0.5, ocean: 0.5 },
    arctic: { forest: 2, mountain: 2, desert: 0.5 },
    jungle: { desert: 2, arctic: 0.5 },
    savanna: { forest: 2, jungle: 0.5 },
    mountain: { forest: 2, ocean: 0.5 },
    grassland: { desert: 2, mountain: 0.5 }
  };
  
  let totalEffectiveness = 1;
  
  for (const defendingType of defendingTypes) {
    const typeChart = effectiveness[attackingType];
    if (typeChart && typeChart[defendingType]) {
      totalEffectiveness *= typeChart[defendingType];
    }
  }
  
  return totalEffectiveness;
}

export function calculateCriticalHitChance(attacker: Animal, move: Move): boolean {
  const baseChance = 0.0625; // 1/16 chance
  const speedBonus = attacker.stats.speed > 100 ? 0.01 : 0;
  const totalChance = baseChance + speedBonus;
  
  return Math.random() < totalChance;
}

export function validateBattle(battle: Partial<Battle>): string[] {
  const errors: string[] = [];
  
  if (!battle.battleId || battle.battleId.trim().length === 0) {
    errors.push('Battle ID is required');
  }
  
  if (!battle.participants || battle.participants.length < 2) {
    errors.push('Battle must have at least 2 participants');
  }
  
  if (!battle.teams || battle.teams.length !== battle.participants?.length) {
    errors.push('Number of teams must match number of participants');
  }
  
  return errors;
}