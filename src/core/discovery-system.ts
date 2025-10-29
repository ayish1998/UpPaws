import { Animal, AnimalSpecies, generateRandomIVs, calculateAnimalStats } from '../types/animal.js';
import { HabitatType, Rarity } from '../types/common.js';
import { animalDatabase } from '../data/animal-database-manager.js';
import { ShinySystem } from './shiny-system.js';

export interface DiscoveryResult {
  success: boolean;
  animal?: AnimalSpecies;
  puzzle?: AnimalPuzzle;
  shiny: boolean;
  rarity: Rarity;
  encounterMessage: string;
  difficulty: number;
}

export interface AnimalPuzzle {
  id: string;
  animalId: string;
  type: PuzzleType;
  difficulty: number;
  timeLimit: number;
  letters: string[];
  hint: string;
  solution: string;
  scrambledWord: string;
  bonusLetters?: string[];
  penalties: PuzzlePenalty[];
}

export enum PuzzleType {
  WORD_SCRAMBLE = 'word_scramble',
  LETTER_MATCH = 'letter_match',
  HABITAT_CLUE = 'habitat_clue',
  FACT_PUZZLE = 'fact_puzzle',
  EVOLUTION_CHAIN = 'evolution_chain'
}

export interface PuzzlePenalty {
  type: 'time' | 'hint_used' | 'wrong_guess';
  value: number;
  description: string;
}

export interface CaptureAttempt {
  puzzleId: string;
  solution: string;
  timeTaken: number;
  hintsUsed: number;
  wrongGuesses: number;
}

export interface CaptureResult {
  success: boolean;
  animal?: Animal;
  captureRate: number;
  bonusMultiplier: number;
  experienceGained: number;
  message: string;
  shinyBonus?: boolean;
}

export class DiscoverySystem {
  /**
   * Discover an animal in a specific habitat
   */
  public static discoverAnimal(
    habitat: HabitatType,
    trainerLevel: number = 1,
    hasShinyCharm: boolean = false,
    weatherBonus: number = 1,
    timeOfDayBonus: number = 1
  ): DiscoveryResult {
    // Get weighted random animal from habitat
    const animal = animalDatabase.getRandomAnimalByHabitatWithWeights(habitat);
    
    if (!animal) {
      return {
        success: false,
        shiny: false,
        rarity: Rarity.COMMON,
        encounterMessage: 'No animals found in this habitat.',
        difficulty: 1
      };
    }

    // Check for shiny
    const isShiny = ShinySystem.rollForShiny(animal.id, hasShinyCharm);
    
    // Calculate encounter difficulty based on rarity and trainer level
    const difficulty = this.calculateEncounterDifficulty(animal.rarity, trainerLevel);
    
    // Generate puzzle
    const puzzle = this.generatePuzzle(animal, difficulty);
    
    // Create encounter message
    const encounterMessage = isShiny 
      ? ShinySystem.getShinyEncounterMessage({ ...animal, shiny: true } as Animal)
      : this.getEncounterMessage(animal, habitat);

    return {
      success: true,
      animal,
      puzzle,
      shiny: isShiny,
      rarity: animal.rarity,
      encounterMessage,
      difficulty
    };
  }

  /**
   * Generate a puzzle for capturing an animal
   */
  public static generatePuzzle(animal: AnimalSpecies, difficulty: number): AnimalPuzzle {
    const puzzleType = this.selectPuzzleType(animal, difficulty);
    const baseTimeLimit = this.calculateTimeLimit(animal.name.length, difficulty);
    
    let puzzle: AnimalPuzzle;
    
    switch (puzzleType) {
      case PuzzleType.WORD_SCRAMBLE:
        puzzle = this.generateWordScramblePuzzle(animal, difficulty, baseTimeLimit);
        break;
      case PuzzleType.HABITAT_CLUE:
        puzzle = this.generateHabitatCluePuzzle(animal, difficulty, baseTimeLimit);
        break;
      case PuzzleType.FACT_PUZZLE:
        puzzle = this.generateFactPuzzle(animal, difficulty, baseTimeLimit);
        break;
      default:
        puzzle = this.generateWordScramblePuzzle(animal, difficulty, baseTimeLimit);
    }
    
    return puzzle;
  }

  /**
   * Attempt to capture an animal with puzzle solution
   */
  public static attemptCapture(
    animal: AnimalSpecies,
    puzzle: AnimalPuzzle,
    attempt: CaptureAttempt,
    trainerId: string,
    isShiny: boolean = false
  ): CaptureResult {
    // Check if solution is correct
    const isCorrect = attempt.solution.toUpperCase().trim() === puzzle.solution.toUpperCase();
    
    if (!isCorrect) {
      return {
        success: false,
        captureRate: 0,
        bonusMultiplier: 0,
        experienceGained: 0,
        message: `The ${animal.name} escaped! Try again with a different approach.`
      };
    }

    // Calculate capture rate based on performance
    const captureRate = this.calculateCaptureRate(puzzle, attempt);
    
    // Determine if capture is successful
    const captureSuccess = Math.random() < captureRate;
    
    if (!captureSuccess) {
      return {
        success: false,
        captureRate,
        bonusMultiplier: 0,
        experienceGained: Math.floor(animal.baseStats.health * 0.1),
        message: `You solved the puzzle, but the ${animal.name} managed to escape! You gained some experience.`
      };
    }

    // Create captured animal
    const capturedAnimal = this.createCapturedAnimal(animal, trainerId, isShiny, captureRate);
    
    // Calculate bonuses
    const bonusMultiplier = this.calculateBonusMultiplier(attempt, isShiny, animal.rarity);
    const experienceGained = Math.floor(animal.baseStats.health * bonusMultiplier);
    
    const message = isShiny 
      ? `✨ Amazing! You captured a shiny ${animal.name}! ✨`
      : `Congratulations! You captured ${animal.name}!`;

    return {
      success: true,
      animal: capturedAnimal,
      captureRate,
      bonusMultiplier,
      experienceGained,
      message,
      shinyBonus: isShiny
    };
  }

  /**
   * Get encounter rates for different habitats
   */
  public static getHabitatEncounterRates(habitat: HabitatType): Record<Rarity, number> {
    const baseRates = {
      [Rarity.COMMON]: 0.5,
      [Rarity.UNCOMMON]: 0.3,
      [Rarity.RARE]: 0.15,
      [Rarity.LEGENDARY]: 0.05
    };

    // Adjust rates based on habitat
    switch (habitat) {
      case HabitatType.ARCTIC:
      case HabitatType.DESERT:
        // Harsh environments have more rare animals
        return {
          [Rarity.COMMON]: 0.4,
          [Rarity.UNCOMMON]: 0.35,
          [Rarity.RARE]: 0.2,
          [Rarity.LEGENDARY]: 0.05
        };
      case HabitatType.OCEAN:
        // Ocean has many legendary creatures
        return {
          [Rarity.COMMON]: 0.45,
          [Rarity.UNCOMMON]: 0.3,
          [Rarity.RARE]: 0.15,
          [Rarity.LEGENDARY]: 0.1
        };
      default:
        return baseRates;
    }
  }

  // Private helper methods
  private static calculateEncounterDifficulty(rarity: Rarity, trainerLevel: number): number {
    const basedifficulty = {
      [Rarity.COMMON]: 1,
      [Rarity.UNCOMMON]: 2,
      [Rarity.RARE]: 3,
      [Rarity.LEGENDARY]: 4
    };

    // Adjust difficulty based on trainer level
    const levelAdjustment = Math.max(0, Math.floor((trainerLevel - 1) / 10));
    return Math.max(1, basedifficulty[rarity] - levelAdjustment);
  }

  private static selectPuzzleType(animal: AnimalSpecies, difficulty: number): PuzzleType {
    const types = [PuzzleType.WORD_SCRAMBLE, PuzzleType.HABITAT_CLUE, PuzzleType.FACT_PUZZLE];
    
    // Higher difficulty animals get more complex puzzles
    if (difficulty >= 3 && animal.facts.length > 0) {
      types.push(PuzzleType.FACT_PUZZLE);
    }
    
    return types[Math.floor(Math.random() * types.length)];
  }

  private static calculateTimeLimit(nameLength: number, difficulty: number): number {
    // Base time: 30 seconds + 5 seconds per letter
    const baseTime = 30 + (nameLength * 5);
    
    // Reduce time for higher difficulty
    const difficultyMultiplier = Math.max(0.5, 1 - (difficulty - 1) * 0.15);
    
    return Math.floor(baseTime * difficultyMultiplier);
  }

  private static generateWordScramblePuzzle(
    animal: AnimalSpecies,
    difficulty: number,
    timeLimit: number
  ): AnimalPuzzle {
    const solution = animal.name.toUpperCase();
    const letters = solution.split('');
    
    // Scramble letters
    const scrambledLetters = [...letters].sort(() => Math.random() - 0.5);
    
    // Add bonus letters for higher difficulty
    const bonusLetters: string[] = [];
    if (difficulty >= 2) {
      const extraLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < difficulty; i++) {
        bonusLetters.push(extraLetters[Math.floor(Math.random() * extraLetters.length)]);
      }
    }

    return {
      id: `puzzle_${animal.id}_${Date.now()}`,
      animalId: animal.id,
      type: PuzzleType.WORD_SCRAMBLE,
      difficulty,
      timeLimit,
      letters: [...scrambledLetters, ...bonusLetters].sort(() => Math.random() - 0.5),
      hint: `${animal.emoji} Unscramble the letters to spell this animal's name!`,
      solution,
      scrambledWord: scrambledLetters.join(''),
      bonusLetters,
      penalties: [
        { type: 'time', value: 0.1, description: 'Time penalty for slow solving' },
        { type: 'hint_used', value: 0.2, description: 'Penalty for using hints' },
        { type: 'wrong_guess', value: 0.15, description: 'Penalty for wrong guesses' }
      ]
    };
  }

  private static generateHabitatCluePuzzle(
    animal: AnimalSpecies,
    difficulty: number,
    timeLimit: number
  ): AnimalPuzzle {
    const solution = animal.name.toUpperCase();
    const habitatNames = animal.habitat.map(h => h.replace('_', ' ').toLowerCase());
    const hint = `${animal.emoji} This animal lives in: ${habitatNames.join(', ')}. What is it?`;

    return {
      id: `puzzle_${animal.id}_${Date.now()}`,
      animalId: animal.id,
      type: PuzzleType.HABITAT_CLUE,
      difficulty,
      timeLimit: timeLimit + 15, // Extra time for thinking
      letters: solution.split('').sort(() => Math.random() - 0.5),
      hint,
      solution,
      scrambledWord: '',
      penalties: [
        { type: 'time', value: 0.05, description: 'Small time penalty' },
        { type: 'wrong_guess', value: 0.2, description: 'Penalty for wrong guesses' }
      ]
    };
  }

  private static generateFactPuzzle(
    animal: AnimalSpecies,
    difficulty: number,
    timeLimit: number
  ): AnimalPuzzle {
    const solution = animal.name.toUpperCase();
    const randomFact = animal.facts[Math.floor(Math.random() * animal.facts.length)];
    const hint = `${animal.emoji} ${randomFact} What animal is this?`;

    return {
      id: `puzzle_${animal.id}_${Date.now()}`,
      animalId: animal.id,
      type: PuzzleType.FACT_PUZZLE,
      difficulty,
      timeLimit: timeLimit + 20, // Extra time for reading
      letters: solution.split('').sort(() => Math.random() - 0.5),
      hint,
      solution,
      scrambledWord: '',
      penalties: [
        { type: 'time', value: 0.05, description: 'Small time penalty' },
        { type: 'wrong_guess', value: 0.25, description: 'Higher penalty for wrong guesses' }
      ]
    };
  }

  private static calculateCaptureRate(puzzle: AnimalPuzzle, attempt: CaptureAttempt): number {
    let baseRate = 0.8; // 80% base capture rate for correct solution
    
    // Time penalty
    const timeRatio = attempt.timeTaken / puzzle.timeLimit;
    if (timeRatio > 0.8) {
      baseRate -= (timeRatio - 0.8) * 0.5; // Penalty for slow solving
    } else if (timeRatio < 0.3) {
      baseRate += 0.1; // Bonus for fast solving
    }
    
    // Hint penalty
    baseRate -= attempt.hintsUsed * 0.1;
    
    // Wrong guess penalty
    baseRate -= attempt.wrongGuesses * 0.05;
    
    // Difficulty adjustment
    baseRate -= (puzzle.difficulty - 1) * 0.1;
    
    return Math.max(0.1, Math.min(0.95, baseRate));
  }

  private static createCapturedAnimal(
    species: AnimalSpecies,
    trainerId: string,
    isShiny: boolean,
    captureRate: number
  ): Animal {
    const level = Math.max(1, Math.floor(Math.random() * 10) + 1);
    const individualValues = generateRandomIVs();
    
    // Generate random nature (simplified)
    const natures = [
      { name: 'Hardy', increasedStat: '', decreasedStat: '', description: 'Balanced nature' },
      { name: 'Brave', increasedStat: 'attack', decreasedStat: 'speed', description: 'Loves to fight' },
      { name: 'Timid', increasedStat: 'speed', decreasedStat: 'attack', description: 'Quick to flee' },
      { name: 'Calm', increasedStat: 'intelligence', decreasedStat: 'attack', description: 'Peaceful nature' }
    ];
    const nature = natures[Math.floor(Math.random() * natures.length)];
    
    const stats = calculateAnimalStats(species.baseStats, level, individualValues, nature);
    
    const animal: Animal = {
      id: `animal_${species.id}_${trainerId}_${Date.now()}`,
      speciesId: species.id,
      name: species.name,
      level,
      experience: 0,
      stats,
      moves: [], // Would be populated based on species and level
      type: species.habitat,
      rarity: species.rarity,
      shiny: isShiny,
      evolutionStage: species.evolutionChain?.stage || 1,
      captureDate: new Date(),
      trainerId,
      individualValues,
      nature,
      friendship: Math.floor(Math.random() * 20) + 10, // Start with some friendship
      isEgg: false
    };

    // Apply shiny bonuses if applicable
    if (isShiny) {
      return ShinySystem.generateShinyVariant(animal);
    }
    
    return animal;
  }

  private static calculateBonusMultiplier(
    attempt: CaptureAttempt,
    isShiny: boolean,
    rarity: Rarity
  ): number {
    let multiplier = 1.0;
    
    // Shiny bonus
    if (isShiny) {
      multiplier += 0.5;
    }
    
    // Rarity bonus
    const rarityBonus = {
      [Rarity.COMMON]: 0,
      [Rarity.UNCOMMON]: 0.2,
      [Rarity.RARE]: 0.5,
      [Rarity.LEGENDARY]: 1.0
    };
    multiplier += rarityBonus[rarity];
    
    // Performance bonus
    if (attempt.hintsUsed === 0) {
      multiplier += 0.2; // No hints used
    }
    if (attempt.wrongGuesses === 0) {
      multiplier += 0.1; // No wrong guesses
    }
    
    return multiplier;
  }

  private static getEncounterMessage(animal: AnimalSpecies, habitat: HabitatType): string {
    const habitatMessages = {
      [HabitatType.FOREST]: [
        `A wild ${animal.name} rustles through the forest undergrowth!`,
        `You spot a ${animal.name} among the trees!`,
        `A ${animal.name} emerges from behind a large oak tree!`
      ],
      [HabitatType.OCEAN]: [
        `A ${animal.name} surfaces from the deep blue waters!`,
        `You notice a ${animal.name} swimming gracefully nearby!`,
        `A ${animal.name} breaches the ocean surface!`
      ],
      [HabitatType.DESERT]: [
        `A ${animal.name} appears from behind a sand dune!`,
        `You discover a ${animal.name} resting in the desert shade!`,
        `A ${animal.name} emerges from the hot desert sands!`
      ],
      [HabitatType.ARCTIC]: [
        `A ${animal.name} trudges through the snow!`,
        `You spot a ${animal.name} against the white landscape!`,
        `A ${animal.name} appears from the icy wilderness!`
      ],
      [HabitatType.GRASSLAND]: [
        `A ${animal.name} grazes peacefully in the grassland!`,
        `You encounter a ${animal.name} roaming the savanna!`,
        `A ${animal.name} bounds across the open plains!`
      ],
      [HabitatType.MOUNTAIN]: [
        `A ${animal.name} navigates the rocky mountain terrain!`,
        `You spot a ${animal.name} on a distant cliff!`,
        `A ${animal.name} emerges from a mountain cave!`
      ],
      [HabitatType.WETLAND]: [
        `A ${animal.name} wades through the marsh waters!`,
        `You discover a ${animal.name} near the wetland edge!`,
        `A ${animal.name} appears from the reedy shallows!`
      ],
      [HabitatType.CAVE]: [
        `A ${animal.name} emerges from the cave depths!`,
        `You encounter a ${animal.name} in the dim cave light!`,
        `A ${animal.name} appears from the shadows!`
      ]
    };

    const messages = habitatMessages[habitat] || [`You encounter a wild ${animal.name}!`];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}