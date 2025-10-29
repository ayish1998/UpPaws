import { Animal, AnimalSpecies, EvolutionRequirement } from '../types/animal.js';
import { animalDatabase } from '../data/animal-database-manager.js';

export interface EvolutionResult {
  success: boolean;
  evolvedAnimal?: Animal;
  missingRequirements?: string[];
  error?: string;
}

export class EvolutionSystem {
  /**
   * Check if an animal can evolve
   */
  public static canEvolve(animal: Animal): boolean {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species || !species.evolutionChain?.nextEvolution) {
      return false;
    }

    const requirements = species.evolutionChain.nextEvolution.requirements;
    return this.checkEvolutionRequirements(animal, requirements);
  }

  /**
   * Get missing evolution requirements for an animal
   */
  public static getMissingRequirements(animal: Animal): string[] {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species || !species.evolutionChain?.nextEvolution) {
      return ['This animal cannot evolve'];
    }

    const requirements = species.evolutionChain.nextEvolution.requirements;
    const missing: string[] = [];

    requirements.forEach(requirement => {
      if (!this.checkSingleRequirement(animal, requirement)) {
        missing.push(requirement.description);
      }
    });

    return missing;
  }

  /**
   * Attempt to evolve an animal
   */
  public static evolveAnimal(animal: Animal): EvolutionResult {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species) {
      return { success: false, error: 'Animal species not found' };
    }

    if (!species.evolutionChain?.nextEvolution) {
      return { success: false, error: 'This animal cannot evolve' };
    }

    const requirements = species.evolutionChain.nextEvolution.requirements;
    const missingRequirements = this.getMissingRequirements(animal);

    if (missingRequirements.length > 0) {
      return { success: false, missingRequirements };
    }

    // Get the evolved species
    const evolvedSpecies = animalDatabase.getAnimalById(species.evolutionChain.nextEvolution.speciesId);
    if (!evolvedSpecies) {
      return { success: false, error: 'Evolved species not found' };
    }

    // Create evolved animal
    const evolvedAnimal = this.createEvolvedAnimal(animal, evolvedSpecies);
    
    return { success: true, evolvedAnimal };
  }

  /**
   * Check if all evolution requirements are met
   */
  private static checkEvolutionRequirements(animal: Animal, requirements: EvolutionRequirement[]): boolean {
    return requirements.every(requirement => this.checkSingleRequirement(animal, requirement));
  }

  /**
   * Check a single evolution requirement
   */
  private static checkSingleRequirement(animal: Animal, requirement: EvolutionRequirement): boolean {
    switch (requirement.type) {
      case 'level':
        return animal.level >= requirement.value;
      
      case 'friendship':
        return animal.friendship >= requirement.value;
      
      case 'battles_won':
        // This would need to be tracked in animal stats
        return true; // Placeholder
      
      case 'time_of_day':
        const currentHour = new Date().getHours();
        if (requirement.value === 'day') {
          return currentHour >= 6 && currentHour < 18;
        } else if (requirement.value === 'night') {
          return currentHour >= 18 || currentHour < 6;
        }
        return true;
      
      case 'location':
        // This would need habitat context
        return true; // Placeholder
      
      case 'item':
        // This would need to check trainer inventory
        return true; // Placeholder
      
      case 'trade':
        // Special evolution requirement
        return false; // Requires special handling
      
      default:
        console.warn(`Unknown evolution requirement type: ${requirement.type}`);
        return false;
    }
  }

  /**
   * Create an evolved animal from the original
   */
  private static createEvolvedAnimal(originalAnimal: Animal, evolvedSpecies: AnimalSpecies): Animal {
    // Calculate new stats based on evolution
    const statGrowth = this.calculateEvolutionStatGrowth(originalAnimal, evolvedSpecies);
    
    const evolvedAnimal: Animal = {
      ...originalAnimal,
      id: `${originalAnimal.id}_evolved_${Date.now()}`, // New unique ID
      speciesId: evolvedSpecies.id,
      name: evolvedSpecies.name,
      evolutionStage: originalAnimal.evolutionStage + 1,
      stats: statGrowth,
      type: evolvedSpecies.habitat,
      // Keep individual values and nature
      // Reset some properties
      experience: 0, // Reset experience for new evolution stage
      level: Math.max(1, originalAnimal.level), // Keep level or minimum 1
    };

    return evolvedAnimal;
  }

  /**
   * Calculate stat growth during evolution
   */
  private static calculateEvolutionStatGrowth(originalAnimal: Animal, evolvedSpecies: AnimalSpecies): typeof originalAnimal.stats {
    // Evolution typically provides a stat boost
    const evolutionMultiplier = 1.3; // 30% stat increase
    
    return {
      health: Math.floor(originalAnimal.stats.maxHealth * evolutionMultiplier),
      maxHealth: Math.floor(originalAnimal.stats.maxHealth * evolutionMultiplier),
      attack: Math.floor(originalAnimal.stats.attack * evolutionMultiplier),
      defense: Math.floor(originalAnimal.stats.defense * evolutionMultiplier),
      speed: Math.floor(originalAnimal.stats.speed * evolutionMultiplier),
      intelligence: Math.floor(originalAnimal.stats.intelligence * evolutionMultiplier),
      stamina: Math.floor(originalAnimal.stats.stamina * evolutionMultiplier)
    };
  }

  /**
   * Get evolution preview (what the animal would become)
   */
  public static getEvolutionPreview(animal: Animal): AnimalSpecies | null {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species || !species.evolutionChain?.nextEvolution) {
      return null;
    }

    return animalDatabase.getAnimalById(species.evolutionChain.nextEvolution.speciesId) || null;
  }

  /**
   * Get full evolution chain for an animal
   */
  public static getFullEvolutionChain(animal: Animal): AnimalSpecies[] {
    return animalDatabase.getEvolutionChain(animal.speciesId);
  }

  /**
   * Check if animal is at final evolution stage
   */
  public static isFullyEvolved(animal: Animal): boolean {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    return !species?.evolutionChain?.nextEvolution;
  }

  /**
   * Get evolution requirements text for display
   */
  public static getEvolutionRequirementsText(animal: Animal): string[] {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species || !species.evolutionChain?.nextEvolution) {
      return ['This animal cannot evolve'];
    }

    return species.evolutionChain.nextEvolution.requirements.map(req => req.description);
  }
}

// Evolution event types for the game
export enum EvolutionEvent {
  LEVEL_UP = 'level_up',
  FRIENDSHIP_REACHED = 'friendship_reached',
  BATTLE_WON = 'battle_won',
  TIME_BASED = 'time_based',
  LOCATION_BASED = 'location_based',
  ITEM_USED = 'item_used',
  TRADE_EVOLUTION = 'trade_evolution'
}

// Evolution animation and effects
export interface EvolutionAnimation {
  type: 'sparkle' | 'glow' | 'transform' | 'burst';
  duration: number;
  colors: string[];
  soundEffect?: string;
}

export const EVOLUTION_ANIMATIONS: Record<string, EvolutionAnimation> = {
  default: {
    type: 'sparkle',
    duration: 3000,
    colors: ['#FFD700', '#FFA500', '#FF69B4'],
    soundEffect: 'evolution_sparkle'
  },
  legendary: {
    type: 'burst',
    duration: 5000,
    colors: ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'],
    soundEffect: 'evolution_legendary'
  },
  shiny: {
    type: 'glow',
    duration: 4000,
    colors: ['#C0C0C0', '#FFD700', '#FFFFFF'],
    soundEffect: 'evolution_shiny'
  }
};