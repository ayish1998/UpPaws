import { Animal, AnimalSpecies } from '../types/animal.js';
import { HabitatType, Rarity } from '../types/common.js';
import { AnimalStorage } from '../storage/animal-storage.js';
import { animalDatabase } from '../data/animal-database-manager.js';

export interface CollectionFilter {
  habitat?: HabitatType;
  rarity?: Rarity;
  shiny?: boolean;
  favorite?: boolean;
  level?: { min?: number; max?: number };
  name?: string;
  evolutionStage?: number;
}

export interface CollectionSort {
  field: 'name' | 'level' | 'captureDate' | 'rarity' | 'stats';
  direction: 'asc' | 'desc';
}

export interface CollectionStats {
  totalAnimals: number;
  uniqueSpecies: number;
  shinyCount: number;
  favoriteCount: number;
  averageLevel: number;
  completionPercentage: number;
  rarityBreakdown: Record<Rarity, number>;
  habitatBreakdown: Record<HabitatType, number>;
}

export interface AnimalWithMetadata extends Animal {
  isFavorite: boolean;
  nickname?: string;
  tags: string[];
  notes?: string;
  captureLocation?: string;
  captureMethod?: string;
}

export class CollectionManager {
  private animalStorage: AnimalStorage;
  private favorites: Set<string> = new Set();
  private nicknames: Map<string, string> = new Map();
  private tags: Map<string, string[]> = new Map();
  private notes: Map<string, string> = new Map();

  constructor(animalStorage: AnimalStorage) {
    this.animalStorage = animalStorage;
  }

  /**
   * Get trainer's complete collection with metadata
   */
  async getCollection(trainerId: string): Promise<AnimalWithMetadata[]> {
    try {
      const animals = await this.animalStorage.getTrainerAnimals(trainerId);
      await this.loadMetadata(trainerId);

      return animals.map(animal => this.addMetadata(animal));
    } catch (error) {
      console.error(`Error getting collection for trainer ${trainerId}:`, error);
      return [];
    }
  }

  /**
   * Get filtered and sorted collection
   */
  async getFilteredCollection(
    trainerId: string,
    filter?: CollectionFilter,
    sort?: CollectionSort
  ): Promise<AnimalWithMetadata[]> {
    let collection = await this.getCollection(trainerId);

    // Apply filters
    if (filter) {
      collection = this.applyFilters(collection, filter);
    }

    // Apply sorting
    if (sort) {
      collection = this.applySorting(collection, sort);
    }

    return collection;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(trainerId: string): Promise<CollectionStats> {
    const collection = await this.getCollection(trainerId);
    const totalSpeciesCount = animalDatabase.getAnimalCount();

    const uniqueSpecies = new Set(collection.map(animal => animal.speciesId)).size;
    const shinyCount = collection.filter(animal => animal.shiny).length;
    const favoriteCount = collection.filter(animal => animal.isFavorite).length;
    const averageLevel = collection.length > 0 
      ? collection.reduce((sum, animal) => sum + animal.level, 0) / collection.length 
      : 0;

    // Rarity breakdown
    const rarityBreakdown: Record<Rarity, number> = {
      [Rarity.COMMON]: 0,
      [Rarity.UNCOMMON]: 0,
      [Rarity.RARE]: 0,
      [Rarity.LEGENDARY]: 0
    };

    // Habitat breakdown
    const habitatBreakdown: Record<HabitatType, number> = {
      [HabitatType.FOREST]: 0,
      [HabitatType.OCEAN]: 0,
      [HabitatType.DESERT]: 0,
      [HabitatType.ARCTIC]: 0,
      [HabitatType.GRASSLAND]: 0,
      [HabitatType.MOUNTAIN]: 0,
      [HabitatType.WETLAND]: 0,
      [HabitatType.CAVE]: 0
    };

    collection.forEach(animal => {
      rarityBreakdown[animal.rarity]++;
      animal.type.forEach(habitat => {
        habitatBreakdown[habitat]++;
      });
    });

    return {
      totalAnimals: collection.length,
      uniqueSpecies,
      shinyCount,
      favoriteCount,
      averageLevel: Math.round(averageLevel * 10) / 10,
      completionPercentage: Math.round((uniqueSpecies / totalSpeciesCount) * 100 * 10) / 10,
      rarityBreakdown,
      habitatBreakdown
    };
  }

  /**
   * Add animal to favorites
   */
  async addToFavorites(trainerId: string, animalId: string): Promise<boolean> {
    try {
      this.favorites.add(animalId);
      await this.saveMetadata(trainerId);
      return true;
    } catch (error) {
      console.error(`Error adding animal ${animalId} to favorites:`, error);
      return false;
    }
  }

  /**
   * Remove animal from favorites
   */
  async removeFromFavorites(trainerId: string, animalId: string): Promise<boolean> {
    try {
      this.favorites.delete(animalId);
      await this.saveMetadata(trainerId);
      return true;
    } catch (error) {
      console.error(`Error removing animal ${animalId} from favorites:`, error);
      return false;
    }
  }

  /**
   * Set animal nickname
   */
  async setNickname(trainerId: string, animalId: string, nickname: string): Promise<boolean> {
    try {
      if (nickname.trim().length === 0) {
        this.nicknames.delete(animalId);
      } else {
        this.nicknames.set(animalId, nickname.trim());
      }
      await this.saveMetadata(trainerId);
      return true;
    } catch (error) {
      console.error(`Error setting nickname for animal ${animalId}:`, error);
      return false;
    }
  }

  /**
   * Add tags to animal
   */
  async addTags(trainerId: string, animalId: string, newTags: string[]): Promise<boolean> {
    try {
      const existingTags = this.tags.get(animalId) || [];
      const uniqueTags = [...new Set([...existingTags, ...newTags])];
      this.tags.set(animalId, uniqueTags);
      await this.saveMetadata(trainerId);
      return true;
    } catch (error) {
      console.error(`Error adding tags to animal ${animalId}:`, error);
      return false;
    }
  }

  /**
   * Remove tags from animal
   */
  async removeTags(trainerId: string, animalId: string, tagsToRemove: string[]): Promise<boolean> {
    try {
      const existingTags = this.tags.get(animalId) || [];
      const filteredTags = existingTags.filter(tag => !tagsToRemove.includes(tag));
      
      if (filteredTags.length === 0) {
        this.tags.delete(animalId);
      } else {
        this.tags.set(animalId, filteredTags);
      }
      
      await this.saveMetadata(trainerId);
      return true;
    } catch (error) {
      console.error(`Error removing tags from animal ${animalId}:`, error);
      return false;
    }
  }

  /**
   * Set notes for animal
   */
  async setNotes(trainerId: string, animalId: string, notes: string): Promise<boolean> {
    try {
      if (notes.trim().length === 0) {
        this.notes.delete(animalId);
      } else {
        this.notes.set(animalId, notes.trim());
      }
      await this.saveMetadata(trainerId);
      return true;
    } catch (error) {
      console.error(`Error setting notes for animal ${animalId}:`, error);
      return false;
    }
  }

  /**
   * Get animals by tag
   */
  async getAnimalsByTag(trainerId: string, tag: string): Promise<AnimalWithMetadata[]> {
    const collection = await this.getCollection(trainerId);
    return collection.filter(animal => animal.tags.includes(tag));
  }

  /**
   * Get all tags used in collection
   */
  async getAllTags(trainerId: string): Promise<string[]> {
    await this.loadMetadata(trainerId);
    const allTags = new Set<string>();
    
    this.tags.forEach(tags => {
      tags.forEach(tag => allTags.add(tag));
    });
    
    return Array.from(allTags).sort();
  }

  /**
   * Get completion status for each habitat
   */
  async getHabitatCompletion(trainerId: string): Promise<Record<HabitatType, { caught: number; total: number; percentage: number }>> {
    const collection = await this.getCollection(trainerId);
    const caughtSpecies = new Set(collection.map(animal => animal.speciesId));
    
    const completion: Record<HabitatType, { caught: number; total: number; percentage: number }> = {} as any;
    
    Object.values(HabitatType).forEach(habitat => {
      const habitatSpecies = animalDatabase.getAnimalsByHabitat(habitat);
      const caughtInHabitat = habitatSpecies.filter(species => caughtSpecies.has(species.id)).length;
      
      completion[habitat] = {
        caught: caughtInHabitat,
        total: habitatSpecies.length,
        percentage: Math.round((caughtInHabitat / habitatSpecies.length) * 100)
      };
    });
    
    return completion;
  }

  /**
   * Get rarity completion status
   */
  async getRarityCompletion(trainerId: string): Promise<Record<Rarity, { caught: number; total: number; percentage: number }>> {
    const collection = await this.getCollection(trainerId);
    const caughtSpecies = new Set(collection.map(animal => animal.speciesId));
    
    const completion: Record<Rarity, { caught: number; total: number; percentage: number }> = {} as any;
    
    Object.values(Rarity).forEach(rarity => {
      const raritySpecies = animalDatabase.getAnimalsByRarity(rarity);
      const caughtInRarity = raritySpecies.filter(species => caughtSpecies.has(species.id)).length;
      
      completion[rarity] = {
        caught: caughtInRarity,
        total: raritySpecies.length,
        percentage: Math.round((caughtInRarity / raritySpecies.length) * 100)
      };
    });
    
    return completion;
  }

  /**
   * Get missing animals for completion
   */
  async getMissingAnimals(trainerId: string, habitat?: HabitatType, rarity?: Rarity): Promise<AnimalSpecies[]> {
    const collection = await this.getCollection(trainerId);
    const caughtSpecies = new Set(collection.map(animal => animal.speciesId));
    
    let allSpecies = animalDatabase.getAllAnimals();
    
    if (habitat) {
      allSpecies = allSpecies.filter(species => species.habitat.includes(habitat));
    }
    
    if (rarity) {
      allSpecies = allSpecies.filter(species => species.rarity === rarity);
    }
    
    return allSpecies.filter(species => !caughtSpecies.has(species.id));
  }

  /**
   * Export collection data
   */
  async exportCollection(trainerId: string): Promise<string> {
    const collection = await this.getCollection(trainerId);
    const stats = await this.getCollectionStats(trainerId);
    
    const exportData = {
      trainerId,
      exportDate: new Date().toISOString(),
      stats,
      animals: collection.map(animal => ({
        id: animal.id,
        speciesId: animal.speciesId,
        name: animal.name,
        nickname: animal.nickname,
        level: animal.level,
        shiny: animal.shiny,
        isFavorite: animal.isFavorite,
        captureDate: animal.captureDate,
        tags: animal.tags,
        notes: animal.notes
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Private helper methods
  private addMetadata(animal: Animal): AnimalWithMetadata {
    return {
      ...animal,
      isFavorite: this.favorites.has(animal.id),
      nickname: this.nicknames.get(animal.id),
      tags: this.tags.get(animal.id) || [],
      notes: this.notes.get(animal.id)
    };
  }

  private applyFilters(collection: AnimalWithMetadata[], filter: CollectionFilter): AnimalWithMetadata[] {
    return collection.filter(animal => {
      if (filter.habitat && !animal.type.includes(filter.habitat)) return false;
      if (filter.rarity && animal.rarity !== filter.rarity) return false;
      if (filter.shiny !== undefined && animal.shiny !== filter.shiny) return false;
      if (filter.favorite !== undefined && animal.isFavorite !== filter.favorite) return false;
      if (filter.evolutionStage !== undefined && animal.evolutionStage !== filter.evolutionStage) return false;
      
      if (filter.level) {
        if (filter.level.min !== undefined && animal.level < filter.level.min) return false;
        if (filter.level.max !== undefined && animal.level > filter.level.max) return false;
      }
      
      if (filter.name) {
        const searchTerm = filter.name.toLowerCase();
        const matchesName = animal.name.toLowerCase().includes(searchTerm);
        const matchesNickname = animal.nickname?.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesNickname) return false;
      }
      
      return true;
    });
  }

  private applySorting(collection: AnimalWithMetadata[], sort: CollectionSort): AnimalWithMetadata[] {
    return collection.sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'name':
          comparison = (a.nickname || a.name).localeCompare(b.nickname || b.name);
          break;
        case 'level':
          comparison = a.level - b.level;
          break;
        case 'captureDate':
          comparison = a.captureDate.getTime() - b.captureDate.getTime();
          break;
        case 'rarity':
          const rarityOrder = { [Rarity.COMMON]: 0, [Rarity.UNCOMMON]: 1, [Rarity.RARE]: 2, [Rarity.LEGENDARY]: 3 };
          comparison = rarityOrder[a.rarity] - rarityOrder[b.rarity];
          break;
        case 'stats':
          const aTotal = a.stats.health + a.stats.attack + a.stats.defense + a.stats.speed + a.stats.intelligence + a.stats.stamina;
          const bTotal = b.stats.health + b.stats.attack + b.stats.defense + b.stats.speed + b.stats.intelligence + b.stats.stamina;
          comparison = aTotal - bTotal;
          break;
      }
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private async loadMetadata(trainerId: string): Promise<void> {
    try {
      // Load favorites
      const favoritesData = await this.animalStorage['storage'].get(`collection:favorites:${trainerId}`);
      if (favoritesData) {
        const favorites = JSON.parse(favoritesData) as string[];
        this.favorites = new Set(favorites);
      }

      // Load nicknames
      const nicknamesData = await this.animalStorage['storage'].get(`collection:nicknames:${trainerId}`);
      if (nicknamesData) {
        const nicknames = JSON.parse(nicknamesData) as Record<string, string>;
        this.nicknames = new Map(Object.entries(nicknames));
      }

      // Load tags
      const tagsData = await this.animalStorage['storage'].get(`collection:tags:${trainerId}`);
      if (tagsData) {
        const tags = JSON.parse(tagsData) as Record<string, string[]>;
        this.tags = new Map(Object.entries(tags));
      }

      // Load notes
      const notesData = await this.animalStorage['storage'].get(`collection:notes:${trainerId}`);
      if (notesData) {
        const notes = JSON.parse(notesData) as Record<string, string>;
        this.notes = new Map(Object.entries(notes));
      }
    } catch (error) {
      console.error(`Error loading metadata for trainer ${trainerId}:`, error);
    }
  }

  private async saveMetadata(trainerId: string): Promise<void> {
    try {
      // Save favorites
      await this.animalStorage['storage'].set(
        `collection:favorites:${trainerId}`,
        JSON.stringify(Array.from(this.favorites))
      );

      // Save nicknames
      await this.animalStorage['storage'].set(
        `collection:nicknames:${trainerId}`,
        JSON.stringify(Object.fromEntries(this.nicknames))
      );

      // Save tags
      await this.animalStorage['storage'].set(
        `collection:tags:${trainerId}`,
        JSON.stringify(Object.fromEntries(this.tags))
      );

      // Save notes
      await this.animalStorage['storage'].set(
        `collection:notes:${trainerId}`,
        JSON.stringify(Object.fromEntries(this.notes))
      );
    } catch (error) {
      console.error(`Error saving metadata for trainer ${trainerId}:`, error);
    }
  }
}