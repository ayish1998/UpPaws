/**
 * Integration tests for Reddit Platform Integration
 */

import { RedditIntegrationSystem } from '../../core/reddit-integration-system.js';
import { AutoRedditPostGenerator } from '../../core/reddit-post-generator.js';
import { EnhancedRedisClient } from '../../storage/redis-client.js';
import { TrainerProfile } from '../../types/trainer.js';
import { Animal } from '../../types/animal.js';
import { RedditPost, RedditPostType, ShowcaseCategory } from '../../types/reddit-integration.js';
import { HabitatType, Rarity, TrainerPath } from '../../types/common.js';

describe('Reddit Integration System', () => {
  let redditSystem: RedditIntegrationSystem;
  let postGenerator: AutoRedditPostGenerator;
  let mockRedis: jest.Mocked<EnhancedRedisClient>;
  let mockTrainer: TrainerProfile;
  let mockAnimals: Animal[];

  beforeEach(() => {
    // Create mock Redis client
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      hdel: jest.fn(),
      hgetall: jest.fn(),
      zadd: jest.fn(),
      zrange: jest.fn(),
      zrevrange: jest.fn(),
      zrem: jest.fn(),
      expire: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      srem: jest.fn()
    } as any;

    redditSystem = new RedditIntegrationSystem(mockRedis as any);
    postGenerator = AutoRedditPostGenerator.getInstance();

    // Create mock trainer and animals
    mockTrainer = createMockTrainer();
    mockAnimals = createMockAnimals();

    // Setup default mock responses
    mockRedis.get.mockImplementation((key: string) => {
      if (key.startsWith('trainer:')) {
        return Promise.resolve(JSON.stringify(mockTrainer));
      }
      if (key.startsWith('collection:')) {
        return Promise.resolve(JSON.stringify(mockAnimals));
      }
      return Promise.resolve(null);
    });

    mockRedis.set.mockResolvedValue(undefined);
    mockRedis.sadd.mockResolvedValue(1);
  });

  describe('Trainer Profile Sharing', () => {
    test('should create trainer profile share successfully', async () => {
      const profileShare = await redditSystem.createTrainerProfileShare('trainer123');

      expect(profileShare.trainerId).toBe('trainer123');
      expect(profileShare.username).toBe('TestTrainer');
      expect(profileShare.level).toBe(15);
      expect(profileShare.favoriteAnimals).toHaveLength(3);
      expect(profileShare.stats.totalAnimalsCapture).toBe(25);
      expect(profileShare.customization).toBeDefined();
    });

    test('should create trainer profile share with custom settings', async () => {
      const customization = {
        backgroundColor: '#2d3748',
        accentColor: '#38b2ac',
        motto: 'Gotta catch them all!'
      };

      const profileShare = await redditSystem.createTrainerProfileShare('trainer123', customization);

      expect(profileShare.customization.backgroundColor).toBe('#2d3748');
      expect(profileShare.customization.accentColor).toBe('#38b2ac');
      expect(profileShare.customization.motto).toBe('Gotta catch them all!');
    });

    test('should share trainer profile to Reddit', async () => {
      const post = await redditSystem.shareTrainerProfile('trainer123', 'subreddit1');

      expect(post.title).toContain('TestTrainer');
      expect(post.title).toContain('Level 15');
      expect(post.postType).toBe(RedditPostType.TRAINER_PROFILE);
      expect(post.authorId).toBe('trainer123');
      expect(post.content).toContain('Animals Captured: 25');
      expect(mockRedis.set).toHaveBeenCalledWith(
        `reddit_post:${post.id}`,
        JSON.stringify(post)
      );
    });

    test('should handle trainer not found error', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        redditSystem.createTrainerProfileShare('nonexistent')
      ).rejects.toThrow('Trainer not found');
    });
  });

  describe('Collection Showcase', () => {
    test('should create rare collection showcase', async () => {
      const showcase = await redditSystem.createCollectionShowcase(
        'trainer123',
        ShowcaseCategory.RARE_COLLECTION,
        'My Rare Animals',
        'Check out my rare animal collection!'
      );

      expect(showcase.trainerId).toBe('trainer123');
      expect(showcase.title).toBe('My Rare Animals');
      expect(showcase.category).toBe(ShowcaseCategory.RARE_COLLECTION);
      expect(showcase.animals.every(animal => 
        ['rare', 'epic', 'legendary'].includes(animal.rarity)
      )).toBe(true);
      expect(showcase.stats).toBeDefined();
    });

    test('should create shiny collection showcase', async () => {
      const showcase = await redditSystem.createCollectionShowcase(
        'trainer123',
        ShowcaseCategory.SHINY_COLLECTION,
        'Shiny Collection',
        'My shiny animals!'
      );

      expect(showcase.animals.every(animal => animal.shiny)).toBe(true);
    });

    test('should apply custom filters to showcase', async () => {
      const filters = {
        rarity: ['legendary'],
        minLevel: 10,
        habitats: [HabitatType.FOREST]
      };

      const showcase = await redditSystem.createCollectionShowcase(
        'trainer123',
        ShowcaseCategory.RARE_COLLECTION,
        'Filtered Collection',
        'Filtered animals',
        filters
      );

      expect(showcase.animals.every(animal => 
        animal.rarity === 'legendary' && 
        animal.level >= 10 &&
        animal.type.includes(HabitatType.FOREST)
      )).toBe(true);
    });

    test('should share collection showcase to Reddit', async () => {
      // First create a showcase
      const showcase = await redditSystem.createCollectionShowcase(
        'trainer123',
        ShowcaseCategory.RARE_COLLECTION,
        'My Rare Animals',
        'Amazing rare collection!'
      );

      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('collection_showcase:')) {
          return Promise.resolve(JSON.stringify(showcase));
        }
        if (key.startsWith('trainer:')) {
          return Promise.resolve(JSON.stringify(mockTrainer));
        }
        return Promise.resolve(null);
      });

      const post = await redditSystem.shareCollectionShowcase(showcase.id, 'subreddit1');

      expect(post.title).toContain('My Rare Animals');
      expect(post.postType).toBe(RedditPostType.COLLECTION_SHOWCASE);
      expect(post.content).toContain('Amazing rare collection!');
    });

    test('should handle showcase not found error', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        redditSystem.shareCollectionShowcase('nonexistent', 'subreddit1')
      ).rejects.toThrow('Showcase not found');
    });
  });

  describe('Battle Replay System', () => {
    test('should create battle replay', async () => {
      const mockBattle = {
        id: 'battle123',
        participants: [
          { trainerId: 'trainer1', username: 'Player1', team: [] },
          { trainerId: 'trainer2', username: 'Player2', team: [] }
        ],
        type: 'trainer',
        duration: 180,
        winnerId: 'trainer1'
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockBattle));

      const replay = await redditSystem.createBattleReplay('battle123');

      expect(replay.battleId).toBe('battle123');
      expect(replay.title).toContain('Player1 vs Player2');
      expect(replay.duration).toBe(180);
      expect(replay.winner).toBe('trainer1');
      expect(replay.shareableUrl).toContain('battle123');
      expect(replay.embeddedViewer).toBeDefined();
    });

    test('should share battle replay to Reddit', async () => {
      const mockReplay = {
        id: 'replay123',
        battleId: 'battle123',
        title: 'Epic Battle: Player1 vs Player2',
        description: 'An intense battle!',
        participants: [
          { trainerId: 'trainer1', username: 'Player1' }
        ],
        winner: 'trainer1',
        duration: 180,
        highlights: [
          { description: 'Critical hit!', timestamp: 45 }
        ],
        stats: { totalMoves: 12 },
        shareableUrl: 'https://uppaws.game/replay/battle123',
        embeddedViewer: {
          viewerUrl: 'https://uppaws.game/embed/replay/battle123',
          thumbnailUrl: 'https://uppaws.game/thumbnails/battle/battle123.jpg',
          duration: 180,
          keyMoments: [45, 90, 135],
          controls: {
            playPause: true,
            speedControl: true,
            jumpToMoments: true,
            fullscreen: true
          }
        }
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockReplay));

      const post = await redditSystem.shareBattleReplay('replay123', 'subreddit1');

      expect(post.title).toContain('Epic Battle: Player1 vs Player2');
      expect(post.postType).toBe(RedditPostType.BATTLE_REPLAY);
      expect(post.url).toBe('https://uppaws.game/replay/battle123');
      expect(post.content).toContain('Duration: 3:00');
    });

    test('should handle battle not found error', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        redditSystem.createBattleReplay('nonexistent')
      ).rejects.toThrow('Battle not found');
    });
  });

  describe('Achievement Sharing', () => {
    test('should share achievement to Reddit', async () => {
      const mockAchievement = {
        id: 'first_capture',
        name: 'First Capture',
        description: 'Capture your first animal',
        progress: 1,
        maxProgress: 1,
        unlockedAt: new Date()
      };

      const trainerWithAchievement = {
        ...mockTrainer,
        achievements: [mockAchievement]
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(trainerWithAchievement));

      const post = await redditSystem.shareAchievement(
        'trainer123',
        'first_capture',
        'subreddit1',
        'So excited about my first capture!'
      );

      expect(post.title).toContain('Achievement Unlocked: First Capture');
      expect(post.postType).toBe(RedditPostType.ACHIEVEMENT_SHARE);
      expect(post.content).toContain('So excited about my first capture!');
      expect(post.metadata.achievementId).toBe('first_capture');
    });

    test('should handle achievement not found error', async () => {
      await expect(
        redditSystem.shareAchievement('trainer123', 'nonexistent', 'subreddit1')
      ).rejects.toThrow('Achievement not found');
    });
  });

  describe('Subreddit Customization', () => {
    test('should setup subreddit customization', async () => {
      const config = {
        settings: {
          allowTrading: false,
          moderationLevel: 'strict' as any
        },
        theme: {
          primaryColor: '#e53e3e'
        }
      };

      const customization = await redditSystem.setupSubredditCustomization(
        'subreddit1',
        'TestSubreddit',
        'moderator1',
        config
      );

      expect(customization.subredditId).toBe('subreddit1');
      expect(customization.subredditName).toBe('TestSubreddit');
      expect(customization.settings.allowTrading).toBe(false);
      expect(customization.settings.moderationLevel).toBe('strict');
      expect(customization.theme.primaryColor).toBe('#e53e3e');
      expect(customization.gymLeader.trainerId).toBe('moderator1');
    });

    test('should get subreddit customization', async () => {
      const mockCustomization = {
        subredditId: 'subreddit1',
        subredditName: 'TestSubreddit',
        moderatorId: 'moderator1'
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockCustomization));

      const result = await redditSystem.getSubredditCustomization('subreddit1');

      expect(result).toEqual(mockCustomization);
      expect(mockRedis.get).toHaveBeenCalledWith('subreddit_config:subreddit1');
    });

    test('should return null for non-existent subreddit', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await redditSystem.getSubredditCustomization('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Post Generation', () => {
    test('should generate battle replay post', async () => {
      const mockReplay = {
        id: 'replay123',
        battleId: 'battle123',
        title: 'Epic Battle: Player1 vs Player2',
        description: 'An intense battle!',
        participants: [
          { trainerId: 'trainer1', username: 'Player1' }
        ],
        winner: 'trainer1',
        duration: 180,
        highlights: [
          { description: 'Critical hit!', timestamp: 45 }
        ],
        stats: { totalMoves: 12 },
        shareableUrl: 'https://uppaws.game/replay/battle123',
        embeddedViewer: {
          viewerUrl: 'https://uppaws.game/embed/replay/battle123',
          thumbnailUrl: 'https://uppaws.game/thumbnails/battle/battle123.jpg',
          duration: 180,
          keyMoments: [45, 90, 135],
          controls: {
            playPause: true,
            speedControl: true,
            jumpToMoments: true,
            fullscreen: true
          }
        }
      };

      const post = await postGenerator.generateBattleReplayPost(mockReplay, mockTrainer);

      expect(post.title).toContain('Battle Replay');
      expect(post.postType).toBe(RedditPostType.BATTLE_REPLAY);
      expect(post.content).toContain('Duration: 180 seconds');
      expect(post.url).toBe('https://uppaws.game/replay/battle123');
    });

    test('should generate collection showcase post', async () => {
      const mockShowcase = {
        id: 'showcase123',
        trainerId: 'trainer123',
        title: 'My Rare Collection',
        description: 'Amazing rare animals!',
        animals: mockAnimals.slice(0, 3),
        category: ShowcaseCategory.RARE_COLLECTION,
        filters: {},
        stats: {
          totalAnimals: 3,
          averageLevel: 12,
          completionPercentage: 15,
          rarityBreakdown: { rare: 2, legendary: 1 },
          habitatBreakdown: { forest: 2, ocean: 1 }
        },
        createdAt: new Date()
      };

      const post = await postGenerator.generateCollectionShowcasePost(mockShowcase, mockTrainer);

      expect(post.title).toContain('My Rare Collection');
      expect(post.postType).toBe(RedditPostType.COLLECTION_SHOWCASE);
      expect(post.content).toContain('Total Animals: 3');
      expect(post.content).toContain('Average Level: 12');
    });

    test('should generate achievement post', async () => {
      const mockAchievementPost = {
        achievementId: 'first_capture',
        trainerId: 'trainer123',
        username: 'TestTrainer',
        achievementName: 'First Capture',
        description: 'Capture your first animal',
        rarity: 'common',
        unlockedAt: new Date(),
        progress: { current: 1, total: 1, milestones: [] },
        celebrationStyle: { animation: 'confetti' },
        shareMessage: 'Got my first animal!'
      };

      const post = await postGenerator.generateAchievementPost(mockAchievementPost, mockTrainer);

      expect(post.title).toContain('TestTrainer unlocked: First Capture');
      expect(post.postType).toBe(RedditPostType.ACHIEVEMENT_SHARE);
      expect(post.content).toContain('Got my first animal!');
    });

    test('should generate infographic URL', async () => {
      const infographicData = {
        type: 'collection' as const,
        title: 'My Collection Stats',
        data: { animals: mockAnimals },
        style: {
          theme: 'colorful' as const,
          primaryColor: '#FF6B35',
          secondaryColor: '#FFD700',
          layout: 'grid' as const
        }
      };

      const url = await postGenerator.generateInfographic(infographicData);

      expect(url).toContain('https://uppaws.reddit.com/infographic/');
      expect(url).toContain('.svg');
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        redditSystem.createTrainerProfileShare('trainer123')
      ).rejects.toThrow('Trainer not found');
    });

    test('should handle invalid JSON data', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      await expect(
        redditSystem.createTrainerProfileShare('trainer123')
      ).rejects.toThrow();
    });

    test('should handle storage write failures', async () => {
      mockRedis.set.mockRejectedValue(new Error('Storage write failed'));

      await expect(
        redditSystem.shareTrainerProfile('trainer123', 'subreddit1')
      ).rejects.toThrow('Storage write failed');
    });
  });

  describe('Data Persistence', () => {
    test('should persist Reddit posts correctly', async () => {
      const post = await redditSystem.shareTrainerProfile('trainer123', 'subreddit1');

      expect(mockRedis.set).toHaveBeenCalledWith(
        `reddit_post:${post.id}`,
        JSON.stringify(post)
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('user_posts:trainer123', post.id);
      expect(mockRedis.sadd).toHaveBeenCalledWith('subreddit_posts:subreddit1', post.id);
    });

    test('should persist collection showcases correctly', async () => {
      const showcase = await redditSystem.createCollectionShowcase(
        'trainer123',
        ShowcaseCategory.RARE_COLLECTION,
        'Test Showcase',
        'Test description'
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        `collection_showcase:${showcase.id}`,
        JSON.stringify(showcase)
      );
    });

    test('should persist subreddit configurations correctly', async () => {
      const customization = await redditSystem.setupSubredditCustomization(
        'subreddit1',
        'TestSubreddit',
        'moderator1',
        {}
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        'subreddit_config:subreddit1',
        JSON.stringify(customization)
      );
    });
  });
});

// Helper functions
function createMockTrainer(): TrainerProfile {
  return {
    username: 'TestTrainer',
    trainerId: 'trainer123',
    level: 15,
    experience: 2500,
    badges: [
      {
        id: 'forest_badge',
        name: 'Forest Badge',
        description: 'Forest mastery',
        habitatType: HabitatType.FOREST,
        earnedAt: new Date(),
        gymLeader: 'Ranger Oak'
      }
    ],
    specialization: TrainerPath.RESEARCH,
    stats: {
      totalAnimalsCapture: 25,
      totalBattlesWon: 12,
      totalBattlesLost: 3,
      totalPuzzlesSolved: 50,
      totalHabitatsExplored: 4,
      currentStreak: 7,
      longestStreak: 15,
      totalPlayTime: 7200,
      favoriteHabitat: HabitatType.FOREST
    },
    inventory: [],
    currency: { pawCoins: 2500, researchPoints: 1200, battleTokens: 300 },
    achievements: [],
    preferences: {
      theme: 'forest',
      soundEnabled: true,
      animationsEnabled: true,
      notificationsEnabled: true,
      privacySettings: {
        showProfile: true,
        showCollection: true,
        showStats: true,
        allowTrading: true,
        allowBattleRequests: true
      },
      gameplaySettings: {
        difficulty: 2,
        autoSave: true,
        hintPreference: 'minimal',
        battleAnimationSpeed: 1.2
      }
    },
    socialData: {
      friends: ['friend1', 'friend2'],
      blockedUsers: [],
      menteeIds: [],
      reputationScore: 150,
      socialRank: 'experienced'
    },
    createdAt: new Date('2024-01-01'),
    lastActiveAt: new Date()
  };
}

function createMockAnimals(): Animal[] {
  return [
    {
      id: 'animal1',
      speciesId: 'wolf',
      name: 'Wolf',
      level: 15,
      experience: 1500,
      stats: {
        health: 200,
        attack: 160,
        defense: 140,
        speed: 150,
        intelligence: 120,
        stamina: 130
      },
      moves: [
        { id: 'bite', name: 'Bite', type: HabitatType.FOREST, power: 60, accuracy: 100, description: 'A powerful bite' }
      ],
      type: [HabitatType.FOREST],
      rarity: Rarity.RARE,
      shiny: false,
      evolutionStage: 2,
      captureDate: new Date('2024-01-15'),
      trainerId: 'trainer123',
      individualValues: {
        health: 20,
        attack: 18,
        defense: 15,
        speed: 19,
        intelligence: 12,
        stamina: 16
      },
      emoji: '🐺'
    },
    {
      id: 'animal2',
      speciesId: 'eagle',
      name: 'Golden Eagle',
      level: 12,
      experience: 1200,
      stats: {
        health: 160,
        attack: 140,
        defense: 110,
        speed: 180,
        intelligence: 150,
        stamina: 120
      },
      moves: [
        { id: 'dive', name: 'Dive', type: HabitatType.MOUNTAIN, power: 70, accuracy: 95, description: 'A diving attack' }
      ],
      type: [HabitatType.MOUNTAIN],
      rarity: Rarity.LEGENDARY,
      shiny: true,
      evolutionStage: 1,
      captureDate: new Date('2024-01-20'),
      trainerId: 'trainer123',
      individualValues: {
        health: 22,
        attack: 20,
        defense: 14,
        speed: 25,
        intelligence: 18,
        stamina: 15
      },
      emoji: '🦅'
    },
    {
      id: 'animal3',
      speciesId: 'shark',
      name: 'Great White Shark',
      level: 18,
      experience: 1800,
      stats: {
        health: 250,
        attack: 200,
        defense: 160,
        speed: 170,
        intelligence: 100,
        stamina: 180
      },
      moves: [
        { id: 'chomp', name: 'Chomp', type: HabitatType.OCEAN, power: 80, accuracy: 100, description: 'A devastating bite' }
      ],
      type: [HabitatType.OCEAN],
      rarity: Rarity.RARE,
      shiny: false,
      evolutionStage: 3,
      captureDate: new Date('2024-01-25'),
      trainerId: 'trainer123',
      individualValues: {
        health: 25,
        attack: 24,
        defense: 18,
        speed: 20,
        intelligence: 10,
        stamina: 22
      },
      emoji: '🦈'
    }
  ];
}