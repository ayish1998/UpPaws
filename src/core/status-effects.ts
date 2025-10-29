import { Animal } from '../types/animal.js';

/**
 * Status effect types
 */
export enum StatusEffectType {
  // Primary status conditions (only one can be active)
  BURN = 'burn',
  FREEZE = 'freeze',
  PARALYSIS = 'paralysis',
  POISON = 'poison',
  SLEEP = 'sleep',
  
  // Secondary status conditions (multiple can be active)
  CONFUSION = 'confusion',
  FLINCH = 'flinch',
  INFATUATION = 'infatuation',
  TAUNT = 'taunt',
  
  // Stat modifications
  ATTACK_UP = 'attack_up',
  ATTACK_DOWN = 'attack_down',
  DEFENSE_UP = 'defense_up',
  DEFENSE_DOWN = 'defense_down',
  SPEED_UP = 'speed_up',
  SPEED_DOWN = 'speed_down',
  INTELLIGENCE_UP = 'intelligence_up',
  INTELLIGENCE_DOWN = 'intelligence_down',
  ACCURACY_UP = 'accuracy_up',
  ACCURACY_DOWN = 'accuracy_down',
  EVASION_UP = 'evasion_up',
  EVASION_DOWN = 'evasion_down'
}

/**
 * Status effect interface
 */
export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // -1 for permanent until switched out
  severity: number; // 1-6 for stat changes, damage amount for others
  source: string; // ID of the animal/move that caused this effect
  message: string; // Description of the effect
  onApply?: (animal: Animal) => void;
  onTick?: (animal: Animal) => number; // Returns damage dealt
  onRemove?: (animal: Animal) => void;
}

/**
 * Status effects system for managing battle conditions
 */
export class StatusEffectsSystem {
  private static readonly PRIMARY_STATUS_EFFECTS = [
    StatusEffectType.BURN,
    StatusEffectType.FREEZE,
    StatusEffectType.PARALYSIS,
    StatusEffectType.POISON,
    StatusEffectType.SLEEP
  ];

  /**
   * Create a status effect
   */
  public static createStatusEffect(
    type: StatusEffectType,
    duration: number,
    severity: number = 1,
    source: string = 'unknown'
  ): StatusEffect {
    const effect: StatusEffect = {
      type,
      duration,
      severity,
      source,
      message: this.getStatusMessage(type, severity)
    };

    // Add specific behavior for each status effect
    switch (type) {
      case StatusEffectType.BURN:
        effect.onTick = (animal: Animal) => {
          const damage = Math.max(1, Math.floor(animal.stats.maxHealth / 16));
          animal.stats.health = Math.max(0, animal.stats.health - damage);
          return damage;
        };
        break;

      case StatusEffectType.POISON:
        effect.onTick = (animal: Animal) => {
          const damage = Math.max(1, Math.floor(animal.stats.maxHealth / 8));
          animal.stats.health = Math.max(0, animal.stats.health - damage);
          return damage;
        };
        break;

      case StatusEffectType.FREEZE:
        effect.onTick = (animal: Animal) => {
          // 20% chance to thaw each turn
          if (Math.random() < 0.2) {
            this.removeStatusEffect(animal, type);
          }
          return 0;
        };
        break;

      case StatusEffectType.PARALYSIS:
        effect.onTick = (animal: Animal) => {
          // 25% chance to be unable to move
          return Math.random() < 0.25 ? -1 : 0; // -1 indicates can't move
        };
        break;

      case StatusEffectType.SLEEP:
        effect.onTick = (animal: Animal) => {
          // Decrease duration each turn, wake up when it reaches 0
          if (effect.duration <= 1) {
            this.removeStatusEffect(animal, type);
          }
          return -1; // Can't move while asleep
        };
        break;

      case StatusEffectType.CONFUSION:
        effect.onTick = (animal: Animal) => {
          // 33% chance to hurt itself in confusion
          if (Math.random() < 0.33) {
            const damage = Math.floor(animal.stats.attack * 0.4);
            animal.stats.health = Math.max(0, animal.stats.health - damage);
            return damage;
          }
          return 0;
        };
        break;
    }

    return effect;
  }

  /**
   * Apply a status effect to an animal
   */
  public static applyStatusEffect(animal: Animal, effect: StatusEffect): boolean {
    // Check if animal already has a primary status condition
    if (this.PRIMARY_STATUS_EFFECTS.includes(effect.type)) {
      const existingPrimary = this.getPrimaryStatusEffect(animal);
      if (existingPrimary) {
        return false; // Can't apply primary status if one already exists
      }
    }

    // Remove existing effect of the same type
    this.removeStatusEffect(animal, effect.type);

    // Add the new effect
    if (!animal.statusEffects) {
      (animal as any).statusEffects = [];
    }
    (animal as any).statusEffects.push(effect);

    // Call onApply if it exists
    if (effect.onApply) {
      effect.onApply(animal);
    }

    return true;
  }

  /**
   * Remove a status effect from an animal
   */
  public static removeStatusEffect(animal: Animal, type: StatusEffectType): boolean {
    if (!(animal as any).statusEffects) return false;

    const effects = (animal as any).statusEffects as StatusEffect[];
    const index = effects.findIndex(effect => effect.type === type);
    
    if (index >= 0) {
      const effect = effects[index];
      
      // Call onRemove if it exists
      if (effect.onRemove) {
        effect.onRemove(animal);
      }
      
      effects.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Process all status effects for an animal at the end of a turn
   */
  public static processStatusEffects(animal: Animal): StatusEffectResult[] {
    if (!(animal as any).statusEffects) return [];

    const effects = (animal as any).statusEffects as StatusEffect[];
    const results: StatusEffectResult[] = [];

    // Process each effect
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      let damage = 0;
      let canMove = true;

      // Call onTick if it exists
      if (effect.onTick) {
        const tickResult = effect.onTick(animal);
        if (tickResult === -1) {
          canMove = false;
        } else if (tickResult > 0) {
          damage = tickResult;
        }
      }

      // Decrease duration
      if (effect.duration > 0) {
        effect.duration--;
      }

      // Create result
      results.push({
        type: effect.type,
        damage,
        canMove,
        message: this.getTickMessage(effect.type, damage, canMove)
      });

      // Remove effect if duration expired
      if (effect.duration === 0) {
        if (effect.onRemove) {
          effect.onRemove(animal);
        }
        effects.splice(i, 1);
      }
    }

    return results;
  }

  /**
   * Get the primary status effect (burn, freeze, etc.)
   */
  public static getPrimaryStatusEffect(animal: Animal): StatusEffect | null {
    if (!(animal as any).statusEffects) return null;

    const effects = (animal as any).statusEffects as StatusEffect[];
    return effects.find(effect => this.PRIMARY_STATUS_EFFECTS.includes(effect.type)) || null;
  }

  /**
   * Get all status effects of a specific type
   */
  public static getStatusEffects(animal: Animal, type?: StatusEffectType): StatusEffect[] {
    if (!(animal as any).statusEffects) return [];

    const effects = (animal as any).statusEffects as StatusEffect[];
    return type ? effects.filter(effect => effect.type === type) : effects;
  }

  /**
   * Check if animal has a specific status effect
   */
  public static hasStatusEffect(animal: Animal, type: StatusEffectType): boolean {
    return this.getStatusEffects(animal, type).length > 0;
  }

  /**
   * Clear all status effects from an animal
   */
  public static clearAllStatusEffects(animal: Animal): void {
    if ((animal as any).statusEffects) {
      const effects = (animal as any).statusEffects as StatusEffect[];
      
      // Call onRemove for all effects
      effects.forEach(effect => {
        if (effect.onRemove) {
          effect.onRemove(animal);
        }
      });
      
      (animal as any).statusEffects = [];
    }
  }

  /**
   * Get stat modifier based on stat change effects
   */
  public static getStatModifier(animal: Animal, statType: string): number {
    if (!(animal as any).statusEffects) return 1.0;

    const effects = (animal as any).statusEffects as StatusEffect[];
    let totalStages = 0;

    // Count stat modification stages
    effects.forEach(effect => {
      if (effect.type === `${statType}_up` as StatusEffectType) {
        totalStages += effect.severity;
      } else if (effect.type === `${statType}_down` as StatusEffectType) {
        totalStages -= effect.severity;
      }
    });

    // Convert stages to multiplier
    return this.stageToMultiplier(totalStages);
  }

  /**
   * Convert stat stages to multiplier
   */
  private static stageToMultiplier(stages: number): number {
    const clampedStages = Math.max(-6, Math.min(6, stages));
    
    if (clampedStages >= 0) {
      return (2 + clampedStages) / 2;
    } else {
      return 2 / (2 + Math.abs(clampedStages));
    }
  }

  /**
   * Get status effect message
   */
  private static getStatusMessage(type: StatusEffectType, severity: number): string {
    switch (type) {
      case StatusEffectType.BURN:
        return 'is burned!';
      case StatusEffectType.FREEZE:
        return 'is frozen solid!';
      case StatusEffectType.PARALYSIS:
        return 'is paralyzed!';
      case StatusEffectType.POISON:
        return 'is poisoned!';
      case StatusEffectType.SLEEP:
        return 'fell asleep!';
      case StatusEffectType.CONFUSION:
        return 'is confused!';
      case StatusEffectType.ATTACK_UP:
        return `attack ${severity > 1 ? 'sharply ' : ''}rose!`;
      case StatusEffectType.ATTACK_DOWN:
        return `attack ${severity > 1 ? 'sharply ' : ''}fell!`;
      case StatusEffectType.DEFENSE_UP:
        return `defense ${severity > 1 ? 'sharply ' : ''}rose!`;
      case StatusEffectType.DEFENSE_DOWN:
        return `defense ${severity > 1 ? 'sharply ' : ''}fell!`;
      case StatusEffectType.SPEED_UP:
        return `speed ${severity > 1 ? 'sharply ' : ''}rose!`;
      case StatusEffectType.SPEED_DOWN:
        return `speed ${severity > 1 ? 'sharply ' : ''}fell!`;
      default:
        return 'is affected by a status condition!';
    }
  }

  /**
   * Get tick message for status effects
   */
  private static getTickMessage(type: StatusEffectType, damage: number, canMove: boolean): string {
    switch (type) {
      case StatusEffectType.BURN:
        return `is hurt by its burn! (${damage} damage)`;
      case StatusEffectType.POISON:
        return `is hurt by poison! (${damage} damage)`;
      case StatusEffectType.FREEZE:
        return canMove ? 'thawed out!' : 'is frozen and cannot move!';
      case StatusEffectType.PARALYSIS:
        return canMove ? '' : 'is paralyzed and cannot move!';
      case StatusEffectType.SLEEP:
        return canMove ? 'woke up!' : 'is fast asleep!';
      case StatusEffectType.CONFUSION:
        return damage > 0 ? `hurt itself in confusion! (${damage} damage)` : 'is confused!';
      default:
        return '';
    }
  }
}

/**
 * Result of processing status effects
 */
export interface StatusEffectResult {
  type: StatusEffectType;
  damage: number;
  canMove: boolean;
  message: string;
}