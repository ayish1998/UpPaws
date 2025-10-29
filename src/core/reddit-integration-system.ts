import { RedisClient } from '../storage/redis-client.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';
import { Achievement } from '../types/common.js';
import {
  RedditPost,
  RedditPostType,
  TrainerProfileShare,
  CollectionShowcase,
  ShowcaseCategory,
  BattleReplay,
  AchievementPost,
  SubredditCustomization,
  GymLeaderConfig
} from '../types/reddit-integration.js';

export class RedditIntegrationSystem {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  // Trainer Profile Sharing
  async createTrainerProfileShare(trainerId: string, customization?: Partial<any>): Promise<TrainerProfileShare> {
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) {
      throw new Error('Trainer not found');
    }

    const trainer: TrainerProfile = JSON.parse(trainerData);
    
    // Get trainer's favorite animals
    const collectionData = await this.redis.get(`collection:${trainerId}`);
    const collection = collectionData ? JSON.parse(collectionData) : [];
    const favoriteAnimals = collection
      .sort((a: Animal, b: Animal) => b.level - a.level)
      .slice(0, 6);

    const profileShare: TrainerProfileShare = {
      trainerId: trainer.trainerId,
      username: trainer.username,
      level: trainer.level,
      badges: trainer.badges.map(badge => badge.name),
      favoriteAnimals,
      stats: {
        totalAnimalsCapture: trainer.stats.totalAnimalsCapture,
        totalBattlesWon: trainer.stats.totalBattlesWon,
        currentStreak: trainer.stats.currentStreak,
        favoriteHabitat: trainer.stats.favoriteHabitat || 'forest',
        playtime: trainer.stats.totalPlayTime
      },
      achievements: trainer.achievements.slice(0, 10), // Top 10 achievements
      customization: {
        theme: trainer.preferences.theme,
        backgroundColor: customization?.backgroundColor || '#1a202c',
        accentColor: customization?.accentColor || '#ff6b35',
        displayBadges: trainer.badges.slice(0, 5).map(badge => badge.id),
        showcaseAnimals: favoriteAnimals.slice(0, 3),
        motto: customization?.motto
      }
    };

    return profileShare;
  }

  async shareTrainerProfile(trainerId: string, subredditId: string, customization?: any): Promise<RedditPost> {
    const profileShare = await this.createTrainerProfileShare(trainerId, customization);
    
    const post: RedditPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `🎮 Meet Trainer ${profileShare.username} - Level ${profileShare.level} Animal Master!`,
      content: this.generateProfileShareContent(profileShare),
      subredditId,
      authorId: trainerId,
      authorUsername: profileShare.username,
      postType: RedditPostType.TRAINER_PROFILE,
      metadata: {
        trainerId,
        customData: { profileShare }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0
    };

    await this.redis.set(`reddit_post:${post.id}`, JSON.stringify(post));
    await this.redis.sadd(`user_posts:${trainerId}`, post.id);
    await this.redis.sadd(`subreddit_posts:${subredditId}`, post.id);

    return post;
  }

  // Collection Showcase
  async createCollectionShowcase(
    trainerId: string,
    category: ShowcaseCategory,
    title: string,
    description: string,
    filters?: any
  ): Promise<CollectionShowcase> {
    const collectionData = await this.redis.get(`collection:${trainerId}`);
    if (!collectionData) {
      throw new Error('Collection not found');
    }

    let animals: Animal[] = JSON.parse(collectionData);

    // Apply category filters
    switch (category) {
      case ShowcaseCategory.RARE_COLLECTION:
        animals = animals.filter(animal => ['rare', 'epic', 'legendary'].includes(animal.rarity));
        break;
      case ShowcaseCategory.SHINY_COLLECTION:
        animals = animals.filter(animal => animal.shiny);
        break;
      case ShowcaseCategory.RECENT_CAPTURES:
        animals = animals
          .sort((a, b) => new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime())
          .slice(0, 20);
        break;
      case ShowcaseCategory.BATTLE_TEAM:
        // Get trainer's main battle team
        const battleTeamData = await this.redis.get(`battle_team:${trainerId}`);
        animals = battleTeamData ? JSON.parse(battleTeamData) : animals.slice(0, 6);
        break;
    }

    // Apply additional filters
    if (filters) {
      if (filters.rarity) {
        animals = animals.filter(animal => filters.rarity.includes(animal.rarity));
      }
      if (filters.habitats) {
        animals = animals.filter(animal => 
          animal.type.some(type => filters.habitats.includes(type))
        );
      }
      if (filters.minLevel) {
        animals = animals.filter(animal => animal.level >= filters.minLevel);
      }
      if (filters.shinyOnly) {
        animals = animals.filter(animal => animal.shiny);
      }
    }

    const showcase: CollectionShowcase = {
      id: `showcase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trainerId,
      title,
      description,
      animals: animals.slice(0, 50), // Limit to 50 animals
      category,
      filters: filters || {},
      stats: this.calculateShowcaseStats(animals),
      createdAt: new Date()
    };

    await this.redis.set(`collection_showcase:${showcase.id}`, JSON.stringify(showcase));
    return showcase;
  }

  async shareCollectionShowcase(showcaseId: string, subredditId: string): Promise<RedditPost> {
    const showcaseData = await this.redis.get(`collection_showcase:${showcaseId}`);
    if (!showcaseData) {
      throw new Error('Showcase not found');
    }

    const showcase: CollectionShowcase = JSON.parse(showcaseData);
    const trainerData = await this.redis.get(`trainer:${showcase.trainerId}`);
    const trainer = trainerData ? JSON.parse(trainerData) : null;

    const post: RedditPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `🏆 ${showcase.title} - ${showcase.animals.length} Amazing Animals!`,
      content: this.generateShowcaseContent(showcase),
      subredditId,
      authorId: showcase.trainerId,
      authorUsername: trainer?.username || 'Unknown Trainer',
      postType: RedditPostType.COLLECTION_SHOWCASE,
      metadata: {
        trainerId: showcase.trainerId,
        customData: { showcase }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0
    };

    await this.redis.set(`reddit_post:${post.id}`, JSON.stringify(post));
    await this.redis.sadd(`user_posts:${showcase.trainerId}`, post.id);
    await this.redis.sadd(`subreddit_posts:${subredditId}`, post.id);

    return post;
  }

  // Battle Replay System
  async createBattleReplay(battleId: string): Promise<BattleReplay> {
    const battleData = await this.redis.get(`battle:${battleId}`);
    if (!battleData) {
      throw new Error('Battle not found');
    }

    const battle = JSON.parse(battleData);
    
    const replay: BattleReplay = {
      id: `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      battleId,
      title: `Epic Battle: ${battle.participants[0].username} vs ${battle.participants[1].username}`,
      description: `An intense ${battle.type} battle that lasted ${Math.floor(battle.duration / 60)} minutes!`,
      participants: battle.participants.map((p: any) => ({
        trainerId: p.trainerId,
        username: p.username,
        team: p.team,
        finalScore: p.finalScore || 0
      })),
      winner: battle.winnerId,
      duration: battle.duration,
      highlights: this.extractBattleHighlights(battle),
      stats: this.calculateBattleStats(battle),
      shareableUrl: `https://uppaws.game/replay/${battleId}`,
      embeddedViewer: {
        viewerUrl: `https://uppaws.game/embed/replay/${battleId}`,
        thumbnailUrl: `https://uppaws.game/thumbnails/battle/${battleId}.jpg`,
        duration: battle.duration,
        keyMoments: this.extractKeyMoments(battle),
        controls: {
          playPause: true,
          speedControl: true,
          jumpToMoments: true,
          fullscreen: true
        }
      }
    };

    await this.redis.set(`battle_replay:${replay.id}`, JSON.stringify(replay));
    return replay;
  }

  async shareBattleReplay(replayId: string, subredditId: string): Promise<RedditPost> {
    const replayData = await this.redis.get(`battle_replay:${replayId}`);
    if (!replayData) {
      throw new Error('Battle replay not found');
    }

    const replay: BattleReplay = JSON.parse(replayData);

    const post: RedditPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `⚔️ ${replay.title} - Watch the Epic Battle!`,
      content: this.generateBattleReplayContent(replay),
      subredditId,
      authorId: replay.participants[0].trainerId,
      authorUsername: replay.participants[0].username,
      postType: RedditPostType.BATTLE_REPLAY,
      metadata: {
        battleId: replay.battleId,
        customData: { replay }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0,
      url: replay.shareableUrl
    };

    await this.redis.set(`reddit_post:${post.id}`, JSON.stringify(post));
    await this.redis.sadd(`user_posts:${replay.participants[0].trainerId}`, post.id);
    await this.redis.sadd(`subreddit_posts:${subredditId}`, post.id);

    return post;
  }

  // Achievement Sharing
  async shareAchievement(trainerId: string, achievementId: string, subredditId: string, customMessage?: string): Promise<RedditPost> {
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) {
      throw new Error('Trainer not found');
    }

    const trainer: TrainerProfile = JSON.parse(trainerData);
    const achievement = trainer.achievements.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const achievementPost: AchievementPost = {
      achievementId,
      trainerId,
      username: trainer.username,
      achievementName: achievement.name,
      description: achievement.description,
      rarity: this.getAchievementRarity(achievement),
      unlockedAt: achievement.unlockedAt,
      progress: {
        current: achievement.progress,
        total: achievement.maxProgress,
        milestones: []
      },
      celebrationStyle: this.getCelebrationStyle(achievement),
      shareMessage: customMessage || `Just unlocked the "${achievement.name}" achievement! 🎉`
    };

    const post: RedditPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `🏆 Achievement Unlocked: ${achievement.name}!`,
      content: this.generateAchievementContent(achievementPost),
      subredditId,
      authorId: trainerId,
      authorUsername: trainer.username,
      postType: RedditPostType.ACHIEVEMENT_SHARE,
      metadata: {
        trainerId,
        achievementId,
        customData: { achievementPost }
      },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0
    };

    await this.redis.set(`reddit_post:${post.id}`, JSON.stringify(post));
    await this.redis.sadd(`user_posts:${trainerId}`, post.id);
    await this.redis.sadd(`subreddit_posts:${subredditId}`, post.id);

    return post;
  }

  // Subreddit Customization
  async setupSubredditCustomization(
    subredditId: string,
    subredditName: string,
    moderatorId: string,
    config: Partial<SubredditCustomization>
  ): Promise<SubredditCustomization> {
    const customization: SubredditCustomization = {
      subredditId,
      subredditName,
      moderatorId,
      settings: {
        allowTrading: true,
        allowBattles: true,
        allowChallenges: true,
        moderationLevel: 'moderated' as any,
        autoPostSettings: {
          dailyLeaderboard: true,
          weeklyHighlights: true,
          challengeUpdates: true,
          tournamentResults: true,
          newAchievements: false
        },
        leaderboardSettings: {
          categories: ['daily_puzzles', 'battle_wins', 'animals_captured'],
          updateFrequency: 'daily',
          displayCount: 10,
          includeGlobal: false
        }
      },
      theme: {
        primaryColor: '#ff6b35',
        secondaryColor: '#4a5568',
        backgroundColor: '#1a202c'
      },
      features: {
        customChallenges: true,
        exclusiveAnimals: false,
        specialEvents: true,
        customBadges: true,
        mentorshipProgram: false
      },
      gymLeader: {
        trainerId: moderatorId,
        username: '',
        specialization: 'forest',
        team: [],
        badge: {
          id: `badge_${subredditId}`,
          name: `${subredditName} Champion`,
          description: `Defeat the ${subredditName} Gym Leader`,
          imageUrl: '',
          requirements: ['Defeat gym leader', 'Complete 5 battles']
        },
        challengeRules: {
          teamSize: 3,
          levelRestrictions: [{ min: 1, max: 50, applies: 'individual' }],
          habitatRestrictions: [],
          specialRules: []
        }
      },
      ...config
    };

    await this.redis.set(`subreddit_config:${subredditId}`, JSON.stringify(customization));
    return customization;
  }

  async getSubredditCustomization(subredditId: string): Promise<SubredditCustomization | null> {
    const data = await this.redis.get(`subreddit_config:${subredditId}`);
    return data ? JSON.parse(data) : null;
  }

  // Helper methods
  private generateProfileShareContent(profile: TrainerProfileShare): string {
    return `
🎮 **Trainer Profile: ${profile.username}**

**Level:** ${profile.level} | **Streak:** ${profile.stats.currentStreak} days

**Stats:**
- 🦎 Animals Captured: ${profile.stats.totalAnimalsCapture}
- ⚔️ Battles Won: ${profile.stats.totalBattlesWon}
- 🏞️ Favorite Habitat: ${profile.stats.favoriteHabitat}
- ⏱️ Playtime: ${Math.floor(profile.stats.playtime / 60)} hours

**Badges:** ${profile.badges.join(', ')}

**Featured Animals:**
${profile.favoriteAnimals.map(animal => `- ${animal.emoji} ${animal.name} (Level ${animal.level})`).join('\n')}

${profile.customization.motto ? `*"${profile.customization.motto}"*` : ''}
    `.trim();
  }

  private generateShowcaseContent(showcase: CollectionShowcase): string {
    return `
🏆 **${showcase.title}**

${showcase.description}

**Collection Stats:**
- 📊 Total Animals: ${showcase.stats.totalAnimals}
- 📈 Average Level: ${showcase.stats.averageLevel}
- 🌟 Completion: ${showcase.stats.completionPercentage}%

**Featured Animals:**
${showcase.animals.slice(0, 10).map(animal => 
  `- ${animal.emoji} ${animal.name} (Level ${animal.level}) ${animal.shiny ? '✨' : ''}`
).join('\n')}

${showcase.animals.length > 10 ? `...and ${showcase.animals.length - 10} more!` : ''}
    `.trim();
  }

  private generateBattleReplayContent(replay: BattleReplay): string {
    return `
⚔️ **${replay.title}**

${replay.description}

**Battle Stats:**
- ⏱️ Duration: ${Math.floor(replay.duration / 60)}:${(replay.duration % 60).toString().padStart(2, '0')}
- 🎯 Total Moves: ${replay.stats.totalMoves}
- 🏆 Winner: ${replay.participants.find(p => p.trainerId === replay.winner)?.username}

**Highlights:**
${replay.highlights.map(h => `- ${h.description}`).join('\n')}

[🎬 Watch Replay](${replay.shareableUrl})
    `.trim();
  }

  private generateAchievementContent(achievement: AchievementPost): string {
    return `
🏆 **Achievement Unlocked: ${achievement.achievementName}**

${achievement.description}

**Progress:** ${achievement.progress.current}/${achievement.progress.total}
**Rarity:** ${achievement.rarity}
**Unlocked:** ${achievement.unlockedAt.toLocaleDateString()}

${achievement.shareMessage}
    `.trim();
  }

  private calculateShowcaseStats(animals: Animal[]): any {
    const totalAnimals = animals.length;
    const averageLevel = animals.reduce((sum, animal) => sum + animal.level, 0) / totalAnimals;
    
    const rarityBreakdown: Record<string, number> = {};
    const habitatBreakdown: Record<string, number> = {};
    
    animals.forEach(animal => {
      rarityBreakdown[animal.rarity] = (rarityBreakdown[animal.rarity] || 0) + 1;
      animal.type.forEach(type => {
        habitatBreakdown[type] = (habitatBreakdown[type] || 0) + 1;
      });
    });

    return {
      totalAnimals,
      averageLevel: Math.round(averageLevel),
      rarityBreakdown,
      habitatBreakdown,
      completionPercentage: Math.round((totalAnimals / 500) * 100) // Assuming 500 total animals
    };
  }

  private extractBattleHighlights(battle: any): any[] {
    // Placeholder for battle highlight extraction
    return [];
  }

  private calculateBattleStats(battle: any): any {
    // Placeholder for battle stats calculation
    return {
      totalMoves: 0,
      averageMoveTime: 0,
      mostUsedMove: '',
      damageDealt: {},
      accuracyRate: {}
    };
  }

  private extractKeyMoments(battle: any): number[] {
    // Placeholder for key moments extraction
    return [];
  }

  private getAchievementRarity(achievement: Achievement): string {
    // Determine rarity based on achievement progress or category
    if (achievement.maxProgress >= 1000) return 'Legendary';
    if (achievement.maxProgress >= 100) return 'Epic';
    if (achievement.maxProgress >= 50) return 'Rare';
    return 'Common';
  }

  private getCelebrationStyle(achievement: Achievement): any {
    return {
      animation: 'confetti',
      colors: ['#ff6b35', '#ffd700', '#4a5568'],
      effects: ['sparkles', 'fireworks'],
      duration: 3000
    };
  }
}