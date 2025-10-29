import { Animal, AnimalSpecies, IndividualValues, generateRandomIVs, AnimalNature } from '../types/animal.js';
import { animalDatabase } from '../data/animal-database-manager.js';

export interface BreedingResult {
  success: boolean;
  egg?: Animal;
  error?: string;
  incompatibilityReason?: string;
}

export interface BreedingPair {
  parent1: Animal;
  parent2: Animal;
  compatibility: number;
  possibleOffspring: string[];
}

export enum BreedingCompatibility {
  INCOMPATIBLE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  PERFECT = 4
}

export class BreedingSystem {
  /**
   * Check if two animals can breed
   */
  public static canBreed(animal1: Animal, animal2: Animal): boolean {
    // Basic breeding rules
    if (animal1.id === animal2.id) return false; // Same animal
    if (animal1.level < 15 || animal2.level < 15) return false; // Minimum level
    if (animal1.friendship < 50 || animal2.friendship < 50) return false; // Minimum friendship
    
    return this.getBreedingCompatibility(animal1, animal2) > BreedingCompatibility.INCOMPATIBLE;
  }

  /**
   * Calculate breeding compatibility between two animals
   */
  public static getBreedingCompatibility(animal1: Animal, animal2: Animal): BreedingCompatibility {
    const species1 = animalDatabase.getAnimalById(animal1.speciesId);
    const species2 = animalDatabase.getAnimalById(animal2.speciesId);
    
    if (!species1 || !species2) return BreedingCompatibility.INCOMPATIBLE;

    // Same species - high compatibility
    if (species1.id === species2.id) {
      return BreedingCompatibility.HIGH;
    }

    // Same habitat types - medium compatibility
    const sharedHabitats = species1.habitat.filter(h => species2.habitat.includes(h));
    if (sharedHabitats.length > 0) {
      return sharedHabitats.length >= 2 ? BreedingCompatibility.MEDIUM : BreedingCompatibility.LOW;
    }

    // Different habitats but similar conservation status - low compatibility
    if (species1.conservationStatus === species2.conservationStatus) {
      return BreedingCompatibility.LOW;
    }

    return BreedingCompatibility.INCOMPATIBLE;
  }

  /**
   * Breed two animals to create an egg
   */
  public static breedAnimals(parent1: Animal, parent2: Animal): BreedingResult {
    try {
      if (!this.canBreed(parent1, parent2)) {
        return {
          success: false,
          error: 'Animals cannot breed',
          incompatibilityReason: this.getIncompatibilityReason(parent1, parent2)
        };
      }

      const compatibility = this.getBreedingCompatibility(parent1, parent2);
      const offspringSpecies = this.determineOffspringSpecies(parent1, parent2, compatibility);
      
      if (!offspringSpecies) {
        return {
          success: false,
          error: 'Could not determine offspring species'
        };
      }

      const egg = this.createEgg(parent1, parent2, offspringSpecies);
      
      return {
        success: true,
        egg
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Breeding failed'
      };
    }
  }

  /**
   * Determine the species of the offspring
   */
  private static determineOffspringSpecies(
    parent1: Animal,
    parent2: Animal,
    compatibility: BreedingCompatibility
  ): AnimalSpecies | null {
    const species1 = animalDatabase.getAnimalById(parent1.speciesId);
    const species2 = animalDatabase.getAnimalById(parent2.speciesId);
    
    if (!species1 || !species2) return null;

    // Same species - offspring is same species
    if (species1.id === species2.id) {
      return species1;
    }

    // Different species - chance for hybrid or one of the parents
    const hybridChance = compatibility * 0.1; // 10% per compatibility level
    
    if (Math.random() < hybridChance) {
      // Try to find a hybrid species (this would need to be defined in the database)
      const hybridSpecies = this.findHybridSpecies(species1, species2);
      if (hybridSpecies) return hybridSpecies;
    }

    // Default to one of the parent species (50/50 chance)
    return Math.random() < 0.5 ? species1 : species2;
  }

  /**
   * Find hybrid species for two parent species
   */
  private static findHybridSpecies(species1: AnimalSpecies, species2: AnimalSpecies): AnimalSpecies | null {
    // This would need to be implemented based on the animal database
    // For now, return null (no hybrids available)
    return null;
  }

  /**
   * Create an egg from two parent animals
   */
  private static createEgg(parent1: Animal, parent2: Animal, species: AnimalSpecies): Animal {
    const inheritedIVs = this.inheritIVs(parent1.individualValues, parent2.individualValues);
    const inheritedNature = this.inheritNature(parent1.nature, parent2.nature);
    const inheritedMoves = this.inheritMoves(parent1, parent2);

    const egg: Animal = {
      id: `egg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      speciesId: species.id,
      name: species.name,
      level: 1,
      experience: 0,
      stats: {
        health: 1,
        maxHealth: 1,
        attack: 1,
        defense: 1,
        speed: 1,
        intelligence: 1,
        stamina: 1
      },
      moves: inheritedMoves,
      type: species.habitat,
      rarity: species.rarity,
      shiny: this.determineShinyChance(parent1, parent2),
      evolutionStage: 0,
      captureDate: new Date(),
      trainerId: parent1.trainerId,
      individualValues: inheritedIVs,
      nature: inheritedNature,
      friendship: 0,
      isEgg: true,
      breedingData: {
        parentIds: [parent1.id, parent2.id],
        eggSteps: this.calculateEggSteps(species),
        inheritedMoves: inheritedMoves.map(m => m.id)
      }
    };

    return egg;
  }

  /**
   * Inherit IVs from parents
   */
  private static inheritIVs(parent1IVs: IndividualValues, parent2IVs: IndividualValues): IndividualValues {
    const inherited: IndividualValues = {
      health: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      intelligence: 0,
      stamina: 0
    };

    // Each stat has a 50% chance to come from either parent
    const stats: (keyof IndividualValues)[] = ['health', 'attack', 'defense', 'speed', 'intelligence', 'stamina'];
    
    stats.forEach(stat => {
      inherited[stat] = Math.random() < 0.5 ? parent1IVs[stat] : parent2IVs[stat];
    });

    return inherited;
  }

  /**
   * Inherit nature from parents
   */
  private static inheritNature(parent1Nature: AnimalNature, parent2Nature: AnimalNature): AnimalNature {
    // 50% chance to inherit from either parent
    return Math.random() < 0.5 ? parent1Nature : parent2Nature;
  }

  /**
   * Inherit moves from parents
   */
  private static inheritMoves(parent1: Animal, parent2: Animal): Animal['moves'] {
    const inheritedMoves: Animal['moves'] = [];
    const allParentMoves = [...parent1.moves, ...parent2.moves];
    
    // Remove duplicates
    const uniqueMoves = allParentMoves.filter((move, index, self) => 
      index === self.findIndex(m => m.id === move.id)
    );

    // Randomly select up to 2 moves from parents
    const shuffled = uniqueMoves.sort(() => Math.random() - 0.5);
    inheritedMoves.push(...shuffled.slice(0, 2));

    return inheritedMoves;
  }

  /**
   * Determine if offspring will be shiny
   */
  private static determineShinyChance(parent1: Animal, parent2: Animal): boolean {
    let shinyChance = 1 / 4096; // Base shiny chance

    // Increase chance if either parent is shiny
    if (parent1.shiny || parent2.shiny) {
      shinyChance = 1 / 512;
    }

    // Increase chance if both parents are shiny
    if (parent1.shiny && parent2.shiny) {
      shinyChance = 1 / 64;
    }

    return Math.random() < shinyChance;
  }

  /**
   * Calculate steps required to hatch egg
   */
  private static calculateEggSteps(species: AnimalSpecies): number {
    const baseSteps = 1000;
    const rarityMultiplier = {
      common: 1,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2,
      legendary: 3
    };

    return Math.floor(baseSteps * rarityMultiplier[species.rarity]);
  }

  /**
   * Get incompatibility reason for display
   */
  private static getIncompatibilityReason(animal1: Animal, animal2: Animal): string {
    if (animal1.id === animal2.id) return 'Cannot breed with itself';
    if (animal1.level < 15) return `${animal1.name} is too young (level ${animal1.level}/15)`;
    if (animal2.level < 15) return `${animal2.name} is too young (level ${animal2.level}/15)`;
    if (animal1.friendship < 50) return `${animal1.name} friendship too low (${animal1.friendship}/50)`;
    if (animal2.friendship < 50) return `${animal2.name} friendship too low (${animal2.friendship}/50)`;
    
    const compatibility = this.getBreedingCompatibility(animal1, animal2);
    if (compatibility === BreedingCompatibility.INCOMPATIBLE) {
      return 'Species are not compatible for breeding';
    }

    return 'Unknown incompatibility';
  }

  /**
   * Hatch an egg
   */
  public static hatchEgg(egg: Animal): Animal {
    if (!egg.isEgg) {
      throw new Error('Animal is not an egg');
    }

    const species = animalDatabase.getAnimalById(egg.speciesId);
    if (!species) {
      throw new Error('Species not found for egg');
    }

    // Calculate proper stats for level 1
    const stats = {
      health: Math.floor(species.baseStats.health * 0.3) + 10,
      maxHealth: Math.floor(species.baseStats.health * 0.3) + 10,
      attack: Math.floor(species.baseStats.attack * 0.3) + 5,
      defense: Math.floor(species.baseStats.defense * 0.3) + 5,
      speed: Math.floor(species.baseStats.speed * 0.3) + 5,
      intelligence: Math.floor(species.baseStats.intelligence * 0.3) + 5,
      stamina: Math.floor(species.baseStats.stamina * 0.3) + 5
    };

    const hatchedAnimal: Animal = {
      ...egg,
      id: `hatched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stats,
      friendship: 20, // Start with some friendship
      isEgg: false,
      breedingData: {
        ...egg.breedingData!,
        hatchDate: new Date()
      }
    };

    return hatchedAnimal;
  }

  /**
   * Get breeding pair information
   */
  public static getBreedingPairInfo(animal1: Animal, animal2: Animal): BreedingPair {
    const compatibility = this.getBreedingCompatibility(animal1, animal2);
    const possibleOffspring = this.getPossibleOffspring(animal1, animal2);

    return {
      parent1: animal1,
      parent2: animal2,
      compatibility,
      possibleOffspring
    };
  }

  /**
   * Get possible offspring species IDs
   */
  private static getPossibleOffspring(animal1: Animal, animal2: Animal): string[] {
    const species1 = animalDatabase.getAnimalById(animal1.speciesId);
    const species2 = animalDatabase.getAnimalById(animal2.speciesId);
    
    if (!species1 || !species2) return [];

    const offspring: string[] = [];

    // Always possible to get either parent species
    offspring.push(species1.id);
    if (species1.id !== species2.id) {
      offspring.push(species2.id);
    }

    // Add potential hybrid species
    const hybrid = this.findHybridSpecies(species1, species2);
    if (hybrid) {
      offspring.push(hybrid.id);
    }

    return offspring;
  }
}