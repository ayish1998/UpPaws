import { TrainerProfile, validateTrainerProfile, createDefaultTrainerProfile } from '../types/trainer.js';
import { StorageClient, KeyGenerator } from './redis-client.js';

export class TrainerStorage {
  constructor(private storage: StorageClient) {}

  async getTrainerProfile(trainerId: string): Promise<TrainerProfile | null> {
    try {
      const key = KeyGenerator.trainerProfile(trainerId);
      const data = await this.storage.get(key);
      
      if (!data) {
        return null;
      }
      
      const profile = JSON.parse(data) as TrainerProfile;
      
      // Validate the loaded profile
      const errors = validateTrainerProfile(profile);
      if (errors.length > 0) {
        console.warn(`Invalid trainer profile for ${trainerId}:`, errors);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error(`Error loading trainer profile ${trainerId}:`, error);
      return null;
    }
  }

  async saveTrainerProfile(profile: TrainerProfile): Promise<boolean> {
    try {
      // Validate before saving
      const errors = validateTrainerProfile(profile);
      if (errors.length > 0) {
        console.error(`Cannot save invalid trainer profile:`, errors);
        return false;
      }
      
      const key = KeyGenerator.trainerProfile(profile.trainerId);
      const data = JSON.stringify(profile);
      
      await this.storage.set(key, data);
      
      // Update last active timestamp
      profile.lastActiveAt = new Date();
      
      // Update trainer index for quick lookups
      await this.updateTrainerIndex(profile);
      
      return true;
    } catch (error) {
      console.error(`Error saving trainer profile ${profile.trainerId}:`, error);
      return false;
    }
  }

  async createTrainerProfile(username: string, trainerId: string): Promise<TrainerProfile | null> {
    try {
      // Check if trainer already exists
      const existing = await this.getTrainerProfile(trainerId);
      if (existing) {
        return existing;
      }
      
      const profile = createDefaultTrainerProfile(username, trainerId);
      const success = await this.saveTrainerProfile(profile);
      
      return success ? profile : null;
    } catch (error) {
      console.error(`Error creating trainer profile for ${username}:`, error);
      return null;
    }
  }

  async updateTrainerStats(trainerId: string, updates: Partial<TrainerProfile['stats']>): Promise<boolean> {
    try {
      const profile = await this.getTrainerProfile(trainerId);
      if (!profile) {
        return false;
      }
      
      // Update stats
      profile.stats = { ...profile.stats, ...updates };
      profile.lastActiveAt = new Date();
      
      return await this.saveTrainerProfile(profile);
    } catch (error) {
      console.error(`Error updating trainer stats for ${trainerId}:`, error);
      return false;
    }
  }

  async addExperience(trainerId: string, experience: number): Promise<boolean> {
    try {
      const profile = await this.getTrainerProfile(trainerId);
      if (!profile) {
        return false;
      }
      
      profile.experience += experience;
      
      // Check for level up
      const newLevel = this.calculateLevel(profile.experience);
      if (newLevel > profile.level) {
        profile.level = newLevel;
        // Could trigger level up rewards here
      }
      
      return await this.saveTrainerProfile(profile);
    } catch (error) {
      console.error(`Error adding experience to trainer ${trainerId}:`, error);
      return false;
    }
  }

  async addCurrency(trainerId: string, currencyType: keyof TrainerProfile['currency'], amount: number): Promise<boolean> {
    try {
      const profile = await this.getTrainerProfile(trainerId);
      if (!profile) {
        return false;
      }
      
      profile.currency[currencyType] = Math.max(0, profile.currency[currencyType] + amount);
      
      return await this.saveTrainerProfile(profile);
    } catch (error) {
      console.error(`Error adding currency to trainer ${trainerId}:`, error);
      return false;
    }
  }

  async getTrainersByLevel(minLevel: number = 1, maxLevel: number = 100, limit: number = 10): Promise<TrainerProfile[]> {
    try {
      // This would require a more sophisticated indexing system in production
      // For now, we'll return an empty array as this requires scanning all trainers
      return [];
    } catch (error) {
      console.error(`Error getting trainers by level:`, error);
      return [];
    }
  }

  private async updateTrainerIndex(profile: TrainerProfile): Promise<void> {
    try {
      // Update level leaderboard
      const levelKey = KeyGenerator.leaderboard('level');
      await this.storage.zadd(levelKey, profile.level, profile.trainerId);
      
      // Update experience leaderboard
      const expKey = KeyGenerator.leaderboard('experience');
      await this.storage.zadd(expKey, profile.experience, profile.trainerId);
      
      // Update username mapping
      const usernameKey = `username:${profile.username}`;
      await this.storage.set(usernameKey, profile.trainerId);
      
    } catch (error) {
      console.error(`Error updating trainer index for ${profile.trainerId}:`, error);
    }
  }

  private calculateLevel(experience: number): number {
    // Simple level calculation - could be made more sophisticated
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  async deleteTrainerProfile(trainerId: string): Promise<boolean> {
    try {
      const profile = await this.getTrainerProfile(trainerId);
      if (!profile) {
        return true; // Already deleted
      }
      
      // Remove from indexes
      await this.storage.zrem(KeyGenerator.leaderboard('level'), trainerId);
      await this.storage.zrem(KeyGenerator.leaderboard('experience'), trainerId);
      await this.storage.del(`username:${profile.username}`);
      
      // Delete main profile
      const key = KeyGenerator.trainerProfile(trainerId);
      await this.storage.del(key);
      
      return true;
    } catch (error) {
      console.error(`Error deleting trainer profile ${trainerId}:`, error);
      return false;
    }
  }
}