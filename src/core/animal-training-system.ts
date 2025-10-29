import { Animal, Move, AnimalStats, calculateAnimalStats } from '../types/animal.js';
import { TrainerProfile } from '../types/trainer.js';
import { animalDatabase } from '../data/animal-database-manager.js';

export interface TrainingResult {
  success: boolean;
  experienceGained: number;
  levelUp: boolean;
  newLevel?: number;
  statsGained?: Partial<AnimalStats>;
  movesLearned?: Move[];
  error?: string;
}

export interface TrainingSession {
  animalId: string;
  trainerId: string;
  type: TrainingType;
  duration: number;
  intensity: number;
  startTime: Date;
  endTime?: Date;
}

export enum TrainingType {
  BATTLE_TRAINING = 'battle_training',
  SPEED_TRAINING = 'speed_training',
  INTELLIGENCE_TRAINING = 'intelligence_training',
  ENDURANCE_TRAINING = 'endurance_training',
  FRIENDSHIP_BUILDING = 'friendship_building'
}

export class AnimalTrainingSystem {
  /**
   * Train an animal and gain experience
   */
  public static trainAnimal(
    animal: Animal,
    trainer: TrainerProfile,
    trainingType: TrainingType,
    duration: number = 30
  ): TrainingResult {
    try {
      // Calculate experience gained based on training type and duration
      const baseExperience = this.calculateBaseExperience(trainingType, duration);
      const trainerBonus = this.getTrainerBonus(trainer, trainingType);
      const experienceGained = Math.floor(baseExperience * trainerBonus);

      // Add experience to animal
      const newExperience = animal.experience + experienceGained;
      const currentLevel = animal.level;
      const newLevel = this.calculateLevelFromExperience(newExperience);
      const levelUp = newLevel > currentLevel;

      // Update animal
      animal.experience = newExperience;
      animal.level = newLevel;

      let statsGained: Partial<AnimalStats> | undefined;
      let movesLearned: Move[] = [];

      if (levelUp) {
        // Recalculate stats for new level
        const species = animalDatabase.getAnimalById(animal.speciesId);
        if (species) {
          const newStats = calculateAnimalStats(
            species.baseStats,
            newLevel,
            animal.individualValues,
            animal.nature
          );
          
          statsGained = {
            health: newStats.health - animal.stats.health,
            attack: newStats.attack - animal.stats.attack,
            defense: newStats.defense - animal.stats.defense,
            speed: newStats.speed - animal.stats.speed,
            intelligence: newStats.intelligence - animal.stats.intelligence,
            stamina: newStats.stamina - animal.stats.stamina
          };

          animal.stats = newStats;

          // Check for new moves
          movesLearned = this.checkForNewMoves(animal, currentLevel, newLevel);
        }
      }

      // Increase friendship based on training
      animal.friendship = Math.min(100, animal.friendship + Math.floor(duration / 10));

      return {
        success: true,
        experienceGained,
        levelUp,
        newLevel: levelUp ? newLevel : undefined,
        statsGained,
        movesLearned
      };
    } catch (error) {
      return {
        success: false,
        experienceGained: 0,
        levelUp: false,
        error: error instanceof Error ? error.message : 'Training failed'
      };
    }
  }

  /**
   * Calculate base experience from training
   */
  private static calculateBaseExperience(trainingType: TrainingType, duration: number): number {
    const baseRates: Record<TrainingType, number> = {
      [TrainingType.BATTLE_TRAINING]: 2.0,
      [TrainingType.SPEED_TRAINING]: 1.5,
      [TrainingType.INTELLIGENCE_TRAINING]: 1.5,
      [TrainingType.ENDURANCE_TRAINING]: 1.8,
      [TrainingType.FRIENDSHIP_BUILDING]: 1.0
    };

    return Math.floor(duration * baseRates[trainingType]);
  }

  /**
   * Get trainer bonus multiplier based on specialization
   */
  private static getTrainerBonus(trainer: TrainerProfile, trainingType: TrainingType): number {
    let bonus = 1.0;

    // Specialization bonus
    switch (trainer.specialization) {
      case 'battle':
        if (trainingType === TrainingType.BATTLE_TRAINING) bonus += 0.3;
        break;
      case 'research':
        if (trainingType === TrainingType.INTELLIGENCE_TRAINING) bonus += 0.3;
        break;
      case 'conservation':
        if (trainingType === TrainingType.FRIENDSHIP_BUILDING) bonus += 0.3;
        break;
    }

    // Level bonus
    bonus += trainer.level * 0.02;

    return bonus;
  }

  /**
   * Calculate level from total experience
   */
  private static calculateLevelFromExperience(experience: number): number {
    // Using a cubic growth formula for more balanced progression
    return Math.floor(Math.cbrt(experience / 10)) + 1;
  }

  /**
   * Calculate experience required for a specific level
   */
  public static getExperienceForLevel(level: number): number {
    return Math.floor(Math.pow(level - 1, 3) * 10);
  }

  /**
   * Check if animal learns new moves at new level
   */
  private static checkForNewMoves(animal: Animal, oldLevel: number, newLevel: number): Move[] {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species) return [];

    const newMoves: Move[] = [];
    const availableMoves = animalDatabase.getMovesForSpecies(species.id);

    for (const move of availableMoves) {
      if (move.learnLevel > oldLevel && move.learnLevel <= newLevel) {
        // Check if animal doesn't already know this move
        if (!animal.moves.find(m => m.id === move.id)) {
          newMoves.push(move);
        }
      }
    }

    return newMoves;
  }

  /**
   * Learn a new move (replacing an old one if necessary)
   */
  public static learnMove(animal: Animal, newMove: Move, replaceIndex?: number): boolean {
    try {
      if (animal.moves.length < 4) {
        // Animal has space for new move
        animal.moves.push(newMove);
        return true;
      } else if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < 4) {
        // Replace existing move
        animal.moves[replaceIndex] = newMove;
        return true;
      }
      
      return false; // No space and no replacement specified
    } catch (error) {
      console.error('Error learning move:', error);
      return false;
    }
  }

  /**
   * Get available training types for an animal
   */
  public static getAvailableTrainingTypes(animal: Animal): TrainingType[] {
    const available: TrainingType[] = [
      TrainingType.FRIENDSHIP_BUILDING
    ];

    // Add other training types based on animal level and stats
    if (animal.level >= 5) {
      available.push(TrainingType.BATTLE_TRAINING);
    }

    if (animal.level >= 10) {
      available.push(TrainingType.SPEED_TRAINING, TrainingType.INTELLIGENCE_TRAINING);
    }

    if (animal.level >= 15) {
      available.push(TrainingType.ENDURANCE_TRAINING);
    }

    return available;
  }

  /**
   * Calculate training cost in currency
   */
  public static getTrainingCost(trainingType: TrainingType, duration: number): number {
    const baseCosts: Record<TrainingType, number> = {
      [TrainingType.BATTLE_TRAINING]: 5,
      [TrainingType.SPEED_TRAINING]: 3,
      [TrainingType.INTELLIGENCE_TRAINING]: 3,
      [TrainingType.ENDURANCE_TRAINING]: 4,
      [TrainingType.FRIENDSHIP_BUILDING]: 1
    };

    return Math.floor(baseCosts[trainingType] * (duration / 30));
  }

  /**
   * Start a training session
   */
  public static startTrainingSession(
    animal: Animal,
    trainer: TrainerProfile,
    trainingType: TrainingType,
    duration: number
  ): TrainingSession {
    return {
      animalId: animal.id,
      trainerId: trainer.trainerId,
      type: trainingType,
      duration,
      intensity: 1,
      startTime: new Date()
    };
  }

  /**
   * Complete a training session
   */
  public static completeTrainingSession(
    session: TrainingSession,
    animal: Animal,
    trainer: TrainerProfile
  ): TrainingResult {
    session.endTime = new Date();
    return this.trainAnimal(animal, trainer, session.type, session.duration);
  }
}