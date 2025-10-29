import { Animal, Move } from '../types/animal.js';
import { Battle, BattleAction, BattleActionType } from '../types/battle.js';
import { HabitatType } from '../types/common.js';

/**
 * AI difficulty levels
 */
export enum AIDifficulty {
  NOVICE = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4,
  MASTER = 5
}

/**
 * AI personality types that affect battle strategy
 */
export enum AIPersonality {
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  BALANCED = 'balanced',
  STRATEGIC = 'strategic',
  UNPREDICTABLE = 'unpredictable'
}

/**
 * Move evaluation result
 */
interface MoveEvaluation {
  move: Move;
  moveIndex: number;
  score: number;
  reasoning: string;
}

/**
 * Battle AI system for NPC opponents
 */
export class BattleAI {
  private difficulty: AIDifficulty;
  private personality: AIPersonality;
  private battle: Battle;
  private participantIndex: number;

  constructor(
    battle: Battle,
    participantIndex: number,
    difficulty: AIDifficulty = AIDifficulty.INTERMEDIATE,
    personality: AIPersonality = AIPersonality.BALANCED
  ) {
    this.battle = battle;
    this.participantIndex = participantIndex;
    this.difficulty = difficulty;
    this.personality = personality;
  }

  /**
   * Get the best action for the AI to take
   */
  public getBestAction(): BattleAction {
    const aiTeam = this.battle.teams[this.participantIndex];
    const currentAnimal = aiTeam[0]; // For now, assume single animal battles
    
    if (currentAnimal.stats.health <= 0) {
      // Need to switch to another animal
      return this.getBestSwitchAction();
    }

    // Evaluate all possible moves
    const moveEvaluations = this.evaluateAllMoves(currentAnimal);
    
    if (moveEvaluations.length === 0) {
      // No moves available, forfeit
      return {
        type: BattleActionType.FORFEIT,
        participantIndex: this.participantIndex,
        animalIndex: 0
      };
    }

    // Apply difficulty-based decision making
    const selectedMove = this.selectMoveByDifficulty(moveEvaluations);

    return {
      type: BattleActionType.ATTACK,
      participantIndex: this.participantIndex,
      animalIndex: 0,
      moveIndex: selectedMove.moveIndex,
      targetIndex: this.getTargetIndex()
    };
  }

  /**
   * Evaluate all available moves for the current animal
   */
  private evaluateAllMoves(animal: Animal): MoveEvaluation[] {
    const evaluations: MoveEvaluation[] = [];
    const opponentTeam = this.battle.teams[this.participantIndex === 0 ? 1 : 0];
    const opponent = opponentTeam[0];

    animal.moves.forEach((move, index) => {
      const evaluation = this.evaluateMove(move, index, animal, opponent);
      evaluations.push(evaluation);
    });

    // Sort by score (highest first)
    return evaluations.sort((a, b) => b.score - a.score);
  }

  /**
   * Evaluate a single move
   */
  private evaluateMove(move: Move, moveIndex: number, attacker: Animal, defender: Animal): MoveEvaluation {
    let score = 0;
    let reasoning = '';

    // Base power evaluation
    score += move.power * 0.5;
    reasoning += `Power: ${move.power}; `;

    // Accuracy evaluation
    score += (move.accuracy / 100) * 20;
    reasoning += `Accuracy: ${move.accuracy}%; `;

    // Type effectiveness evaluation
    const effectiveness = this.calculateTypeEffectiveness(move.type, defender.type);
    score += effectiveness * 30;
    if (effectiveness > 1) {
      reasoning += 'Super effective; ';
    } else if (effectiveness < 1) {
      reasoning += 'Not very effective; ';
    }

    // Health-based evaluation
    const defenderHealthPercent = defender.stats.health / defender.stats.maxHealth;
    if (defenderHealthPercent < 0.3 && move.power > 0) {
      score += 25; // Prioritize finishing moves
      reasoning += 'Finishing move; ';
    }

    // Personality-based adjustments
    score += this.applyPersonalityModifier(move, attacker, defender);

    // Status move evaluation
    if (move.power === 0) {
      score += this.evaluateStatusMove(move, attacker, defender);
    }

    // Energy cost consideration
    if (attacker.stats.stamina < move.energyCost) {
      score -= 50; // Can't use this move
      reasoning += 'Insufficient energy; ';
    }

    return {
      move,
      moveIndex,
      score: Math.max(0, score),
      reasoning: reasoning.trim()
    };
  }

  /**
   * Calculate type effectiveness
   */
  private calculateTypeEffectiveness(attackType: HabitatType, defenderTypes: HabitatType[]): number {
    // Simplified type effectiveness chart
    const effectiveness: Record<string, Record<string, number>> = {
      [HabitatType.FOREST]: { [HabitatType.OCEAN]: 2, [HabitatType.DESERT]: 0.5, [HabitatType.ARCTIC]: 0.5 },
      [HabitatType.OCEAN]: { [HabitatType.DESERT]: 2, [HabitatType.MOUNTAIN]: 2, [HabitatType.FOREST]: 0.5 },
      [HabitatType.DESERT]: { [HabitatType.FOREST]: 2, [HabitatType.ARCTIC]: 0.5, [HabitatType.OCEAN]: 0.5 },
      [HabitatType.ARCTIC]: { [HabitatType.FOREST]: 2, [HabitatType.MOUNTAIN]: 2, [HabitatType.DESERT]: 0.5 },
      [HabitatType.JUNGLE]: { [HabitatType.DESERT]: 2, [HabitatType.ARCTIC]: 0.5 },
      [HabitatType.GRASSLAND]: { [HabitatType.FOREST]: 2, [HabitatType.JUNGLE]: 0.5 },
      [HabitatType.MOUNTAIN]: { [HabitatType.FOREST]: 2, [HabitatType.OCEAN]: 0.5 }
    };

    let totalEffectiveness = 1;
    
    for (const defenderType of defenderTypes) {
      const typeChart = effectiveness[attackType];
      if (typeChart && typeChart[defenderType]) {
        totalEffectiveness *= typeChart[defenderType];
      }
    }
    
    return totalEffectiveness;
  }

  /**
   * Apply personality-based score modifiers
   */
  private applyPersonalityModifier(move: Move, attacker: Animal, defender: Animal): number {
    let modifier = 0;

    switch (this.personality) {
      case AIPersonality.AGGRESSIVE:
        if (move.power > 80) modifier += 20;
        if (move.power === 0) modifier -= 15; // Avoid status moves
        break;

      case AIPersonality.DEFENSIVE:
        if (move.power === 0) modifier += 15; // Prefer status moves
        if (move.effects?.some(e => e.type.includes('heal'))) modifier += 25;
        break;

      case AIPersonality.BALANCED:
        // No specific modifiers, balanced approach
        break;

      case AIPersonality.STRATEGIC:
        // Prefer moves with secondary effects
        if (move.effects && move.effects.length > 0) modifier += 15;
        // Consider opponent's weaknesses more heavily
        const effectiveness = this.calculateTypeEffectiveness(move.type, defender.type);
        if (effectiveness > 1) modifier += 10;
        break;

      case AIPersonality.UNPREDICTABLE:
        // Add random variance
        modifier += (Math.random() - 0.5) * 30;
        break;
    }

    return modifier;
  }

  /**
   * Evaluate status moves
   */
  private evaluateStatusMove(move: Move, attacker: Animal, defender: Animal): number {
    let score = 0;

    if (!move.effects) return score;

    for (const effect of move.effects) {
      switch (effect.type) {
        case 'heal':
          const healthPercent = attacker.stats.health / attacker.stats.maxHealth;
          if (healthPercent < 0.5) score += 30;
          break;

        case 'attack_up':
        case 'defense_up':
        case 'speed_up':
          score += 20;
          break;

        case 'attack_down':
        case 'defense_down':
        case 'speed_down':
          score += 15;
          break;

        case 'poison':
        case 'burn':
          if (defender.stats.health > defender.stats.maxHealth * 0.5) score += 25;
          break;

        case 'sleep':
        case 'paralysis':
          score += 30;
          break;
      }
    }

    return score;
  }

  /**
   * Select move based on AI difficulty
   */
  private selectMoveByDifficulty(evaluations: MoveEvaluation[]): MoveEvaluation {
    switch (this.difficulty) {
      case AIDifficulty.NOVICE:
        // 60% chance to pick best move, 40% random
        return Math.random() < 0.6 ? evaluations[0] : 
               evaluations[Math.floor(Math.random() * evaluations.length)];

      case AIDifficulty.INTERMEDIATE:
        // 80% chance to pick from top 2 moves
        const topTwo = evaluations.slice(0, 2);
        return Math.random() < 0.8 ? topTwo[Math.floor(Math.random() * topTwo.length)] :
               evaluations[Math.floor(Math.random() * evaluations.length)];

      case AIDifficulty.ADVANCED:
        // 90% chance to pick best move, 10% from top 3
        if (Math.random() < 0.9) {
          return evaluations[0];
        } else {
          const topThree = evaluations.slice(0, 3);
          return topThree[Math.floor(Math.random() * topThree.length)];
        }

      case AIDifficulty.EXPERT:
        // 95% chance to pick optimal move
        return Math.random() < 0.95 ? evaluations[0] : evaluations[1] || evaluations[0];

      case AIDifficulty.MASTER:
        // Always pick the best move
        return evaluations[0];

      default:
        return evaluations[0];
    }
  }

  /**
   * Get the best switch action
   */
  private getBestSwitchAction(): BattleAction {
    const aiTeam = this.battle.teams[this.participantIndex];
    
    // Find the first healthy animal
    for (let i = 1; i < aiTeam.length; i++) {
      if (aiTeam[i].stats.health > 0) {
        return {
          type: BattleActionType.SWITCH,
          participantIndex: this.participantIndex,
          animalIndex: 0,
          switchToIndex: i
        };
      }
    }

    // No healthy animals, forfeit
    return {
      type: BattleActionType.FORFEIT,
      participantIndex: this.participantIndex,
      animalIndex: 0
    };
  }

  /**
   * Get target index (for now, always target the first opponent animal)
   */
  private getTargetIndex(): number {
    return this.participantIndex === 0 ? 1 : 0;
  }

  /**
   * Update AI state (called each turn)
   */
  public updateState(battle: Battle): void {
    this.battle = battle;
  }

  /**
   * Get AI decision explanation (for debugging/display)
   */
  public getLastDecisionExplanation(): string {
    return `AI (${this.personality}, Lv.${this.difficulty}) is thinking...`;
  }
}

/**
 * Gym Leader AI - specialized AI for habitat-themed gym battles
 */
export class GymLeaderAI extends BattleAI {
  private gymType: HabitatType;
  private gymLevel: number;

  constructor(
    battle: Battle,
    participantIndex: number,
    gymType: HabitatType,
    gymLevel: number = 1
  ) {
    // Gym leaders are always expert level with strategic personality
    super(battle, participantIndex, AIDifficulty.EXPERT, AIPersonality.STRATEGIC);
    this.gymType = gymType;
    this.gymLevel = gymLevel;
  }

  /**
   * Override move evaluation to prefer gym-type moves
   */
  protected evaluateMove(move: Move, moveIndex: number, attacker: Animal, defender: Animal): MoveEvaluation {
    const baseEvaluation = super['evaluateMove'](move, moveIndex, attacker, defender);
    
    // Bonus for using gym-type moves
    if (move.type === this.gymType) {
      baseEvaluation.score += 15;
      baseEvaluation.reasoning += 'Gym specialty; ';
    }

    // Gym leaders are more strategic about type matchups
    const effectiveness = this.calculateTypeEffectiveness(move.type, defender.type);
    if (effectiveness > 1) {
      baseEvaluation.score += 10; // Extra bonus for super effective moves
    }

    return baseEvaluation;
  }
}

/**
 * Tournament AI - adaptive AI that learns from previous battles
 */
export class TournamentAI extends BattleAI {
  private battleHistory: BattleAction[] = [];
  private opponentPatterns: Map<string, number[]> = new Map();

  constructor(
    battle: Battle,
    participantIndex: number,
    difficulty: AIDifficulty = AIDifficulty.ADVANCED
  ) {
    super(battle, participantIndex, difficulty, AIPersonality.STRATEGIC);
  }

  /**
   * Learn from opponent's previous actions
   */
  public learnFromOpponent(opponentAction: BattleAction): void {
    const opponentId = this.battle.participants[this.participantIndex === 0 ? 1 : 0].trainerId;
    
    if (!this.opponentPatterns.has(opponentId)) {
      this.opponentPatterns.set(opponentId, []);
    }
    
    const patterns = this.opponentPatterns.get(opponentId)!;
    if (opponentAction.type === BattleActionType.ATTACK && opponentAction.moveIndex !== undefined) {
      patterns.push(opponentAction.moveIndex);
      
      // Keep only last 10 moves to focus on recent patterns
      if (patterns.length > 10) {
        patterns.shift();
      }
    }
  }

  /**
   * Predict opponent's next move based on patterns
   */
  private predictOpponentMove(): number | null {
    const opponentId = this.battle.participants[this.participantIndex === 0 ? 1 : 0].trainerId;
    const patterns = this.opponentPatterns.get(opponentId);
    
    if (!patterns || patterns.length < 3) {
      return null; // Not enough data
    }

    // Find most common move
    const moveCounts = new Map<number, number>();
    patterns.forEach(moveIndex => {
      moveCounts.set(moveIndex, (moveCounts.get(moveIndex) || 0) + 1);
    });

    let mostCommonMove = -1;
    let maxCount = 0;
    moveCounts.forEach((count, moveIndex) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMove = moveIndex;
      }
    });

    return mostCommonMove;
  }

  /**
   * Override move evaluation to counter predicted opponent moves
   */
  protected evaluateMove(move: Move, moveIndex: number, attacker: Animal, defender: Animal): MoveEvaluation {
    const baseEvaluation = super['evaluateMove'](move, moveIndex, attacker, defender);
    
    // Try to counter predicted opponent move
    const predictedMove = this.predictOpponentMove();
    if (predictedMove !== null) {
      // Add bonus for moves that counter the predicted move
      // This is a simplified counter system
      if (move.power > 0 && predictedMove >= 0) {
        baseEvaluation.score += 5;
        baseEvaluation.reasoning += 'Counter prediction; ';
      }
    }

    return baseEvaluation;
  }
}

/**
 * Create AI based on trainer type and difficulty
 */
export function createBattleAI(
  battle: Battle,
  participantIndex: number,
  trainerType: 'wild' | 'gym' | 'tournament' | 'elite',
  difficulty: AIDifficulty = AIDifficulty.INTERMEDIATE,
  options?: {
    gymType?: HabitatType;
    gymLevel?: number;
    personality?: AIPersonality;
  }
): BattleAI {
  switch (trainerType) {
    case 'wild':
      return new BattleAI(battle, participantIndex, AIDifficulty.NOVICE, AIPersonality.UNPREDICTABLE);
    
    case 'gym':
      return new GymLeaderAI(
        battle,
        participantIndex,
        options?.gymType || HabitatType.FOREST,
        options?.gymLevel || 1
      );
    
    case 'tournament':
      return new TournamentAI(battle, participantIndex, difficulty);
    
    case 'elite':
      return new BattleAI(battle, participantIndex, AIDifficulty.MASTER, AIPersonality.STRATEGIC);
    
    default:
      return new BattleAI(battle, participantIndex, difficulty, options?.personality || AIPersonality.BALANCED);
  }
}