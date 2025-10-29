import { Animal } from '../types/animal.js';
import { TrainerProfile } from '../types/trainer.js';
import { BattleReplay, CollectionShowcase, ShowcaseCategory, AchievementPost } from '../types/reddit-integration.js';
import { Achievement } from '../types/common.js';

export interface ContentCreationService {
  createBattleReplay(battleId: string, trainerId: string): Promise<BattleReplay>;
  createCollectionShowcase(trainerId: string, category: ShowcaseCategory, animals: Animal[]): Promise<CollectionShowcase>;
  createAchievementPost(trainerId: string, achievement: Achievement): Promise<AchievementPost>;
  generateStrategyGuide(trainerId: string, content: StrategyGuideContent): Promise<StrategyGuide>;
  submitFanArt(trainerId: string, artwork: FanArtSubmission): Promise<FanArtEntry>;
}

export interface StrategyGuideContent {
  title: string;
  description: string;
  category: StrategyCategory;
  sections: StrategySection[];
  recommendedAnimals: Animal[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export enum StrategyCategory {
  BATTLE_TACTICS = 'battle_tactics',
  ANIMAL_TRAINING = 'animal_training',
  HABITAT_EXPLORATION = 'habitat_exploration',
  PUZZLE_SOLVING = 'puzzle_solving',
  COLLECTION_BUILDING = 'collection_building'
}

export interface StrategySection {
  title: string;
  content: string;
  images?: string[];
  examples?: StrategyExample[];
}

export interface StrategyExample {
  scenario: string;
  solution: string;
  animals?: Animal[];
  outcome: string;
}

export interface StrategyGuide {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  description: string;
  category: StrategyCategory;
  content: StrategyGuideContent;
  rating: number;
  views: number;
  likes: number;
  comments: StrategyComment[];
  rewards: StrategyReward[];
  status: 'draft' | 'published' | 'featured';
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyComment {
  id: string;
  authorId: string;
  authorUsername: string;
  content: string;
  rating: number;
  helpful: boolean;
  createdAt: Date;
}

export interface StrategyReward {
  type: 'currency' | 'item' | 'achievement' | 'recognition';
  value: any;
  reason: string;
  awardedAt: Date;
}

export interface FanArtSubmission {
  title: string;
  description: string;
  category: FanArtCategory;
  imageUrl: string;
  animalFeatured?: Animal;
  tags: string[];
}

export enum FanArtCategory {
  ANIMAL_PORTRAIT = 'animal_portrait',
  HABITAT_SCENE = 'habitat_scene',
  BATTLE_ACTION = 'battle_action',
  TRAINER_PORTRAIT = 'trainer_portrait',
  COMIC_STRIP = 'comic_strip',
  CONCEPT_ART = 'concept_art'
}

export interface FanArtEntry {
  id: string;
  artistId: string;
  artistUsername: string;
  title: string;
  description: string;
  category: FanArtCategory;
  imageUrl: string;
  animalFeatured?: Animal;
  tags: string[];
  rating: number;
  views: number;
  likes: number;
  featured: boolean;
  rewards: FanArtReward[];
  status: 'pending' | 'approved' | 'featured' | 'rejected';
  createdAt: Date;
  moderatedAt?: Date;
}

export interface FanArtReward {
  type: 'currency' | 'item' | 'cosmetic' | 'recognition';
  value: any;
  reason: string;
  awardedAt: Date;
}

export class ContentCreationManager implements ContentCreationService {
  private static instance: ContentCreationManager;
  private battleReplays: Map<string, BattleReplay> = new Map();
  private collectionShowcases: Map<string, CollectionShowcase> = new Map();
  private achievementPosts: Map<string, AchievementPost> = new Map();
  private strategyGuides: Map<string, StrategyGuide> = new Map();
  private fanArtEntries: Map<string, FanArtEntry> = new Map();

  public static getInstance(): ContentCreationManager {
    if (!ContentCreationManager.instance) {
      ContentCreationManager.instance = new ContentCreationManager();
    }
    return ContentCreationManager.instance;
  }

  async createBattleReplay(battleId: string, trainerId: string): Promise<BattleReplay> {
    const replayId = `replay_${battleId}_${Date.now()}`;
    
    // Generate battle replay data (simplified for demo)
    const replay: BattleReplay = {
      id: replayId,
      battleId,
      title: `Epic Battle Replay`,
      description: `Watch this intense battle between skilled trainers!`,
      participants: [], // Would be populated from battle data
      winner: trainerId,
      duration: 180, // 3 minutes
      highlights: [
        {
          timestamp: 45,
          type: 'CRITICAL_HIT' as any,
          description: 'Critical hit landed!',
          participants: [trainerId]
        }
      ],
      stats: {
        totalMoves: 12,
        averageMoveTime: 15,
        mostUsedMove: 'Bite',
        damageDealt: { [trainerId]: 250 },
        accuracyRate: { [trainerId]: 0.85 }
      },
      shareableUrl: `https://uppaws.reddit.com/replay/${replayId}`,
      embeddedViewer: {
        viewerUrl: `https://uppaws.reddit.com/viewer/${replayId}`,
        thumbnailUrl: `https://uppaws.reddit.com/thumb/${replayId}`,
        duration: 180,
        keyMoments: [45, 120, 165],
        controls: {
          playPause: true,
          speedControl: true,
          jumpToMoments: true,
          fullscreen: true
        }
      }
    };

    this.battleReplays.set(replayId, replay);
    return replay;
  }

  async createCollectionShowcase(trainerId: string, category: ShowcaseCategory, animals: Animal[]): Promise<CollectionShowcase> {
    const showcaseId = `showcase_${trainerId}_${Date.now()}`;
    
    const showcase: CollectionShowcase = {
      id: showcaseId,
      trainerId,
      title: this.generateShowcaseTitle(category),
      description: this.generateShowcaseDescription(category, animals),
      animals,
      category,
      filters: this.generateShowcaseFilters(category, animals),
      stats: this.calculateShowcaseStats(animals),
      createdAt: new Date()
    };

    this.collectionShowcases.set(showcaseId, showcase);
    return showcase;
  }

  async createAchievementPost(trainerId: string, achievement: Achievement): Promise<AchievementPost> {
    const postId = `achievement_${trainerId}_${achievement.id}_${Date.now()}`;
    
    const post: AchievementPost = {
      achievementId: achievement.id,
      trainerId,
      username: '', // Would be populated from trainer profile
      achievementName: achievement.name,
      description: achievement.description,
      rarity: achievement.rarity || 'common',
      unlockedAt: new Date(),
      progress: {
        current: achievement.progress || 100,
        total: 100,
        milestones: []
      },
      celebrationStyle: {
        animation: 'sparkle',
        colors: ['#FFD700', '#FF6B35'],
        effects: ['confetti', 'glow'],
        duration: 3000
      },
      shareMessage: `🎉 Just unlocked the "${achievement.name}" achievement! ${achievement.description}`
    };

    this.achievementPosts.set(postId, post);
    return post;
  }

  async generateStrategyGuide(trainerId: string, content: StrategyGuideContent): Promise<StrategyGuide> {
    const guideId = `guide_${trainerId}_${Date.now()}`;
    
    const guide: StrategyGuide = {
      id: guideId,
      authorId: trainerId,
      authorUsername: '', // Would be populated from trainer profile
      title: content.title,
      description: content.description,
      category: content.category,
      content,
      rating: 0,
      views: 0,
      likes: 0,
      comments: [],
      rewards: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.strategyGuides.set(guideId, guide);
    return guide;
  }

  async submitFanArt(trainerId: string, artwork: FanArtSubmission): Promise<FanArtEntry> {
    const entryId = `fanart_${trainerId}_${Date.now()}`;
    
    const entry: FanArtEntry = {
      id: entryId,
      artistId: trainerId,
      artistUsername: '', // Would be populated from trainer profile
      title: artwork.title,
      description: artwork.description,
      category: artwork.category,
      imageUrl: artwork.imageUrl,
      animalFeatured: artwork.animalFeatured,
      tags: artwork.tags,
      rating: 0,
      views: 0,
      likes: 0,
      featured: false,
      rewards: [],
      status: 'pending',
      createdAt: new Date()
    };

    this.fanArtEntries.set(entryId, entry);
    return entry;
  }

  // Helper methods
  private generateShowcaseTitle(category: ShowcaseCategory): string {
    const titles = {
      [ShowcaseCategory.RARE_COLLECTION]: 'My Rare Animal Collection',
      [ShowcaseCategory.HABITAT_SPECIALISTS]: 'Habitat Specialists Showcase',
      [ShowcaseCategory.EVOLUTION_CHAINS]: 'Complete Evolution Chains',
      [ShowcaseCategory.SHINY_COLLECTION]: 'Shiny Animals Collection',
      [ShowcaseCategory.BATTLE_TEAM]: 'My Elite Battle Team',
      [ShowcaseCategory.RECENT_CAPTURES]: 'Recent Amazing Captures'
    };
    return titles[category];
  }

  private generateShowcaseDescription(category: ShowcaseCategory, animals: Animal[]): string {
    return `Check out my ${animals.length} amazing animals in this ${category.replace('_', ' ')} showcase!`;
  }

  private generateShowcaseFilters(category: ShowcaseCategory, animals: Animal[]): any {
    // Generate appropriate filters based on category and animals
    return {
      rarity: [...new Set(animals.map(a => a.rarity))],
      habitats: [...new Set(animals.flatMap(a => a.type))],
      minLevel: Math.min(...animals.map(a => a.level)),
      shinyOnly: category === ShowcaseCategory.SHINY_COLLECTION,
      recentOnly: category === ShowcaseCategory.RECENT_CAPTURES
    };
  }

  private calculateShowcaseStats(animals: Animal[]): any {
    const totalAnimals = animals.length;
    const averageLevel = animals.reduce((sum, a) => sum + a.level, 0) / totalAnimals;
    
    const rarityBreakdown: Record<string, number> = {};
    const habitatBreakdown: Record<string, number> = {};
    
    animals.forEach(animal => {
      rarityBreakdown[animal.rarity] = (rarityBreakdown[animal.rarity] || 0) + 1;
      animal.type.forEach(habitat => {
        habitatBreakdown[habitat] = (habitatBreakdown[habitat] || 0) + 1;
      });
    });

    return {
      totalAnimals,
      averageLevel: Math.round(averageLevel * 10) / 10,
      rarityBreakdown,
      habitatBreakdown,
      completionPercentage: 85 // Would be calculated based on total available animals
    };
  }

  // Public getter methods
  getBattleReplay(replayId: string): BattleReplay | undefined {
    return this.battleReplays.get(replayId);
  }

  getCollectionShowcase(showcaseId: string): CollectionShowcase | undefined {
    return this.collectionShowcases.get(showcaseId);
  }

  getStrategyGuide(guideId: string): StrategyGuide | undefined {
    return this.strategyGuides.get(guideId);
  }

  getFanArtEntry(entryId: string): FanArtEntry | undefined {
    return this.fanArtEntries.get(entryId);
  }

  getAllStrategyGuides(): StrategyGuide[] {
    return Array.from(this.strategyGuides.values());
  }

  getAllFanArt(): FanArtEntry[] {
    return Array.from(this.fanArtEntries.values());
  }

  getFeaturedContent(): { guides: StrategyGuide[], fanArt: FanArtEntry[] } {
    const featuredGuides = Array.from(this.strategyGuides.values())
      .filter(guide => guide.status === 'featured');
    const featuredFanArt = Array.from(this.fanArtEntries.values())
      .filter(art => art.featured);
    
    return { guides: featuredGuides, fanArt: featuredFanArt };
  }
}