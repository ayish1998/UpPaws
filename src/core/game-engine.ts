import { ServiceContainer } from './service-container.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';
import { Battle } from '../types/battle.js';
import { Habitat } from '../types/habitat.js';

/**
 * Main game engine that orchestrates all game systems
 */
export class GameEngine {
  constructor(private services: ServiceContainer) {}

  // Trainer management
  async getOrCreateTrainer(username: string, trainerId: string): Promise<TrainerProfile | null> {
    const trainerStorage = this.services.getTrainerStorage();
    
    let trainer = await trainerStorage.getTrainerProfile(trainerId);
    if (!trainer) {
      trainer = await trainerStorage.createTrainerProfile(username, trainerId);
    }
    
    return trainer;
  }

  async updateTrainerActivity(trainerId: string): Promise<void> {
    const trainerStorage = this.services.getTrainerStorage();
    const trainer = await trainerStorage.getTrainerProfile(trainerId);
    
    if (trainer) {
      trainer.lastActiveAt = new Date();
      await trainerStorage.saveTrainerProfile(trainer);
    }
  }

  // Feature flag checking
  async isFeatureEnabled(feature: string, context?: any): Promise<boolean> {
    const featureFlags = this.services.getFeatureFlags();
    return await featureFlags.isEnabled(feature, context);
  }

  // Game configuration
  async getGameConfig() {
    const gameConfig = this.services.getGameConfig();
    return await gameConfig.getConfig();
  }

  // Animal collection
  async getTrainerAnimals(trainerId: string): Promise<Animal[]> {
    const animalStorage = this.services.getAnimalStorage();
    return await animalStorage.getTrainerAnimals(trainerId);
  }

  async captureAnimal(trainerId: string, animal: Animal): Promise<boolean> {
    const animalStorage = this.services.getAnimalStorage();
    const gameConfig = await this.getGameConfig();
    
    // Check if trainer has space for more animals
    const currentAnimals = await animalStorage.getTrainerAnimals(trainerId);
    if (currentAnimals.length >= gameConfig.maxAnimalsPerTrainer) {
      return false;
    }
    
    return await animalStorage.addAnimalToTrainer(trainerId, animal);
  }

  // Battle system
  async createBattle(battleData: Omit<Battle, 'battleId' | 'createdAt'>): Promise<Battle | null> {
    const battleStorage = this.services.getBattleStorage();
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const battle: Battle = {
      ...battleData,
      battleId,
      createdAt: new Date()
    };
    
    return await battleStorage.createBattle(battle);
  }

  async getBattle(battleId: string): Promise<Battle | null> {
    const battleStorage = this.services.getBattleStorage();
    return await battleStorage.getBattle(battleId);
  }

  // Habitat exploration
  async exploreHabitat(trainerId: string, habitatId: string): Promise<any> {
    const habitatStorage = this.services.getHabitatStorage();
    const trainerStorage = this.services.getTrainerStorage();
    
    const habitat = await habitatStorage.getHabitat(habitatId);
    const trainer = await trainerStorage.getTrainerProfile(trainerId);
    
    if (!habitat || !trainer) {
      return null;
    }
    
    // Update exploration count
    await habitatStorage.updateExplorationCount(trainerId, habitatId);
    
    // Generate exploration result
    const { generateExplorationResult } = await import('../types/habitat.js');
    return generateExplorationResult(habitat, trainer.level);
  }

  // Caching utilities
  async getCachedData<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T | null> {
    const cacheManager = this.services.getCacheManager();
    return await cacheManager.getOrSet(key, factory, { ttl });
  }

  // Daily puzzle system (legacy compatibility)
  async getDailyPuzzle(date: string): Promise<any> {
    const cacheManager = this.services.getCacheManager();
    
    return await cacheManager.getOrSet(
      `daily_puzzle:${date}`,
      async () => {
        // Generate daily puzzle logic here
        // This maintains compatibility with existing puzzle system
        return this.generateDailyPuzzle(date);
      },
      { ttl: 86400 } // Cache for 24 hours
    );
  }

  private generateDailyPuzzle(date: string): any {
    // This would contain the existing daily puzzle generation logic
    // Moved from main.tsx for better organization
    const animals = [
      { answer: 'HIPPOPOTAMUS', emoji: '🦛', fact: 'A hippo\'s bite can exceed 1,800 PSI — among land\'s strongest.' },
      { answer: 'FALCON', emoji: '🦅', fact: 'Peregrine falcons dive over 200 mph, fastest in the animal kingdom.' },
      { answer: 'GIRAFFE', emoji: '🦒', fact: 'Giraffes sleep less than 2 hours a day, often in short naps.' },
      { answer: 'OCTOPUS', emoji: '🐙', fact: 'Octopuses have three hearts and blue copper-based blood.' },
      { answer: 'PANDA', emoji: '🐼', fact: 'Giant pandas spend 10–16 hours a day eating bamboo.' },
      { answer: 'TIGER', emoji: '🐯', fact: 'A tiger\'s stripes are unique like human fingerprints.' },
      { answer: 'CROCODILE', emoji: '🐊', fact: 'Crocodiles can go through 4,000 teeth in a lifetime.' },
    ];

    let hash = 0;
    for (let i = 0; i < date.length; i++) {
      hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
    }
    
    const index = hash % animals.length;
    const base = animals[index];
    const letters = this.shuffle(base.answer.split(''));
    
    return {
      emoji: base.emoji,
      hint: 'Guess the animal from the emoji and letters.',
      answerLength: base.answer.length,
      letters,
      fact: base.fact,
      answer: base.answer,
    };
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Leaderboard management
  async updateLeaderboard(type: string, username: string, score: number): Promise<void> {
    const storageClient = this.services.getStorageClient();
    const leaderboardKey = `leaderboard:${type}`;
    
    // Get current leaderboard
    const leaderboardData = await storageClient.get(leaderboardKey);
    let leaderboard = leaderboardData ? JSON.parse(leaderboardData) : [];
    
    // Update or add user score
    const userIndex = leaderboard.findIndex((entry: any) => entry.username === username);
    if (userIndex >= 0) {
      leaderboard[userIndex].score = score;
    } else {
      leaderboard.push({ username, score });
    }
    
    // Sort and limit leaderboard
    leaderboard.sort((a: any, b: any) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100); // Keep top 100
    
    // Save updated leaderboard
    await storageClient.set(leaderboardKey, JSON.stringify(leaderboard));
  }

  // Health check
  async healthCheck(): Promise<any> {
    return await this.services.healthCheck();
  }

  // Utility methods
  getDateKey(): string {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.services.cleanup();
  }
}