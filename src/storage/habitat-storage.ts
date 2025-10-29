import { Habitat, HabitatProgress, ConservationMission, validateHabitat } from '../types/habitat.js';
import { StorageClient, KeyGenerator } from './redis-client.js';

export class HabitatStorage {
  constructor(private storage: StorageClient) {}

  async getHabitat(habitatId: string): Promise<Habitat | null> {
    try {
      const key = KeyGenerator.habitat(habitatId);
      const data = await this.storage.get(key);
      
      if (!data) {
        return null;
      }
      
      const habitat = JSON.parse(data) as Habitat;
      
      // Validate the loaded habitat
      const errors = validateHabitat(habitat);
      if (errors.length > 0) {
        console.warn(`Invalid habitat data for ${habitatId}:`, errors);
        return null;
      }
      
      return habitat;
    } catch (error) {
      console.error(`Error loading habitat ${habitatId}:`, error);
      return null;
    }
  }

  async saveHabitat(habitat: Habitat): Promise<boolean> {
    try {
      // Validate before saving
      const errors = validateHabitat(habitat);
      if (errors.length > 0) {
        console.error(`Cannot save invalid habitat:`, errors);
        return false;
      }
      
      const key = KeyGenerator.habitat(habitat.id);
      const data = JSON.stringify(habitat);
      
      await this.storage.set(key, data);
      
      // Update habitat indexes
      await this.updateHabitatIndexes(habitat);
      
      return true;
    } catch (error) {
      console.error(`Error saving habitat ${habitat.id}:`, error);
      return false;
    }
  }

  async getAllHabitats(): Promise<Habitat[]> {
    try {
      const indexKey = 'habitats:index';
      const habitatIds = await this.storage.hgetall(indexKey);
      
      const habitats: Habitat[] = [];
      
      for (const habitatId of Object.keys(habitatIds)) {
        const habitat = await this.getHabitat(habitatId);
        if (habitat) {
          habitats.push(habitat);
        }
      }
      
      return habitats.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(`Error getting all habitats:`, error);
      return [];
    }
  }

  async getHabitatsByType(habitatType: string): Promise<Habitat[]> {
    try {
      const indexKey = `habitats:type:${habitatType}`;
      const habitatIds = await this.storage.hgetall(indexKey);
      
      const habitats: Habitat[] = [];
      
      for (const habitatId of Object.keys(habitatIds)) {
        const habitat = await this.getHabitat(habitatId);
        if (habitat) {
          habitats.push(habitat);
        }
      }
      
      return habitats;
    } catch (error) {
      console.error(`Error getting habitats by type ${habitatType}:`, error);
      return [];
    }
  }

  async getUnlockedHabitats(trainerId: string): Promise<Habitat[]> {
    try {
      const progressKey = `trainer:habitat_progress:${trainerId}`;
      const progressData = await this.storage.hgetall(progressKey);
      
      const unlockedHabitats: Habitat[] = [];
      
      for (const habitatId of Object.keys(progressData)) {
        const habitat = await this.getHabitat(habitatId);
        if (habitat) {
          unlockedHabitats.push(habitat);
        }
      }
      
      return unlockedHabitats;
    } catch (error) {
      console.error(`Error getting unlocked habitats for trainer ${trainerId}:`, error);
      return [];
    }
  }

  // Habitat Progress Management
  async getHabitatProgress(trainerId: string, habitatId: string): Promise<HabitatProgress | null> {
    try {
      const key = `trainer:habitat_progress:${trainerId}:${habitatId}`;
      const data = await this.storage.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as HabitatProgress;
    } catch (error) {
      console.error(`Error getting habitat progress for trainer ${trainerId}, habitat ${habitatId}:`, error);
      return null;
    }
  }

  async saveHabitatProgress(progress: HabitatProgress): Promise<boolean> {
    try {
      const key = `trainer:habitat_progress:${progress.trainerId}:${progress.habitatId}`;
      const data = JSON.stringify(progress);
      
      await this.storage.set(key, data);
      
      // Update trainer's unlocked habitats index
      const unlockedKey = `trainer:habitat_progress:${progress.trainerId}`;
      await this.storage.hset(unlockedKey, progress.habitatId, progress.completionPercentage.toString());
      
      return true;
    } catch (error) {
      console.error(`Error saving habitat progress:`, error);
      return false;
    }
  }

  async updateExplorationCount(trainerId: string, habitatId: string): Promise<boolean> {
    try {
      let progress = await this.getHabitatProgress(trainerId, habitatId);
      
      if (!progress) {
        progress = {
          habitatId,
          trainerId,
          explorationCount: 0,
          lastExploration: new Date(),
          animalsDiscovered: [],
          completionPercentage: 0,
          achievements: [],
          specialUnlocks: []
        };
      }
      
      progress.explorationCount += 1;
      progress.lastExploration = new Date();
      
      return await this.saveHabitatProgress(progress);
    } catch (error) {
      console.error(`Error updating exploration count:`, error);
      return false;
    }
  }

  async addDiscoveredAnimal(trainerId: string, habitatId: string, speciesId: string): Promise<boolean> {
    try {
      let progress = await this.getHabitatProgress(trainerId, habitatId);
      
      if (!progress) {
        progress = {
          habitatId,
          trainerId,
          explorationCount: 0,
          lastExploration: new Date(),
          animalsDiscovered: [],
          completionPercentage: 0,
          achievements: [],
          specialUnlocks: []
        };
      }
      
      if (!progress.animalsDiscovered.includes(speciesId)) {
        progress.animalsDiscovered.push(speciesId);
        
        // Recalculate completion percentage
        const habitat = await this.getHabitat(habitatId);
        if (habitat) {
          progress.completionPercentage = Math.floor(
            (progress.animalsDiscovered.length / habitat.availableAnimals.length) * 100
          );
        }
      }
      
      return await this.saveHabitatProgress(progress);
    } catch (error) {
      console.error(`Error adding discovered animal:`, error);
      return false;
    }
  }

  // Conservation Mission Management
  async getConservationMission(missionId: string): Promise<ConservationMission | null> {
    try {
      const key = `mission:${missionId}`;
      const data = await this.storage.get(key);
      
      return data ? JSON.parse(data) as ConservationMission : null;
    } catch (error) {
      console.error(`Error getting conservation mission ${missionId}:`, error);
      return null;
    }
  }

  async saveConservationMission(mission: ConservationMission): Promise<boolean> {
    try {
      const key = `mission:${mission.id}`;
      const data = JSON.stringify(mission);
      
      await this.storage.set(key, data);
      
      // Update habitat missions index
      const habitatMissionsKey = `habitat:missions:${mission.habitatId}`;
      await this.storage.hset(habitatMissionsKey, mission.id, mission.name);
      
      return true;
    } catch (error) {
      console.error(`Error saving conservation mission ${mission.id}:`, error);
      return false;
    }
  }

  async getHabitatMissions(habitatId: string): Promise<ConservationMission[]> {
    try {
      const indexKey = `habitat:missions:${habitatId}`;
      const missionIds = await this.storage.hgetall(indexKey);
      
      const missions: ConservationMission[] = [];
      
      for (const missionId of Object.keys(missionIds)) {
        const mission = await this.getConservationMission(missionId);
        if (mission) {
          missions.push(mission);
        }
      }
      
      return missions.sort((a, b) => a.difficulty - b.difficulty);
    } catch (error) {
      console.error(`Error getting habitat missions for ${habitatId}:`, error);
      return [];
    }
  }

  async getTrainerMissionProgress(trainerId: string, missionId: string): Promise<any | null> {
    try {
      const key = `trainer:mission_progress:${trainerId}:${missionId}`;
      const data = await this.storage.get(key);
      
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting trainer mission progress:`, error);
      return null;
    }
  }

  async saveTrainerMissionProgress(trainerId: string, missionId: string, progress: any): Promise<boolean> {
    try {
      const key = `trainer:mission_progress:${trainerId}:${missionId}`;
      const data = JSON.stringify(progress);
      
      await this.storage.set(key, data);
      
      return true;
    } catch (error) {
      console.error(`Error saving trainer mission progress:`, error);
      return false;
    }
  }

  private async updateHabitatIndexes(habitat: Habitat): Promise<void> {
    try {
      // Update main habitats index
      const indexKey = 'habitats:index';
      await this.storage.hset(indexKey, habitat.id, habitat.name);
      
      // Update habitat type index
      const typeIndexKey = `habitats:type:${habitat.type}`;
      await this.storage.hset(typeIndexKey, habitat.id, habitat.name);
      
    } catch (error) {
      console.error(`Error updating habitat indexes for ${habitat.id}:`, error);
    }
  }

  async deleteHabitat(habitatId: string): Promise<boolean> {
    try {
      const habitat = await this.getHabitat(habitatId);
      if (!habitat) {
        return true; // Already deleted
      }
      
      // Remove from indexes
      await this.storage.hdel('habitats:index', habitatId);
      await this.storage.hdel(`habitats:type:${habitat.type}`, habitatId);
      
      // Delete main habitat data
      const key = KeyGenerator.habitat(habitatId);
      await this.storage.del(key);
      
      return true;
    } catch (error) {
      console.error(`Error deleting habitat ${habitatId}:`, error);
      return false;
    }
  }
}