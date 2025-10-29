import { Animal, AnimalSpecies, validateAnimal } from '../types/animal.js';
import { StorageClient, KeyGenerator } from './redis-client.js';

export class AnimalStorage {
  constructor(private storage: StorageClient) {}

  async getAnimal(animalId: string): Promise<Animal | null> {
    try {
      const key = KeyGenerator.animal(animalId);
      const data = await this.storage.get(key);
      
      if (!data) {
        return null;
      }
      
      const animal = JSON.parse(data) as Animal;
      
      // Validate the loaded animal
      const errors = validateAnimal(animal);
      if (errors.length > 0) {
        console.warn(`Invalid animal data for ${animalId}:`, errors);
        return null;
      }
      
      return animal;
    } catch (error) {
      console.error(`Error loading animal ${animalId}:`, error);
      return null;
    }
  }

  async saveAnimal(animal: Animal): Promise<boolean> {
    try {
      // Validate before saving
      const errors = validateAnimal(animal);
      if (errors.length > 0) {
        console.error(`Cannot save invalid animal:`, errors);
        return false;
      }
      
      const key = KeyGenerator.animal(animal.id);
      const data = JSON.stringify(animal);
      
      await this.storage.set(key, data);
      
      // Update trainer's animal collection
      await this.updateTrainerCollection(animal.trainerId, animal.id);
      
      return true;
    } catch (error) {
      console.error(`Error saving animal ${animal.id}:`, error);
      return false;
    }
  }

  async getTrainerAnimals(trainerId: string): Promise<Animal[]> {
    try {
      const collectionKey = KeyGenerator.trainerAnimals(trainerId);
      const animalIds = await this.storage.hgetall(collectionKey);
      
      const animals: Animal[] = [];
      
      for (const animalId of Object.keys(animalIds)) {
        const animal = await this.getAnimal(animalId);
        if (animal) {
          animals.push(animal);
        }
      }
      
      // Sort by capture date (newest first)
      return animals.sort((a, b) => b.captureDate.getTime() - a.captureDate.getTime());
    } catch (error) {
      console.error(`Error loading trainer animals for ${trainerId}:`, error);
      return [];
    }
  }

  async addAnimalToTrainer(trainerId: string, animal: Animal): Promise<boolean> {
    try {
      animal.trainerId = trainerId;
      return await this.saveAnimal(animal);
    } catch (error) {
      console.error(`Error adding animal to trainer ${trainerId}:`, error);
      return false;
    }
  }

  async removeAnimalFromTrainer(trainerId: string, animalId: string): Promise<boolean> {
    try {
      // Remove from trainer's collection
      const collectionKey = KeyGenerator.trainerAnimals(trainerId);
      await this.storage.hdel(collectionKey, animalId);
      
      // Delete the animal
      const animalKey = KeyGenerator.animal(animalId);
      await this.storage.del(animalKey);
      
      return true;
    } catch (error) {
      console.error(`Error removing animal ${animalId} from trainer ${trainerId}:`, error);
      return false;
    }
  }

  async updateAnimalStats(animalId: string, updates: Partial<Animal>): Promise<boolean> {
    try {
      const animal = await this.getAnimal(animalId);
      if (!animal) {
        return false;
      }
      
      // Apply updates
      Object.assign(animal, updates);
      
      return await this.saveAnimal(animal);
    } catch (error) {
      console.error(`Error updating animal stats for ${animalId}:`, error);
      return false;
    }
  }

  async addExperienceToAnimal(animalId: string, experience: number): Promise<boolean> {
    try {
      const animal = await this.getAnimal(animalId);
      if (!animal) {
        return false;
      }
      
      animal.experience += experience;
      
      // Check for level up
      const newLevel = this.calculateAnimalLevel(animal.experience);
      if (newLevel > animal.level) {
        animal.level = newLevel;
        // Recalculate stats based on new level
        // This would involve the stat calculation from animal.ts
      }
      
      return await this.saveAnimal(animal);
    } catch (error) {
      console.error(`Error adding experience to animal ${animalId}:`, error);
      return false;
    }
  }

  async getAnimalsBySpecies(speciesId: string, limit: number = 10): Promise<Animal[]> {
    try {
      // This would require indexing by species in production
      // For now, return empty array as it requires scanning all animals
      return [];
    } catch (error) {
      console.error(`Error getting animals by species ${speciesId}:`, error);
      return [];
    }
  }

  async getShinyAnimals(trainerId?: string): Promise<Animal[]> {
    try {
      if (trainerId) {
        const animals = await this.getTrainerAnimals(trainerId);
        return animals.filter(animal => animal.shiny);
      }
      
      // Getting all shiny animals would require indexing
      return [];
    } catch (error) {
      console.error(`Error getting shiny animals:`, error);
      return [];
    }
  }

  async transferAnimal(animalId: string, fromTrainerId: string, toTrainerId: string): Promise<boolean> {
    try {
      const animal = await this.getAnimal(animalId);
      if (!animal || animal.trainerId !== fromTrainerId) {
        return false;
      }
      
      // Remove from old trainer
      const oldCollectionKey = KeyGenerator.trainerAnimals(fromTrainerId);
      await this.storage.hdel(oldCollectionKey, animalId);
      
      // Add to new trainer
      animal.trainerId = toTrainerId;
      await this.saveAnimal(animal);
      
      return true;
    } catch (error) {
      console.error(`Error transferring animal ${animalId}:`, error);
      return false;
    }
  }

  private async updateTrainerCollection(trainerId: string, animalId: string): Promise<void> {
    try {
      const collectionKey = KeyGenerator.trainerAnimals(trainerId);
      const timestamp = Date.now().toString();
      await this.storage.hset(collectionKey, animalId, timestamp);
    } catch (error) {
      console.error(`Error updating trainer collection for ${trainerId}:`, error);
    }
  }

  private calculateAnimalLevel(experience: number): number {
    // Simple level calculation - could be made more sophisticated
    return Math.floor(Math.pow(experience / 125, 1/3)) + 1;
  }

  // Species management
  async getAnimalSpecies(speciesId: string): Promise<AnimalSpecies | null> {
    try {
      // First check the expanded database
      const { animalDatabase } = await import('../data/animal-database-manager.js');
      const species = animalDatabase.getAnimalById(speciesId);
      if (species) {
        return species;
      }

      // Fallback to Redis storage for custom species
      const key = `species:${speciesId}`;
      const data = await this.storage.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as AnimalSpecies;
    } catch (error) {
      console.error(`Error loading animal species ${speciesId}:`, error);
      return null;
    }
  }

  async saveAnimalSpecies(species: AnimalSpecies): Promise<boolean> {
    try {
      const key = `species:${species.id}`;
      const data = JSON.stringify(species);
      
      await this.storage.set(key, data);
      
      // Update species index
      const indexKey = `species:index:${species.habitat.join(':')}`;
      await this.storage.hset(indexKey, species.id, species.name);
      
      return true;
    } catch (error) {
      console.error(`Error saving animal species ${species.id}:`, error);
      return false;
    }
  }

  async getSpeciesByHabitat(habitatType: string): Promise<AnimalSpecies[]> {
    try {
      // Use the expanded database for habitat queries
      const { animalDatabase } = await import('../data/animal-database-manager.js');
      const { HabitatType } = await import('../types/common.js');
      
      // Convert string to HabitatType enum
      const habitat = habitatType as keyof typeof HabitatType;
      if (HabitatType[habitat]) {
        return animalDatabase.getAnimalsByHabitat(HabitatType[habitat]);
      }

      // Fallback to Redis storage for custom species
      const indexKey = `species:index:${habitatType}`;
      const speciesIds = await this.storage.hgetall(indexKey);
      
      const species: AnimalSpecies[] = [];
      
      for (const speciesId of Object.keys(speciesIds)) {
        const speciesData = await this.getAnimalSpecies(speciesId);
        if (speciesData) {
          species.push(speciesData);
        }
      }
      
      return species;
    } catch (error) {
      console.error(`Error getting species by habitat ${habitatType}:`, error);
      return [];
    }
  }
}