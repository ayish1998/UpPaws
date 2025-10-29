import { TrainerProfile } from '../types/trainer.js';
import { Achievement } from '../types/common.js';
import { Animal } from '../types/animal.js';

export interface ShowcaseItem {
  id: string;
  type: ShowcaseType;
  title: string;
  description: string;
  imageUrl?: string;
  data: any;
  createdAt: Date;
  featured: boolean;
  shareCount: number;
  likes: number;
}

export enum ShowcaseType {
  ACHIEVEMENT = 'achievement',
  RARE_ANIMAL = 'rare_animal',
  COLLECTION_MILESTONE = 'collection_milestone',
  BATTLE_VICTORY = 'battle_victory',
  TRAINING_SUCCESS = 'training_success',
  SHINY_CAPTURE = 'shiny_capture',
  EVOLUTION = 'evolution',
  BREEDING_SUCCESS = 'breeding_success'
}

export interface ShowcaseTemplate {
  type: ShowcaseType;
  titleTemplate: string;
  descriptionTemplate: string;
  imageTemplate?: string;
  redditPostTemplate: string;
}

export class ShowcaseSystem {
  private static templates: Map<ShowcaseType, ShowcaseTemplate> = new Map();
  private static showcases: Map<string, ShowcaseItem[]> = new Map();

  /**
   * Initialize showcase system with templates
   */
  public static initialize(): void {
    this.loadShowcaseTemplates();
  }

  /**
   * Load showcase templates
   */
  private static loadShowcaseTemplates(): void {
    const templates: ShowcaseTemplate[] = [
      {
        type: ShowcaseType.ACHIEVEMENT,
        titleTemplate: '🏆 Achievement Unlocked: {achievementName}',
        descriptionTemplate: 'Just earned the "{achievementName}" achievement! {achievementDescription}',
        redditPostTemplate: '🏆 **Achievement Unlocked!** 🏆\n\n**{achievementName}**\n\n{achievementDescription}\n\nEarned on {date} after {progress} progress!\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.RARE_ANIMAL,
        titleTemplate: '✨ Rare {animalName} Captured!',
        descriptionTemplate: 'Just captured a rare {rarity} {animalName}! This amazing {habitat} animal is now part of my collection.',
        redditPostTemplate: '✨ **Rare Animal Captured!** ✨\n\n**{animalName}** ({rarity})\n\n{animalFact}\n\nLevel: {level} | Habitat: {habitat}\nCaptured in: {location}\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.SHINY_CAPTURE,
        titleTemplate: '🌟 SHINY {animalName} Found!',
        descriptionTemplate: 'Incredible luck! Just found and captured a shiny {animalName}! The odds were 1 in 4,096!',
        redditPostTemplate: '🌟 **SHINY ALERT!** 🌟\n\n**Shiny {animalName}**\n\nAfter {encounterCount} encounters, I finally found this beautiful shiny variant!\n\n{animalFact}\n\nLevel: {level} | Rarity: 1/4,096\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.COLLECTION_MILESTONE,
        titleTemplate: '📚 Collection Milestone: {count} Animals!',
        descriptionTemplate: 'My collection has reached {count} unique animal species! From {firstAnimal} to {latestAnimal}.',
        redditPostTemplate: '📚 **Collection Milestone!** 📚\n\n**{count} Unique Species Collected!**\n\nStarted with: {firstAnimal}\nLatest addition: {latestAnimal}\n\nFavorite habitat: {favoriteHabitat}\nRarest animal: {rarestAnimal}\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.BATTLE_VICTORY,
        titleTemplate: '⚔️ Epic Battle Victory!',
        descriptionTemplate: 'Just won an intense battle against {opponentName}! My {animalName} was the champion.',
        redditPostTemplate: '⚔️ **Epic Battle Victory!** ⚔️\n\n**vs {opponentName}**\n\nMy {animalName} (Level {level}) defeated their {opponentAnimal}!\n\nBattle duration: {duration}\nMoves used: {movesUsed}\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.TRAINING_SUCCESS,
        titleTemplate: '💪 Training Success: {animalName} Level {level}!',
        descriptionTemplate: 'My {animalName} just reached level {level} through dedicated training! {statsGained}',
        redditPostTemplate: '💪 **Training Success!** 💪\n\n**{animalName} reached Level {level}!**\n\nStats gained: {statsGained}\nNew moves learned: {newMoves}\nTraining method: {trainingMethod}\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.EVOLUTION,
        titleTemplate: '🔄 Evolution: {oldName} → {newName}!',
        descriptionTemplate: 'Amazing! My {oldName} just evolved into {newName}! The transformation was incredible.',
        redditPostTemplate: '🔄 **Evolution!** 🔄\n\n**{oldName} → {newName}**\n\nEvolution requirements met:\n{requirements}\n\nNew abilities: {newAbilities}\nStat changes: {statChanges}\n\n*Playing UpPaws: Animal Trainer*'
      },
      {
        type: ShowcaseType.BREEDING_SUCCESS,
        titleTemplate: '🥚 Breeding Success: New {animalName}!',
        descriptionTemplate: 'Successful breeding! {parent1Name} and {parent2Name} produced a beautiful {animalName} egg!',
        redditPostTemplate: '🥚 **Breeding Success!** 🥚\n\n**New {animalName} Egg!**\n\nParents: {parent1Name} + {parent2Name}\nCompatibility: {compatibility}\nInherited traits: {inheritedTraits}\n\nEgg steps to hatch: {eggSteps}\n\n*Playing UpPaws: Animal Trainer*'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  /**
   * Create a showcase item
   */
  public static createShowcase(
    trainerId: string,
    type: ShowcaseType,
    data: any,
    featured: boolean = false
  ): ShowcaseItem {
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`No template found for showcase type: ${type}`);
    }

    const showcase: ShowcaseItem = {
      id: `showcase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: this.fillTemplate(template.titleTemplate, data),
      description: this.fillTemplate(template.descriptionTemplate, data),
      imageUrl: template.imageTemplate ? this.fillTemplate(template.imageTemplate, data) : undefined,
      data,
      createdAt: new Date(),
      featured,
      shareCount: 0,
      likes: 0
    };

    // Add to trainer's showcases
    if (!this.showcases.has(trainerId)) {
      this.showcases.set(trainerId, []);
    }
    this.showcases.get(trainerId)!.push(showcase);

    return showcase;
  }

  /**
   * Fill template with data
   */
  private static fillTemplate(template: string, data: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Generate Reddit post content
   */
  public static generateRedditPost(showcase: ShowcaseItem): string {
    const template = this.templates.get(showcase.type);
    if (!template) {
      return `Check out my ${showcase.type} in UpPaws: Animal Trainer!\n\n${showcase.description}`;
    }

    return this.fillTemplate(template.redditPostTemplate, {
      ...showcase.data,
      date: showcase.createdAt.toLocaleDateString()
    });
  }

  /**
   * Create achievement showcase
   */
  public static createAchievementShowcase(
    trainerId: string,
    achievement: Achievement,
    trainer: TrainerProfile
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.ACHIEVEMENT, {
      achievementName: achievement.name,
      achievementDescription: achievement.description,
      progress: `${achievement.progress}/${achievement.maxProgress}`,
      trainerName: trainer.username,
      trainerLevel: trainer.level
    });
  }

  /**
   * Create rare animal showcase
   */
  public static createRareAnimalShowcase(
    trainerId: string,
    animal: Animal,
    location: string
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.RARE_ANIMAL, {
      animalName: animal.name,
      rarity: animal.rarity,
      habitat: animal.type.join(', '),
      level: animal.level,
      location,
      animalFact: `This ${animal.name} is a fascinating creature!` // Would come from database
    }, animal.rarity === 'legendary');
  }

  /**
   * Create shiny animal showcase
   */
  public static createShinyShowcase(
    trainerId: string,
    animal: Animal,
    encounterCount: number
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.SHINY_CAPTURE, {
      animalName: animal.name,
      level: animal.level,
      encounterCount,
      animalFact: `Shiny ${animal.name} have a unique coloration that makes them extremely rare!`
    }, true); // Shiny captures are always featured
  }

  /**
   * Create collection milestone showcase
   */
  public static createCollectionMilestoneShowcase(
    trainerId: string,
    count: number,
    firstAnimal: string,
    latestAnimal: string,
    favoriteHabitat: string,
    rarestAnimal: string
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.COLLECTION_MILESTONE, {
      count,
      firstAnimal,
      latestAnimal,
      favoriteHabitat,
      rarestAnimal
    }, count % 50 === 0); // Feature every 50 animals
  }

  /**
   * Create battle victory showcase
   */
  public static createBattleVictoryShowcase(
    trainerId: string,
    opponentName: string,
    winnerAnimal: Animal,
    opponentAnimal: string,
    duration: string,
    movesUsed: string[]
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.BATTLE_VICTORY, {
      opponentName,
      animalName: winnerAnimal.name,
      level: winnerAnimal.level,
      opponentAnimal,
      duration,
      movesUsed: movesUsed.join(', ')
    });
  }

  /**
   * Create training success showcase
   */
  public static createTrainingSuccessShowcase(
    trainerId: string,
    animal: Animal,
    statsGained: string,
    newMoves: string[],
    trainingMethod: string
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.TRAINING_SUCCESS, {
      animalName: animal.name,
      level: animal.level,
      statsGained,
      newMoves: newMoves.join(', '),
      trainingMethod
    }, animal.level >= 50); // Feature high-level training
  }

  /**
   * Create evolution showcase
   */
  public static createEvolutionShowcase(
    trainerId: string,
    oldName: string,
    newAnimal: Animal,
    requirements: string[],
    newAbilities: string[],
    statChanges: string
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.EVOLUTION, {
      oldName,
      newName: newAnimal.name,
      requirements: requirements.join('\n'),
      newAbilities: newAbilities.join(', '),
      statChanges
    }, true); // Evolutions are always featured
  }

  /**
   * Create breeding success showcase
   */
  public static createBreedingSuccessShowcase(
    trainerId: string,
    parent1: Animal,
    parent2: Animal,
    offspring: Animal,
    compatibility: string,
    inheritedTraits: string[],
    eggSteps: number
  ): ShowcaseItem {
    return this.createShowcase(trainerId, ShowcaseType.BREEDING_SUCCESS, {
      animalName: offspring.name,
      parent1Name: parent1.name,
      parent2Name: parent2.name,
      compatibility,
      inheritedTraits: inheritedTraits.join(', '),
      eggSteps
    });
  }

  /**
   * Get trainer's showcases
   */
  public static getTrainerShowcases(trainerId: string, limit?: number): ShowcaseItem[] {
    const showcases = this.showcases.get(trainerId) || [];
    const sorted = showcases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get featured showcases
   */
  public static getFeaturedShowcases(trainerId: string): ShowcaseItem[] {
    const showcases = this.showcases.get(trainerId) || [];
    return showcases.filter(s => s.featured);
  }

  /**
   * Share showcase (increment share count)
   */
  public static shareShowcase(showcaseId: string, trainerId: string): boolean {
    const showcases = this.showcases.get(trainerId);
    if (!showcases) return false;

    const showcase = showcases.find(s => s.id === showcaseId);
    if (!showcase) return false;

    showcase.shareCount++;
    return true;
  }

  /**
   * Like showcase
   */
  public static likeShowcase(showcaseId: string, trainerId: string): boolean {
    const showcases = this.showcases.get(trainerId);
    if (!showcases) return false;

    const showcase = showcases.find(s => s.id === showcaseId);
    if (!showcase) return false;

    showcase.likes++;
    return true;
  }

  /**
   * Get showcase statistics
   */
  public static getShowcaseStats(trainerId: string): {
    total: number;
    featured: number;
    totalShares: number;
    totalLikes: number;
    byType: Record<string, number>;
  } {
    const showcases = this.showcases.get(trainerId) || [];
    
    const stats = {
      total: showcases.length,
      featured: showcases.filter(s => s.featured).length,
      totalShares: showcases.reduce((sum, s) => sum + s.shareCount, 0),
      totalLikes: showcases.reduce((sum, s) => sum + s.likes, 0),
      byType: {} as Record<string, number>
    };

    // Count by type
    Object.values(ShowcaseType).forEach(type => {
      stats.byType[type] = showcases.filter(s => s.type === type).length;
    });

    return stats;
  }

  /**
   * Delete showcase
   */
  public static deleteShowcase(showcaseId: string, trainerId: string): boolean {
    const showcases = this.showcases.get(trainerId);
    if (!showcases) return false;

    const index = showcases.findIndex(s => s.id === showcaseId);
    if (index === -1) return false;

    showcases.splice(index, 1);
    return true;
  }

  /**
   * Get showcase by ID
   */
  public static getShowcase(showcaseId: string, trainerId: string): ShowcaseItem | null {
    const showcases = this.showcases.get(trainerId);
    if (!showcases) return null;

    return showcases.find(s => s.id === showcaseId) || null;
  }
}