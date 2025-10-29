import { Animal, Move, MoveCategory } from '../types/animal.js';
import { animalDatabase } from '../data/animal-database-manager.js';

export interface MoveLearnResult {
  success: boolean;
  moveReplaced?: Move;
  error?: string;
}

export interface MoveTutor {
  id: string;
  name: string;
  location: string;
  availableMoves: string[];
  cost: number;
  requirements: MoveTutorRequirement[];
}

export interface MoveTutorRequirement {
  type: 'level' | 'badge' | 'friendship' | 'currency';
  value: any;
  description: string;
}

export class MoveLearningSystem {
  /**
   * Get moves an animal can learn at its current level
   */
  public static getLearnableMoves(animal: Animal): Move[] {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species) return [];

    const allMoves = animalDatabase.getMovesForSpecies(species.id);
    
    return allMoves.filter(move => {
      // Can learn if at or above learn level and doesn't already know it
      return move.learnLevel <= animal.level && 
             !animal.moves.find(knownMove => knownMove.id === move.id);
    });
  }

  /**
   * Get moves an animal will learn at future levels
   */
  public static getFutureMoves(animal: Animal, maxLevel: number = 100): Move[] {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species) return [];

    const allMoves = animalDatabase.getMovesForSpecies(species.id);
    
    return allMoves.filter(move => {
      return move.learnLevel > animal.level && 
             move.learnLevel <= maxLevel &&
             !animal.moves.find(knownMove => knownMove.id === move.id);
    });
  }

  /**
   * Learn a move naturally (level up)
   */
  public static learnMoveNaturally(animal: Animal, move: Move, replaceIndex?: number): MoveLearnResult {
    try {
      if (animal.moves.length < 4) {
        // Animal has space for new move
        animal.moves.push(move);
        return { success: true };
      } else if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < 4) {
        // Replace existing move
        const replacedMove = animal.moves[replaceIndex];
        animal.moves[replaceIndex] = move;
        return { success: true, moveReplaced: replacedMove };
      } else {
        return { success: false, error: 'No space for new move and no replacement specified' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to learn move' 
      };
    }
  }

  /**
   * Learn a move from a move tutor
   */
  public static learnMoveFromTutor(
    animal: Animal, 
    move: Move, 
    tutor: MoveTutor,
    replaceIndex?: number
  ): MoveLearnResult {
    try {
      // Check if tutor can teach this move
      if (!tutor.availableMoves.includes(move.id)) {
        return { success: false, error: 'Move tutor cannot teach this move' };
      }

      // Check requirements (this would need trainer context in real implementation)
      // For now, just check basic requirements
      
      return this.learnMoveNaturally(animal, move, replaceIndex);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to learn move from tutor' 
      };
    }
  }

  /**
   * Forget a move
   */
  public static forgetMove(animal: Animal, moveIndex: number): MoveLearnResult {
    try {
      if (moveIndex < 0 || moveIndex >= animal.moves.length) {
        return { success: false, error: 'Invalid move index' };
      }

      const forgottenMove = animal.moves.splice(moveIndex, 1)[0];
      return { success: true, moveReplaced: forgottenMove };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to forget move' 
      };
    }
  }

  /**
   * Get move compatibility score for an animal
   */
  public static getMoveCompatibility(animal: Animal, move: Move): number {
    let compatibility = 0.5; // Base compatibility

    // Type matching bonus
    if (animal.type.includes(move.type)) {
      compatibility += 0.3;
    }

    // Stat alignment bonus
    if (move.category === MoveCategory.PHYSICAL && animal.stats.attack > animal.stats.intelligence) {
      compatibility += 0.1;
    } else if (move.category === MoveCategory.SPECIAL && animal.stats.intelligence > animal.stats.attack) {
      compatibility += 0.1;
    }

    // Power vs level appropriateness
    const expectedPower = Math.min(120, 40 + (animal.level * 2));
    const powerDiff = Math.abs(move.power - expectedPower);
    if (powerDiff < 20) {
      compatibility += 0.1;
    }

    return Math.min(1.0, compatibility);
  }

  /**
   * Get recommended moves for an animal
   */
  public static getRecommendedMoves(animal: Animal, count: number = 4): Move[] {
    const learnableMoves = this.getLearnableMoves(animal);
    
    // Score moves by compatibility
    const scoredMoves = learnableMoves.map(move => ({
      move,
      score: this.getMoveCompatibility(animal, move)
    }));

    // Sort by score and return top moves
    scoredMoves.sort((a, b) => b.score - a.score);
    
    return scoredMoves.slice(0, count).map(sm => sm.move);
  }

  /**
   * Get move tutors available in a location
   */
  public static getMoveTutorsInLocation(location: string): MoveTutor[] {
    // This would be loaded from a database in a real implementation
    const tutors: MoveTutor[] = [
      {
        id: 'forest_elder',
        name: 'Forest Elder',
        location: 'Ancient Forest',
        availableMoves: ['leaf_storm', 'nature_power', 'forest_blessing'],
        cost: 100,
        requirements: [
          { type: 'level', value: 20, description: 'Trainer must be level 20+' },
          { type: 'badge', value: 'forest_badge', description: 'Must have Forest Badge' }
        ]
      },
      {
        id: 'ocean_sage',
        name: 'Ocean Sage',
        location: 'Deep Sea Cavern',
        availableMoves: ['tidal_wave', 'whirlpool', 'ocean_current'],
        cost: 150,
        requirements: [
          { type: 'level', value: 25, description: 'Trainer must be level 25+' },
          { type: 'badge', value: 'ocean_badge', description: 'Must have Ocean Badge' }
        ]
      }
    ];

    return tutors.filter(tutor => tutor.location === location);
  }

  /**
   * Calculate move learning cost
   */
  public static getMoveLearningCost(move: Move, method: 'tutor' | 'tm' | 'natural'): number {
    switch (method) {
      case 'natural':
        return 0; // Free when learned naturally
      case 'tutor':
        return Math.floor(move.power * 2 + 50); // Based on move power
      case 'tm':
        return Math.floor(move.power * 1.5 + 25); // Slightly cheaper than tutor
      default:
        return 0;
    }
  }

  /**
   * Check if animal can learn a specific move
   */
  public static canLearnMove(animal: Animal, move: Move): boolean {
    const species = animalDatabase.getAnimalById(animal.speciesId);
    if (!species) return false;

    const learnableMoves = animalDatabase.getMovesForSpecies(species.id);
    return learnableMoves.some(m => m.id === move.id && m.learnLevel <= animal.level);
  }

  /**
   * Get move learning history for an animal
   */
  public static getMoveHistory(animal: Animal): { move: Move; learnedAt: Date; method: string }[] {
    // This would be tracked in the animal's data in a real implementation
    // For now, return empty array
    return [];
  }

  /**
   * Validate move set for competitive play
   */
  public static validateMoveSet(moves: Move[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (moves.length === 0) {
      issues.push('Animal must know at least one move');
    }

    if (moves.length > 4) {
      issues.push('Animal cannot know more than 4 moves');
    }

    // Check for duplicate moves
    const moveIds = moves.map(m => m.id);
    const uniqueIds = new Set(moveIds);
    if (uniqueIds.size !== moveIds.length) {
      issues.push('Animal cannot know duplicate moves');
    }

    // Check for illegal move combinations (if any exist)
    // This would be implemented based on game rules

    return {
      valid: issues.length === 0,
      issues
    };
  }
}