import { Animal, AnimalStats, IndividualValues, AnimalNature } from '../types/animal.js';
import { HabitatType } from '../types/common.js';

/**
 * Animal nature definitions that affect stat growth
 */
export const ANIMAL_NATURES: Record<string, AnimalNature> = {
  // Attack boosting natures
  adamant: {
    name: 'Adamant',
    increasedStat: 'attack',
    decreasedStat: 'intelligence',
    description: 'Loves to fight and is very aggressive.'
  },
  brave: {
    name: 'Brave',
    increasedStat: 'attack',
    decreasedStat: 'speed',
    description: 'Courageous but moves slowly.'
  },
  lonely: {
    name: 'Lonely',
    increasedStat: 'attack',
    decreasedStat: 'defense',
    description: 'Prefers to be alone and fights fiercely.'
  },
  naughty: {
    name: 'Naughty',
    increasedStat: 'attack',
    decreasedStat: 'intelligence',
    description: 'Mischievous and loves to cause trouble.'
  },

  // Defense boosting natures
  bold: {
    name: 'Bold',
    increasedStat: 'defense',
    decreasedStat: 'attack',
    description: 'Confident and stands its ground.'
  },
  impish: {
    name: 'Impish',
    increasedStat: 'defense',
    decreasedStat: 'intelligence',
    description: 'Playful but tough as nails.'
  },
  lax: {
    name: 'Lax',
    increasedStat: 'defense',
    decreasedStat: 'intelligence',
    description: 'Relaxed and hard to ruffle.'
  },
  relaxed: {
    name: 'Relaxed',
    increasedStat: 'defense',
    decreasedStat: 'speed',
    description: 'Calm and takes things slowly.'
  },

  // Speed boosting natures
  hasty: {
    name: 'Hasty',
    increasedStat: 'speed',
    decreasedStat: 'defense',
    description: 'Quick to act but not very defensive.'
  },
  jolly: {
    name: 'Jolly',
    increasedStat: 'speed',
    decreasedStat: 'intelligence',
    description: 'Happy and energetic, always moving.'
  },
  naive: {
    name: 'Naive',
    increasedStat: 'speed',
    decreasedStat: 'intelligence',
    description: 'Innocent and quick to trust.'
  },
  timid: {
    name: 'Timid',
    increasedStat: 'speed',
    decreasedStat: 'attack',
    description: 'Shy and prefers to flee rather than fight.'
  },

  // Intelligence boosting natures
  modest: {
    name: 'Modest',
    increasedStat: 'intelligence',
    decreasedStat: 'attack',
    description: 'Thoughtful and prefers strategy over brute force.'
  },
  mild: {
    name: 'Mild',
    increasedStat: 'intelligence',
    decreasedStat: 'defense',
    description: 'Gentle but very clever.'
  },
  quiet: {
    name: 'Quiet',
    increasedStat: 'intelligence',
    decreasedStat: 'speed',
    description: 'Contemplative and moves deliberately.'
  },
  rash: {
    name: 'Rash',
    increasedStat: 'intelligence',
    decreasedStat: 'defense',
    description: 'Quick-thinking but acts without considering defense.'
  },

  // Stamina boosting natures
  careful: {
    name: 'Careful',
    increasedStat: 'stamina',
    decreasedStat: 'intelligence',
    description: 'Cautious and has great endurance.'
  },
  calm: {
    name: 'Calm',
    increasedStat: 'stamina',
    decreasedStat: 'attack',
    description: 'Peaceful and has incredible staying power.'
  },
  gentle: {
    name: 'Gentle',
    increasedStat: 'stamina',
    decreasedStat: 'defense',
    description: 'Kind-hearted with remarkable endurance.'
  },
  sassy: {
    name: 'Sassy',
    increasedStat: 'stamina',
    decreasedStat: 'speed',
    description: 'Confident and can outlast any opponent.'
  },

  // Neutral natures (no stat changes)
  hardy: {
    name: 'Hardy',
    increasedStat: 'attack',
    decreasedStat: 'attack',
    description: 'Well-balanced in all aspects.'
  },
  docile: {
    name: 'Docile',
    increasedStat: 'defense',
    decreasedStat: 'defense',
    description: 'Easy-going and adaptable.'
  },
  serious: {
    name: 'Serious',
    increasedStat: 'speed',
    decreasedStat: 'speed',
    description: 'Focused and determined.'
  },
  bashful: {
    name: 'Bashful',
    increasedStat: 'intelligence',
    decreasedStat: 'intelligence',
    description: 'Shy but well-rounded.'
  },
  quirky: {
    name: 'Quirky',
    increasedStat: 'stamina',
    decreasedStat: 'stamina',
    description: 'Unique and unpredictable.'
  }
};

/**
 * Base stats for different animal categories
 */
export const BASE_STATS_BY_HABITAT: Record<HabitatType, AnimalStats> = {
  [HabitatType.FOREST]: {
    health: 70,
    maxHealth: 70,
    attack: 80,
    defense: 70,
    speed: 75,
    intelligence: 65,
    stamina: 70
  },
  [HabitatType.OCEAN]: {
    health: 80,
    maxHealth: 80,
    attack: 70,
    defense: 80,
    speed: 60,
    intelligence: 75,
    stamina: 85
  },
  [HabitatType.DESERT]: {
    health: 65,
    maxHealth: 65,
    attack: 75,
    defense: 85,
    speed: 70,
    intelligence: 70,
    stamina: 90
  },
  [HabitatType.ARCTIC]: {
    health: 85,
    maxHealth: 85,
    attack: 70,
    defense: 90,
    speed: 50,
    intelligence: 70,
    stamina: 80
  },
  [HabitatType.JUNGLE]: {
    health: 60,
    maxHealth: 60,
    attack: 85,
    defense: 60,
    speed: 90,
    intelligence: 80,
    stamina: 75
  },
  [HabitatType.GRASSLAND]: {
    health: 75,
    maxHealth: 75,
    attack: 85,
    defense: 65,
    speed: 85,
    intelligence: 60,
    stamina: 70
  },
  [HabitatType.MOUNTAIN]: {
    health: 70,
    maxHealth: 70,
    attack: 75,
    defense: 75,
    speed: 95,
    intelligence: 85,
    stamina: 65
  }
};

/**
 * Stats system for managing animal statistics
 */
export class StatsSystem {
  /**
   * Calculate final stats for an animal based on base stats, level, IVs, and nature
   */
  public static calculateStats(
    baseStats: AnimalStats,
    level: number,
    individualValues: IndividualValues,
    nature: AnimalNature
  ): AnimalStats {
    const calculateStat = (
      baseStat: number,
      iv: number,
      level: number,
      natureMod: number = 1.0
    ): number => {
      return Math.floor(((2 * baseStat + iv) * level / 100 + 5) * natureMod);
    };

    const getNatureMultiplier = (statName: string): number => {
      if (nature.increasedStat === statName) return 1.1;
      if (nature.decreasedStat === statName) return 0.9;
      return 1.0;
    };

    // Health is calculated differently (no nature modifier)
    const health = Math.floor((2 * baseStats.health + individualValues.health) * level / 100 + level + 10);

    return {
      health,
      maxHealth: health,
      attack: calculateStat(baseStats.attack, individualValues.attack, level, getNatureMultiplier('attack')),
      defense: calculateStat(baseStats.defense, individualValues.defense, level, getNatureMultiplier('defense')),
      speed: calculateStat(baseStats.speed, individualValues.speed, level, getNatureMultiplier('speed')),
      intelligence: calculateStat(baseStats.intelligence, individualValues.intelligence, level, getNatureMultiplier('intelligence')),
      stamina: calculateStat(baseStats.stamina, individualValues.stamina, level, getNatureMultiplier('stamina'))
    };
  }

  /**
   * Generate random individual values (0-31 for each stat)
   */
  public static generateRandomIVs(): IndividualValues {
    return {
      health: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32),
      intelligence: Math.floor(Math.random() * 32),
      stamina: Math.floor(Math.random() * 32)
    };
  }

  /**
   * Generate perfect IVs (31 in all stats) - for special animals
   */
  public static generatePerfectIVs(): IndividualValues {
    return {
      health: 31,
      attack: 31,
      defense: 31,
      speed: 31,
      intelligence: 31,
      stamina: 31
    };
  }

  /**
   * Get a random nature
   */
  public static getRandomNature(): AnimalNature {
    const natures = Object.values(ANIMAL_NATURES);
    return natures[Math.floor(Math.random() * natures.length)];
  }

  /**
   * Get base stats for an animal based on its primary habitat
   */
  public static getBaseStats(primaryHabitat: HabitatType): AnimalStats {
    return { ...BASE_STATS_BY_HABITAT[primaryHabitat] };
  }

  /**
   * Calculate stat modifier based on stat changes during battle
   */
  public static calculateStatModifier(stages: number): number {
    const modifiers = [0.25, 0.28, 0.33, 0.4, 0.5, 0.66, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    const index = Math.max(0, Math.min(12, stages + 6));
    return modifiers[index];
  }

  /**
   * Apply stat changes to an animal (for battle effects)
   */
  public static applyStatChanges(animal: Animal, statChanges: Record<string, number>): void {
    // This would be used during battles to temporarily modify stats
    // Implementation would depend on how we track temporary stat changes
    console.log(`Applying stat changes to ${animal.name}:`, statChanges);
  }

  /**
   * Calculate experience needed for next level
   */
  public static getExperienceForLevel(level: number): number {
    // Using a medium-slow experience curve
    if (level <= 1) return 0;
    return Math.floor(1.2 * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140);
  }

  /**
   * Calculate level from experience
   */
  public static getLevelFromExperience(experience: number): number {
    let level = 1;
    while (level < 100 && this.getExperienceForLevel(level + 1) <= experience) {
      level++;
    }
    return level;
  }

  /**
   * Level up an animal and recalculate stats
   */
  public static levelUpAnimal(animal: Animal): boolean {
    const newLevel = this.getLevelFromExperience(animal.experience);
    
    if (newLevel > animal.level) {
      const oldLevel = animal.level;
      animal.level = newLevel;
      
      // Recalculate stats based on new level
      const baseStats = this.getBaseStats(animal.type[0]);
      const newStats = this.calculateStats(baseStats, newLevel, animal.individualValues, animal.nature);
      
      // Maintain current health percentage
      const healthPercent = animal.stats.health / animal.stats.maxHealth;
      animal.stats = newStats;
      animal.stats.health = Math.floor(animal.stats.maxHealth * healthPercent);
      
      return true; // Level up occurred
    }
    
    return false; // No level up
  }

  /**
   * Get stat total for comparing animal strength
   */
  public static getStatTotal(stats: AnimalStats): number {
    return stats.maxHealth + stats.attack + stats.defense + stats.speed + stats.intelligence + stats.stamina;
  }

  /**
   * Compare two animals' overall strength
   */
  public static compareStrength(animal1: Animal, animal2: Animal): number {
    const total1 = this.getStatTotal(animal1.stats);
    const total2 = this.getStatTotal(animal2.stats);
    return total1 - total2;
  }

  /**
   * Get stat grade (S, A, B, C, D, F) based on stat value
   */
  public static getStatGrade(statValue: number, level: number): string {
    const normalizedStat = statValue / level; // Normalize by level
    
    if (normalizedStat >= 2.0) return 'S';
    if (normalizedStat >= 1.7) return 'A';
    if (normalizedStat >= 1.4) return 'B';
    if (normalizedStat >= 1.1) return 'C';
    if (normalizedStat >= 0.8) return 'D';
    return 'F';
  }

  /**
   * Get overall grade for an animal
   */
  public static getOverallGrade(animal: Animal): string {
    const total = this.getStatTotal(animal.stats);
    const normalizedTotal = total / animal.level;
    
    if (normalizedTotal >= 12.0) return 'S';
    if (normalizedTotal >= 10.0) return 'A';
    if (normalizedTotal >= 8.0) return 'B';
    if (normalizedTotal >= 6.5) return 'C';
    if (normalizedTotal >= 5.0) return 'D';
    return 'F';
  }
}