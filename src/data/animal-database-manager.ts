import { AnimalSpecies, ConservationStatus } from '../types/animal.js';
import { HabitatType, Rarity } from '../types/common.js';
import { ANIMAL_DATABASE, ADDITIONAL_ANIMALS } from './animal-database.js';
import { ALL_EXTENDED_ANIMALS } from './extended-animals.js';
import { ALL_MEGA_FAUNA } from './mega-fauna.js';

// Complete animal database with 500+ species
export class AnimalDatabaseManager {
  private static instance: AnimalDatabaseManager;
  private allAnimals: AnimalSpecies[];
  private animalMap: Map<string, AnimalSpecies>;
  private habitatIndex: Map<HabitatType, AnimalSpecies[]>;
  private rarityIndex: Map<Rarity, AnimalSpecies[]>;
  private conservationIndex: Map<ConservationStatus, AnimalSpecies[]>;

  private constructor() {
    this.allAnimals = [
      ...ANIMAL_DATABASE,
      ...ADDITIONAL_ANIMALS,
      ...ALL_EXTENDED_ANIMALS,
      ...ALL_MEGA_FAUNA
    ];
    
    this.animalMap = new Map();
    this.habitatIndex = new Map();
    this.rarityIndex = new Map();
    this.conservationIndex = new Map();
    
    this.buildIndexes();
  }

  public static getInstance(): AnimalDatabaseManager {
    if (!AnimalDatabaseManager.instance) {
      AnimalDatabaseManager.instance = new AnimalDatabaseManager();
    }
    return AnimalDatabaseManager.instance;
  }

  private buildIndexes(): void {
    // Build animal map for quick ID lookup
    this.allAnimals.forEach(animal => {
      this.animalMap.set(animal.id, animal);
    });

    // Build habitat index
    Object.values(HabitatType).forEach(habitat => {
      this.habitatIndex.set(habitat, []);
    });
    
    this.allAnimals.forEach(animal => {
      animal.habitat.forEach(habitat => {
        const habitatAnimals = this.habitatIndex.get(habitat) || [];
        habitatAnimals.push(animal);
        this.habitatIndex.set(habitat, habitatAnimals);
      });
    });

    // Build rarity index
    Object.values(Rarity).forEach(rarity => {
      this.rarityIndex.set(rarity, []);
    });
    
    this.allAnimals.forEach(animal => {
      const rarityAnimals = this.rarityIndex.get(animal.rarity) || [];
      rarityAnimals.push(animal);
      this.rarityIndex.set(animal.rarity, rarityAnimals);
    });

    // Build conservation status index
    Object.values(ConservationStatus).forEach(status => {
      this.conservationIndex.set(status, []);
    });
    
    this.allAnimals.forEach(animal => {
      const statusAnimals = this.conservationIndex.get(animal.conservationStatus) || [];
      statusAnimals.push(animal);
      this.conservationIndex.set(animal.conservationStatus, statusAnimals);
    });
  }

  // Core retrieval methods
  public getAnimalById(id: string): AnimalSpecies | undefined {
    return this.animalMap.get(id);
  }

  public getAllAnimals(): AnimalSpecies[] {
    return [...this.allAnimals];
  }

  public getAnimalCount(): number {
    return this.allAnimals.length;
  }

  // Habitat-based queries
  public getAnimalsByHabitat(habitat: HabitatType): AnimalSpecies[] {
    return [...(this.habitatIndex.get(habitat) || [])];
  }

  public getRandomAnimalByHabitat(habitat: HabitatType): AnimalSpecies | undefined {
    const habitatAnimals = this.getAnimalsByHabitat(habitat);
    if (habitatAnimals.length === 0) return undefined;
    return habitatAnimals[Math.floor(Math.random() * habitatAnimals.length)];
  }

  // Rarity-based queries
  public getAnimalsByRarity(rarity: Rarity): AnimalSpecies[] {
    return [...(this.rarityIndex.get(rarity) || [])];
  }

  public getRandomAnimalByRarity(rarity: Rarity): AnimalSpecies | undefined {
    const rarityAnimals = this.getAnimalsByRarity(rarity);
    if (rarityAnimals.length === 0) return undefined;
    return rarityAnimals[Math.floor(Math.random() * rarityAnimals.length)];
  }

  // Conservation status queries
  public getAnimalsByConservationStatus(status: ConservationStatus): AnimalSpecies[] {
    return [...(this.conservationIndex.get(status) || [])];
  }

  public getEndangeredAnimals(): AnimalSpecies[] {
    return [
      ...this.getAnimalsByConservationStatus(ConservationStatus.VULNERABLE),
      ...this.getAnimalsByConservationStatus(ConservationStatus.ENDANGERED),
      ...this.getAnimalsByConservationStatus(ConservationStatus.CRITICALLY_ENDANGERED)
    ];
  }

  // Advanced queries
  public getAnimalsByHabitatAndRarity(habitat: HabitatType, rarity: Rarity): AnimalSpecies[] {
    return this.getAnimalsByHabitat(habitat).filter(animal => animal.rarity === rarity);
  }

  public searchAnimalsByName(query: string): AnimalSpecies[] {
    const lowerQuery = query.toLowerCase();
    return this.allAnimals.filter(animal => 
      animal.name.toLowerCase().includes(lowerQuery) ||
      animal.scientificName.toLowerCase().includes(lowerQuery)
    );
  }

  // Random selection with weighted rarity
  public getRandomAnimalWithRarityWeights(): AnimalSpecies {
    const rarityWeights = {
      [Rarity.COMMON]: 50,
      [Rarity.UNCOMMON]: 30,
      [Rarity.RARE]: 15,
      [Rarity.LEGENDARY]: 5
    };

    const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      random -= weight;
      if (random <= 0) {
        const rarityAnimals = this.getAnimalsByRarity(rarity as Rarity);
        if (rarityAnimals.length > 0) {
          return rarityAnimals[Math.floor(Math.random() * rarityAnimals.length)];
        }
      }
    }

    // Fallback to any random animal
    return this.allAnimals[Math.floor(Math.random() * this.allAnimals.length)];
  }

  // Habitat-specific weighted random selection
  public getRandomAnimalByHabitatWithWeights(habitat: HabitatType): AnimalSpecies | undefined {
    const habitatAnimals = this.getAnimalsByHabitat(habitat);
    if (habitatAnimals.length === 0) return undefined;

    const rarityWeights = {
      [Rarity.COMMON]: 50,
      [Rarity.UNCOMMON]: 30,
      [Rarity.RARE]: 15,
      [Rarity.LEGENDARY]: 5
    };

    // Filter habitat animals by rarity and apply weights
    const weightedAnimals: { animal: AnimalSpecies; weight: number }[] = [];
    
    habitatAnimals.forEach(animal => {
      const weight = rarityWeights[animal.rarity] || 1;
      weightedAnimals.push({ animal, weight });
    });

    const totalWeight = weightedAnimals.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weightedAnimals) {
      random -= item.weight;
      if (random <= 0) {
        return item.animal;
      }
    }

    // Fallback
    return habitatAnimals[Math.floor(Math.random() * habitatAnimals.length)];
  }

  // Evolution chain helpers
  public getEvolutionChain(animalId: string): AnimalSpecies[] {
    const animal = this.getAnimalById(animalId);
    if (!animal || !animal.evolutionChain) return [animal].filter(Boolean);

    const chain: AnimalSpecies[] = [];
    
    // Find the base of the evolution chain
    let current = animal;
    while (current.evolutionChain?.previousEvolution) {
      const previous = this.getAnimalById(current.evolutionChain.previousEvolution.speciesId);
      if (previous) {
        chain.unshift(previous);
        current = previous;
      } else {
        break;
      }
    }

    // Add current animal
    chain.push(animal);

    // Add evolutions
    current = animal;
    while (current.evolutionChain?.nextEvolution) {
      const next = this.getAnimalById(current.evolutionChain.nextEvolution.speciesId);
      if (next) {
        chain.push(next);
        current = next;
      } else {
        break;
      }
    }

    return chain;
  }

  // Statistics and analytics
  public getDatabaseStatistics() {
    const stats = {
      totalAnimals: this.allAnimals.length,
      byHabitat: {} as Record<string, number>,
      byRarity: {} as Record<string, number>,
      byConservationStatus: {} as Record<string, number>,
      evolutionChains: 0,
      averageBaseStatTotal: 0
    };

    // Count by habitat
    Object.values(HabitatType).forEach(habitat => {
      stats.byHabitat[habitat] = this.getAnimalsByHabitat(habitat).length;
    });

    // Count by rarity
    Object.values(Rarity).forEach(rarity => {
      stats.byRarity[rarity] = this.getAnimalsByRarity(rarity).length;
    });

    // Count by conservation status
    Object.values(ConservationStatus).forEach(status => {
      stats.byConservationStatus[status] = this.getAnimalsByConservationStatus(status).length;
    });

    // Count evolution chains
    stats.evolutionChains = this.allAnimals.filter(animal => 
      animal.evolutionChain?.nextEvolution || animal.evolutionChain?.previousEvolution
    ).length;

    // Calculate average base stat total
    const totalStats = this.allAnimals.reduce((sum, animal) => {
      const statTotal = animal.baseStats.health + animal.baseStats.attack + 
                       animal.baseStats.defense + animal.baseStats.speed + 
                       animal.baseStats.intelligence + animal.baseStats.stamina;
      return sum + statTotal;
    }, 0);
    stats.averageBaseStatTotal = Math.round(totalStats / this.allAnimals.length);

    return stats;
  }

  // Validation methods
  public validateDatabase(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate IDs
    const ids = new Set<string>();
    this.allAnimals.forEach(animal => {
      if (ids.has(animal.id)) {
        errors.push(`Duplicate animal ID: ${animal.id}`);
      }
      ids.add(animal.id);
    });

    // Check evolution chain integrity
    this.allAnimals.forEach(animal => {
      if (animal.evolutionChain?.nextEvolution) {
        const nextAnimal = this.getAnimalById(animal.evolutionChain.nextEvolution.speciesId);
        if (!nextAnimal) {
          errors.push(`Invalid evolution chain: ${animal.id} -> ${animal.evolutionChain.nextEvolution.speciesId}`);
        }
      }
      if (animal.evolutionChain?.previousEvolution) {
        const prevAnimal = this.getAnimalById(animal.evolutionChain.previousEvolution.speciesId);
        if (!prevAnimal) {
          errors.push(`Invalid evolution chain: ${animal.evolutionChain.previousEvolution.speciesId} -> ${animal.id}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const animalDatabase = AnimalDatabaseManager.getInstance();

// Export convenience functions
export function getAnimalById(id: string): AnimalSpecies | undefined {
  return animalDatabase.getAnimalById(id);
}

export function getAnimalsByHabitat(habitat: HabitatType): AnimalSpecies[] {
  return animalDatabase.getAnimalsByHabitat(habitat);
}

export function getRandomAnimalByHabitat(habitat: HabitatType): AnimalSpecies | undefined {
  return animalDatabase.getRandomAnimalByHabitatWithWeights(habitat);
}

export function getAllAnimals(): AnimalSpecies[] {
  return animalDatabase.getAllAnimals();
}

export function getAnimalCount(): number {
  return animalDatabase.getAnimalCount();
}

export function getDatabaseStatistics() {
  return animalDatabase.getDatabaseStatistics();
}