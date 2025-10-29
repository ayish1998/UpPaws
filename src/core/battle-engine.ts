import { 
  Battle, 
  BattleAction, 
  BattleActionType, 
  BattleMove, 
  BattleResult, 
  BattleState,
  calculateDamage,
  getTypeEffectiveness,
  calculateCriticalHitChance
} from '../types/battle.js';
import { Animal, Move, AnimalStats } from '../types/animal.js';
import { BattleType } from '../types/common.js';
import { BattleAI, createBattleAI, AIDifficulty } from './battle-ai.js';

/**
 * Status effect interface
 */
interface StatusEffect {
  type: string;
  duration: number;
  value: number;
  source: string;
}

/**
 * Battle action result interface
 */
interface BattleActionResult {
  success: boolean;
  message: string;
  effects: BattleEffect[];
  battleEnded?: boolean;
  winner?: string;
}

/**
 * Battle effect interface
 */
interface BattleEffect {
  type: 'damage' | 'heal' | 'status' | 'stat_change';
  target: string;
  value: number;
  message: string;
}

/**
 * Core battle engine that handles turn-based combat mechanics
 */
export class BattleEngine {
  private battle: Battle;
  private statusEffects: Map<string, StatusEffect[]> = new Map();
  private turnQueue: string[] = [];
  private aiOpponents: Map<number, BattleAI> = new Map();

  constructor(battle: Battle) {
    this.battle = battle;
    this.initializeStatusEffects();
    this.initializeTurnOrder();
    this.initializeAI();
  }

  /**
   * Initialize status effects for all animals
   */
  private initializeStatusEffects(): void {
    this.battle.teams.forEach((team, teamIndex) => {
      team.forEach((animal, animalIndex) => {
        const key = `${teamIndex}-${animalIndex}`;
        this.statusEffects.set(key, []);
      });
    });
  }

  /**
   * Initialize turn order based on animal speed
   */
  private initializeTurnOrder(): void {
    const allAnimals: Array<{key: string, speed: number}> = [];
    
    this.battle.teams.forEach((team, teamIndex) => {
      team.forEach((animal, animalIndex) => {
        if (animal.stats.health > 0) {
          allAnimals.push({
            key: `${teamIndex}-${animalIndex}`,
            speed: animal.stats.speed
          });
        }
      });
    });

    // Sort by speed (highest first)
    allAnimals.sort((a, b) => b.speed - a.speed);
    this.turnQueue = allAnimals.map(a => a.key);
  }

  /**
   * Initialize AI opponents
   */
  private initializeAI(): void {
    this.battle.participants.forEach((participant, index) => {
      if (participant.isAI) {
        const difficulty = participant.aiDifficulty || 1;
        const trainerType = participant.trainerName === 'Wild' ? 'wild' : 'tournament';
        
        const ai = createBattleAI(
          this.battle,
          index,
          trainerType,
          difficulty as AIDifficulty
        );
        
        this.aiOpponents.set(index, ai);
      }
    });
  }

  /**
   * Process a battle action and update battle state
   */
  async processAction(action: BattleAction): Promise<BattleActionResult> {
    if (this.battle.battleState !== BattleState.IN_PROGRESS) {
      throw new Error('Battle is not in progress');
    }

    const participant = this.battle.participants[action.participantIndex];
    if (!participant) {
      throw new Error('Invalid participant index');
    }

    let result: BattleActionResult;

    switch (action.type) {
      case BattleActionType.ATTACK:
        result = await this.processAttack(action);
        break;
      case BattleActionType.SWITCH:
        result = await this.processSwitch(action);
        break;
      case BattleActionType.USE_ITEM:
        result = await this.processItemUse(action);
        break;
      case BattleActionType.FORFEIT:
        result = await this.processForfeit(action);
        break;
      default:
        throw new Error('Unknown action type');
    }

    // Process status effects at end of turn
    await this.processStatusEffects();

    // Check for battle end conditions
    const battleEndResult = this.checkBattleEnd();
    if (battleEndResult.ended) {
      this.battle.battleState = BattleState.ENDED;
      this.battle.result = battleEndResult.result;
      result.battleEnded = true;
      result.winner = battleEndResult.result?.winnerId;
    }

    // Advance turn
    this.battle.currentTurn++;

    return result;
  }

  /**
   * Process an attack action
   */
  private async processAttack(action: BattleAction): Promise<BattleActionResult> {
    const attackerTeam = this.battle.teams[action.participantIndex];
    const attacker = attackerTeam[action.animalIndex];
    const move = attacker.moves[action.moveIndex!];
    
    const targetTeam = this.battle.teams[action.targetIndex! === 0 ? 1 : 0];
    const target = targetTeam[0]; // For now, always target the first animal

    if (!move) {
      return {
        success: false,
        message: 'Invalid move selected',
        effects: []
      };
    }

    if (attacker.stats.health <= 0) {
      return {
        success: false,
        message: `${attacker.name} is unable to battle!`,
        effects: []
      };
    }

    // Check if move hits
    const hitChance = move.accuracy / 100;
    const hits = Math.random() < hitChance;

    if (!hits) {
      return {
        success: true,
        message: `${attacker.name}'s ${move.name} missed!`,
        effects: []
      };
    }

    // Calculate damage
    const effectiveness = getTypeEffectiveness(move.type, target.type);
    const critical = calculateCriticalHitChance(attacker, move);
    const damage = calculateDamage(attacker, target, move, effectiveness, critical);

    // Apply damage
    target.stats.health = Math.max(0, target.stats.health - damage);

    // Create battle move record
    const battleMove: BattleMove = {
      turnNumber: this.battle.currentTurn,
      participantIndex: action.participantIndex,
      animalIndex: action.animalIndex,
      move,
      targetIndex: action.targetIndex!,
      damage,
      effectiveness,
      critical,
      effects: [],
      timestamp: new Date()
    };

    this.battle.moves.push(battleMove);

    // Create result
    let message = `${attacker.name} used ${move.name}!`;
    if (critical) message += ' Critical hit!';
    if (effectiveness > 1) message += ' It\'s super effective!';
    if (effectiveness < 1) message += ' It\'s not very effective...';

    const effects: BattleEffect[] = [{
      type: 'damage',
      target: `${action.targetIndex === 0 ? 1 : 0}-0`,
      value: damage,
      message: `${target.name} took ${damage} damage!`
    }];

    // Apply move effects
    if (move.effects && move.effects.length > 0) {
      for (const effect of move.effects) {
        if (Math.random() < effect.chance) {
          await this.applyMoveEffect(effect, attacker, target, effects);
        }
      }
    }

    return {
      success: true,
      message,
      effects
    };
  }

  /**
   * Process a switch action
   */
  private async processSwitch(action: BattleAction): Promise<BattleActionResult> {
    const team = this.battle.teams[action.participantIndex];
    const currentAnimal = team[action.animalIndex];
    const newAnimal = team[action.switchToIndex!];

    if (!newAnimal || newAnimal.stats.health <= 0) {
      return {
        success: false,
        message: 'Cannot switch to that animal!',
        effects: []
      };
    }

    // Swap animals in team
    [team[action.animalIndex], team[action.switchToIndex!]] = 
    [team[action.switchToIndex!], team[action.animalIndex]];

    return {
      success: true,
      message: `${currentAnimal.name} return! Go, ${newAnimal.name}!`,
      effects: []
    };
  }

  /**
   * Process an item use action
   */
  private async processItemUse(action: BattleAction): Promise<BattleActionResult> {
    // TODO: Implement item usage
    return {
      success: false,
      message: 'Items not yet implemented',
      effects: []
    };
  }

  /**
   * Process a forfeit action
   */
  private async processForfeit(action: BattleAction): Promise<BattleActionResult> {
    this.battle.battleState = BattleState.ENDED;
    
    const winnerId = action.participantIndex === 0 ? 
      this.battle.participants[1].trainerId : 
      this.battle.participants[0].trainerId;

    this.battle.result = {
      winnerId,
      loserId: this.battle.participants[action.participantIndex].trainerId,
      isDraw: false,
      experienceGained: {},
      itemsWon: {},
      currencyWon: {},
      achievements: []
    };

    return {
      success: true,
      message: `${this.battle.participants[action.participantIndex].trainerName} forfeited the battle!`,
      effects: [],
      battleEnded: true,
      winner: winnerId
    };
  }

  /**
   * Apply move effect to target
   */
  private async applyMoveEffect(
    effect: any, 
    attacker: Animal, 
    target: Animal, 
    effects: BattleEffect[]
  ): Promise<void> {
    switch (effect.type) {
      case 'poison':
        this.addStatusEffect(target, {
          type: 'poison',
          duration: 3,
          value: Math.floor(target.stats.maxHealth * 0.125),
          source: attacker.id
        });
        effects.push({
          type: 'status',
          target: this.getAnimalKey(target),
          value: 0,
          message: `${target.name} was poisoned!`
        });
        break;
      
      case 'burn':
        this.addStatusEffect(target, {
          type: 'burn',
          duration: 3,
          value: Math.floor(target.stats.maxHealth * 0.0625),
          source: attacker.id
        });
        effects.push({
          type: 'status',
          target: this.getAnimalKey(target),
          value: 0,
          message: `${target.name} was burned!`
        });
        break;
      
      case 'heal':
        const healAmount = Math.floor(attacker.stats.maxHealth * (effect.value / 100));
        attacker.stats.health = Math.min(
          attacker.stats.maxHealth, 
          attacker.stats.health + healAmount
        );
        effects.push({
          type: 'heal',
          target: this.getAnimalKey(attacker),
          value: healAmount,
          message: `${attacker.name} recovered ${healAmount} HP!`
        });
        break;
    }
  }

  /**
   * Process status effects for all animals
   */
  private async processStatusEffects(): Promise<void> {
    for (const [key, effects] of this.statusEffects.entries()) {
      const animal = this.getAnimalByKey(key);
      if (!animal || animal.stats.health <= 0) continue;

      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        
        switch (effect.type) {
          case 'poison':
          case 'burn':
            animal.stats.health = Math.max(0, animal.stats.health - effect.value);
            break;
        }

        effect.duration--;
        if (effect.duration <= 0) {
          effects.splice(i, 1);
        }
      }
    }
  }

  /**
   * Add status effect to an animal
   */
  private addStatusEffect(animal: Animal, effect: StatusEffect): void {
    const key = this.getAnimalKey(animal);
    const effects = this.statusEffects.get(key) || [];
    
    // Remove existing effect of same type
    const existingIndex = effects.findIndex(e => e.type === effect.type);
    if (existingIndex >= 0) {
      effects.splice(existingIndex, 1);
    }
    
    effects.push(effect);
    this.statusEffects.set(key, effects);
  }

  /**
   * Get animal key for status effects map
   */
  private getAnimalKey(animal: Animal): string {
    for (let teamIndex = 0; teamIndex < this.battle.teams.length; teamIndex++) {
      const team = this.battle.teams[teamIndex];
      for (let animalIndex = 0; animalIndex < team.length; animalIndex++) {
        if (team[animalIndex].id === animal.id) {
          return `${teamIndex}-${animalIndex}`;
        }
      }
    }
    return '';
  }

  /**
   * Get animal by key
   */
  private getAnimalByKey(key: string): Animal | null {
    const [teamIndex, animalIndex] = key.split('-').map(Number);
    return this.battle.teams[teamIndex]?.[animalIndex] || null;
  }

  /**
   * Check if battle has ended
   */
  private checkBattleEnd(): { ended: boolean; result?: BattleResult } {
    const team1Alive = this.battle.teams[0].some(animal => animal.stats.health > 0);
    const team2Alive = this.battle.teams[1].some(animal => animal.stats.health > 0);

    if (!team1Alive && !team2Alive) {
      return {
        ended: true,
        result: {
          isDraw: true,
          experienceGained: {},
          itemsWon: {},
          currencyWon: {},
          achievements: []
        }
      };
    }

    if (!team1Alive) {
      return {
        ended: true,
        result: {
          winnerId: this.battle.participants[1].trainerId,
          loserId: this.battle.participants[0].trainerId,
          isDraw: false,
          experienceGained: { [this.battle.participants[1].trainerId]: 100 },
          itemsWon: {},
          currencyWon: { [this.battle.participants[1].trainerId]: 50 },
          achievements: []
        }
      };
    }

    if (!team2Alive) {
      return {
        ended: true,
        result: {
          winnerId: this.battle.participants[0].trainerId,
          loserId: this.battle.participants[1].trainerId,
          isDraw: false,
          experienceGained: { [this.battle.participants[0].trainerId]: 100 },
          itemsWon: {},
          currencyWon: { [this.battle.participants[0].trainerId]: 50 },
          achievements: []
        }
      };
    }

    return { ended: false };
  }

  /**
   * Get current battle state
   */
  public getBattle(): Battle {
    return this.battle;
  }

  /**
   * Get status effects for an animal
   */
  public getStatusEffects(animal: Animal): StatusEffect[] {
    const key = this.getAnimalKey(animal);
    return this.statusEffects.get(key) || [];
  }

  /**
   * Get AI action for a participant
   */
  public getAIAction(participantIndex: number): BattleAction | null {
    const ai = this.aiOpponents.get(participantIndex);
    if (!ai) return null;

    // Update AI with current battle state
    ai.updateState(this.battle);
    
    // Get AI's best action
    return ai.getBestAction();
  }

  /**
   * Check if a participant is AI controlled
   */
  public isAIParticipant(participantIndex: number): boolean {
    return this.aiOpponents.has(participantIndex);
  }

  /**
   * Notify AI of opponent's action (for learning AIs)
   */
  public notifyAIOfOpponentAction(participantIndex: number, opponentAction: BattleAction): void {
    const ai = this.aiOpponents.get(participantIndex);
    if (ai && 'learnFromOpponent' in ai) {
      (ai as any).learnFromOpponent(opponentAction);
    }
  }
}