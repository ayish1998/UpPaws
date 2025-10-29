import { RedisClient } from '@devvit/public-api';
import { ServiceContainer, GameEngine } from './core/index.js';
import { createDefaultTrainerProfile } from './types/trainer.js';

/**
 * Example of how to integrate the new UpPaws Animal Trainer system
 * This shows how to initialize and use the enhanced game systems
 */
export async function initializeUpPawsSystem(redisClient: RedisClient): Promise<GameEngine> {
  // Create and initialize the service container
  const services = await ServiceContainer.create(redisClient);
  
  // Create the game engine
  const gameEngine = new GameEngine(services);
  
  // Example: Check if features are enabled
  const collectionEnabled = await gameEngine.isFeatureEnabled('animal_collection');
  const battleEnabled = await gameEngine.isFeatureEnabled('battle_system');
  
  console.log('UpPaws Animal Trainer System initialized');
  console.log(`Animal Collection: ${collectionEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Battle System: ${battleEnabled ? 'Enabled' : 'Disabled'}`);
  
  return gameEngine;
}

/**
 * Example of handling a user interaction with the new system
 */
export async function handleUserInteraction(
  gameEngine: GameEngine,
  username: string,
  action: string,
  data?: any
): Promise<any> {
  // Generate trainer ID from username
  const trainerId = `trainer_${username}`;
  
  // Get or create trainer profile
  const trainer = await gameEngine.getOrCreateTrainer(username, trainerId);
  if (!trainer) {
    throw new Error('Failed to create trainer profile');
  }
  
  // Update trainer activity
  await gameEngine.updateTrainerActivity(trainerId);
  
  switch (action) {
    case 'getDailyPuzzle':
      const dateKey = gameEngine.getDateKey();
      return await gameEngine.getDailyPuzzle(dateKey);
    
    case 'getTrainerProfile':
      return trainer;
    
    case 'getAnimals':
      if (await gameEngine.isFeatureEnabled('animal_collection')) {
        return await gameEngine.getTrainerAnimals(trainerId);
      }
      return [];
    
    case 'exploreHabitat':
      if (await gameEngine.isFeatureEnabled('habitat_exploration') && data?.habitatId) {
        return await gameEngine.exploreHabitat(trainerId, data.habitatId);
      }
      return null;
    
    case 'healthCheck':
      return await gameEngine.healthCheck();
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Example of migrating existing user data to the new system
 */
export async function migrateExistingUserData(
  gameEngine: GameEngine,
  username: string,
  existingData: any
): Promise<boolean> {
  try {
    const trainerId = `trainer_${username}`;
    
    // Create trainer profile with existing data
    const services = (gameEngine as any).services as ServiceContainer;
    const trainerStorage = services.getTrainerStorage();
    
    let trainer = await trainerStorage.getTrainerProfile(trainerId);
    if (!trainer) {
      trainer = createDefaultTrainerProfile(username, trainerId);
    }
    
    // Migrate existing score and streak data
    if (existingData.score) {
      trainer.currency.pawCoins += existingData.score;
    }
    
    if (existingData.streak) {
      trainer.stats.currentStreak = existingData.streak;
      trainer.stats.longestStreak = Math.max(trainer.stats.longestStreak, existingData.streak);
    }
    
    // Save migrated trainer
    await trainerStorage.saveTrainerProfile(trainer);
    
    console.log(`Migrated data for user ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to migrate data for user ${username}:`, error);
    return false;
  }
}

/**
 * Example configuration for different environments
 */
export async function configureEnvironment(
  gameEngine: GameEngine,
  environment: 'development' | 'staging' | 'production'
): Promise<void> {
  const services = (gameEngine as any).services as ServiceContainer;
  
  // Load environment-specific game configuration
  const gameConfig = services.getGameConfig();
  await gameConfig.loadEnvironmentConfig(environment);
  
  // Load environment-specific feature flags
  const featureFlags = services.getFeatureFlags();
  await featureFlags.loadEnvironmentFlags(environment);
  
  console.log(`Configured for ${environment} environment`);
}