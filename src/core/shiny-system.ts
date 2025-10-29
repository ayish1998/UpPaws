import { Animal, AnimalSpecies } from '../types/animal.js';
import { Rarity } from '../types/common.js';

export interface ShinyVariant {
  id: string;
  name: string;
  description: string;
  colorScheme: string[];
  effectType: ShinyEffectType;
  statMultiplier: number;
  rarity: number; // Chance out of 1000000 (1 in a million base)
}

export enum ShinyEffectType {
  SPARKLE = 'sparkle',
  GLOW = 'glow',
  RAINBOW = 'rainbow',
  CRYSTAL = 'crystal',
  ETHEREAL = 'ethereal',
  GOLDEN = 'golden',
  SHADOW = 'shadow',
  PRISMATIC = 'prismatic'
}

export class ShinySystem {
  // Base shiny chance (1 in 4096, like modern Pokémon games)
  private static readonly BASE_SHINY_CHANCE = 1 / 4096;
  
  // Shiny charm multiplier (for premium players)
  private static readonly SHINY_CHARM_MULTIPLIER = 3;
  
  // Mastery bonus (for players who have caught many of the same species)
  private static readonly MASTERY_BONUS_MULTIPLIER = 2;

  /**
   * Determine if an encountered animal should be shiny
   */
  public static rollForShiny(
    speciesId: string, 
    hasShinyCharm: boolean = false,
    speciesMasteryLevel: number = 0
  ): boolean {
    let chance = this.BASE_SHINY_CHANCE;
    
    // Apply shiny charm bonus
    if (hasShinyCharm) {
      chance *= this.SHINY_CHARM_MULTIPLIER;
    }
    
    // Apply mastery bonus (every 100 caught of same species increases chance)
    const masteryBonus = Math.floor(speciesMasteryLevel / 100);
    if (masteryBonus > 0) {
      chance *= (1 + masteryBonus * 0.1); // 10% increase per mastery level
    }
    
    // Cap the maximum chance at 1 in 100
    chance = Math.min(chance, 0.01);
    
    return Math.random() < chance;
  }

  /**
   * Generate a shiny variant for an animal
   */
  public static generateShinyVariant(animal: Animal): Animal {
    if (animal.shiny) {
      return animal; // Already shiny
    }

    const shinyAnimal: Animal = {
      ...animal,
      shiny: true,
      // Boost stats by 20% for shiny variants
      stats: {
        health: Math.floor(animal.stats.health * 1.2),
        maxHealth: Math.floor(animal.stats.maxHealth * 1.2),
        attack: Math.floor(animal.stats.attack * 1.2),
        defense: Math.floor(animal.stats.defense * 1.2),
        speed: Math.floor(animal.stats.speed * 1.2),
        intelligence: Math.floor(animal.stats.intelligence * 1.2),
        stamina: Math.floor(animal.stats.stamina * 1.2)
      }
    };

    return shinyAnimal;
  }

  /**
   * Get shiny effect type based on animal rarity and species
   */
  public static getShinyEffect(animal: Animal): ShinyEffectType {
    // Legendary animals get special effects
    if (animal.rarity === Rarity.LEGENDARY) {
      const legendaryEffects = [
        ShinyEffectType.RAINBOW,
        ShinyEffectType.PRISMATIC,
        ShinyEffectType.ETHEREAL
      ];
      return legendaryEffects[Math.floor(Math.random() * legendaryEffects.length)];
    }

    // Rare animals get premium effects
    if (animal.rarity === Rarity.RARE) {
      const rareEffects = [
        ShinyEffectType.CRYSTAL,
        ShinyEffectType.GOLDEN,
        ShinyEffectType.GLOW
      ];
      return rareEffects[Math.floor(Math.random() * rareEffects.length)];
    }

    // Common and uncommon animals get basic effects
    const basicEffects = [
      ShinyEffectType.SPARKLE,
      ShinyEffectType.GLOW,
      ShinyEffectType.SHADOW
    ];
    return basicEffects[Math.floor(Math.random() * basicEffects.length)];
  }

  /**
   * Get shiny color scheme based on original animal
   */
  public static getShinyColorScheme(speciesId: string, effectType: ShinyEffectType): string[] {
    // Predefined color schemes for different effect types
    const colorSchemes: Record<ShinyEffectType, string[][]> = {
      [ShinyEffectType.SPARKLE]: [
        ['#FFD700', '#FFA500', '#FFFF00'], // Gold sparkles
        ['#C0C0C0', '#DCDCDC', '#F5F5F5'], // Silver sparkles
        ['#FF69B4', '#FF1493', '#DC143C']  // Pink sparkles
      ],
      [ShinyEffectType.GLOW]: [
        ['#00FFFF', '#0080FF', '#0040FF'], // Blue glow
        ['#00FF00', '#40FF40', '#80FF80'], // Green glow
        ['#FF4500', '#FF6347', '#FF8C00']  // Orange glow
      ],
      [ShinyEffectType.RAINBOW]: [
        ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
      ],
      [ShinyEffectType.CRYSTAL]: [
        ['#E6E6FA', '#DDA0DD', '#DA70D6'], // Lavender crystal
        ['#B0E0E6', '#87CEEB', '#87CEFA'], // Light blue crystal
        ['#F0E68C', '#FFD700', '#FFA500']  // Golden crystal
      ],
      [ShinyEffectType.ETHEREAL]: [
        ['#F8F8FF', '#E6E6FA', '#D8BFD8'], // Ghostly white
        ['#E0FFFF', '#AFEEEE', '#B0E0E6']  // Ethereal blue
      ],
      [ShinyEffectType.GOLDEN]: [
        ['#FFD700', '#FFA500', '#FF8C00', '#DAA520']
      ],
      [ShinyEffectType.SHADOW]: [
        ['#2F4F4F', '#696969', '#808080'], // Dark grays
        ['#4B0082', '#483D8B', '#6A5ACD']  // Dark purples
      ],
      [ShinyEffectType.PRISMATIC]: [
        ['#FF69B4', '#00CED1', '#98FB98', '#F0E68C', '#DDA0DD']
      ]
    };

    const schemes = colorSchemes[effectType];
    return schemes[Math.floor(Math.random() * schemes.length)];
  }

  /**
   * Calculate shiny encounter rate for display
   */
  public static calculateShinyRate(
    hasShinyCharm: boolean = false,
    speciesMasteryLevel: number = 0
  ): string {
    let chance = this.BASE_SHINY_CHANCE;
    
    if (hasShinyCharm) {
      chance *= this.SHINY_CHARM_MULTIPLIER;
    }
    
    const masteryBonus = Math.floor(speciesMasteryLevel / 100);
    if (masteryBonus > 0) {
      chance *= (1 + masteryBonus * 0.1);
    }
    
    chance = Math.min(chance, 0.01);
    
    const odds = Math.round(1 / chance);
    return `1 in ${odds.toLocaleString()}`;
  }

  /**
   * Get shiny hunting tips
   */
  public static getShinyHuntingTips(): string[] {
    return [
      'Shiny animals have a base encounter rate of 1 in 4,096',
      'Premium Trainer License includes a Shiny Charm that triples your odds',
      'Catching 100+ of the same species increases shiny odds by 10% per hundred',
      'Shiny animals have 20% higher stats than their normal counterparts',
      'Each shiny animal has unique visual effects based on its rarity',
      'Legendary shiny animals are extremely rare and highly sought after',
      'Shiny status is preserved through evolution',
      'Some special events may increase shiny encounter rates'
    ];
  }

  /**
   * Generate shiny animation data
   */
  public static getShinyAnimation(effectType: ShinyEffectType): {
    particles: number;
    duration: number;
    colors: string[];
    pattern: string;
  } {
    const animations = {
      [ShinyEffectType.SPARKLE]: {
        particles: 20,
        duration: 2000,
        colors: ['#FFD700', '#FFA500'],
        pattern: 'sparkle'
      },
      [ShinyEffectType.GLOW]: {
        particles: 15,
        duration: 3000,
        colors: ['#00FFFF', '#0080FF'],
        pattern: 'glow'
      },
      [ShinyEffectType.RAINBOW]: {
        particles: 30,
        duration: 4000,
        colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
        pattern: 'rainbow'
      },
      [ShinyEffectType.CRYSTAL]: {
        particles: 25,
        duration: 3500,
        colors: ['#E6E6FA', '#DDA0DD'],
        pattern: 'crystal'
      },
      [ShinyEffectType.ETHEREAL]: {
        particles: 18,
        duration: 5000,
        colors: ['#F8F8FF', '#E6E6FA'],
        pattern: 'ethereal'
      },
      [ShinyEffectType.GOLDEN]: {
        particles: 22,
        duration: 2500,
        colors: ['#FFD700', '#FFA500'],
        pattern: 'golden'
      },
      [ShinyEffectType.SHADOW]: {
        particles: 12,
        duration: 3000,
        colors: ['#2F4F4F', '#696969'],
        pattern: 'shadow'
      },
      [ShinyEffectType.PRISMATIC]: {
        particles: 35,
        duration: 4500,
        colors: ['#FF69B4', '#00CED1', '#98FB98', '#F0E68C', '#DDA0DD'],
        pattern: 'prismatic'
      }
    };

    return animations[effectType];
  }

  /**
   * Check if animal qualifies for shiny mastery bonus
   */
  public static getSpeciesMasteryLevel(speciesId: string, caughtCount: number): number {
    return Math.floor(caughtCount / 10); // Mastery level increases every 10 caught
  }

  /**
   * Generate shiny encounter message
   */
  public static getShinyEncounterMessage(animal: Animal): string {
    const messages = [
      `✨ A shiny ${animal.name} appeared! ✨`,
      `🌟 You encountered a rare shiny ${animal.name}! 🌟`,
      `💎 A sparkling ${animal.name} catches your eye! 💎`,
      `⭐ What's this? A shiny ${animal.name}! ⭐`,
      `🎆 A magnificent shiny ${animal.name} emerges! 🎆`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get shiny rarity description
   */
  public static getShinyRarityDescription(animal: Animal): string {
    if (animal.rarity === Rarity.LEGENDARY) {
      return 'Ultra Rare Shiny Legendary';
    } else if (animal.rarity === Rarity.RARE) {
      return 'Super Rare Shiny';
    } else if (animal.rarity === Rarity.UNCOMMON) {
      return 'Rare Shiny';
    } else {
      return 'Shiny Variant';
    }
  }
}

// Shiny collection achievements
export const SHINY_ACHIEVEMENTS = {
  FIRST_SHINY: {
    id: 'first_shiny',
    name: 'Shiny Hunter',
    description: 'Catch your first shiny animal',
    reward: 'Shiny Hunter Badge'
  },
  SHINY_COLLECTOR: {
    id: 'shiny_collector',
    name: 'Shiny Collector',
    description: 'Catch 10 different shiny animals',
    reward: 'Increased shiny encounter rate'
  },
  SHINY_MASTER: {
    id: 'shiny_master',
    name: 'Shiny Master',
    description: 'Catch 50 different shiny animals',
    reward: 'Shiny Master Title'
  },
  LEGENDARY_SHINY: {
    id: 'legendary_shiny',
    name: 'Legendary Shiny Hunter',
    description: 'Catch a shiny legendary animal',
    reward: 'Legendary Shiny Badge'
  }
};