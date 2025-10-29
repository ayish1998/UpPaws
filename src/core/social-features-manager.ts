import { RedisClient } from '../storage/redis-client.js';
import { TradingSystem } from './trading-system.js';
import { MarketplaceSystem } from './marketplace-system.js';
import { CommunityChallengeSystem } from './community-challenge-system.js';
import { RedditIntegrationSystem } from './reddit-integration-system.js';
import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';

export class SocialFeaturesManager {
  private redis: RedisClient;
  private tradingSystem: TradingSystem;
  private marketplaceSystem: MarketplaceSystem;
  private challengeSystem: CommunityChallengeSystem;
  private redditSystem: RedditIntegrationSystem;

  constructor(redis: RedisClient) {
    this.redis = redis;
    this.tradingSystem = new TradingSystem(redis);
    this.marketplaceSystem = new MarketplaceSystem(redis, this.tradingSystem);
    this.challengeSystem = new CommunityChallengeSystem(redis);
    this.redditSystem = new RedditIntegrationSystem(redis);
  }

  // Auto-posting features
  async autoPostDailyLeaderboard(subredditId: string): Promise<void> {
    const subredditConfig = await this.redditSystem.getSubredditCustomization(subredditId);
    if (!subredditConfig?.settings.autoPostSettings.dailyLeaderboard) {
      return;
    }

    const leaderboards = await this.challengeSystem.getTopLeaderboards(3);
    if (leaderboards.length === 0) {
      return;
    }

    // Create and post daily leaderboard summary
    const content = this.generateLeaderboardSummary(leaderboards);
    const post = {
      title: '📊 Daily Leaderboard Update',
      content,
      subredditId,
      authorId: 'system',
      authorUsername: 'UpPaws Bot',
      postType: 'leaderboard_update' as any,
      metadata: { leaderboards },
      createdAt: new Date(),
      upvotes: 0,
      comments: 0
    };

    await this.redis.set(`reddit_post:daily_${subredditId}_${Date.now()}`, JSON.stringify(post));
  }

  async autoPostAchievementUnlock(trainerId: string, achievementId: string): Promise<void> {
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) return;

    const trainer: TrainerProfile = JSON.parse(trainerData);
    const achievement = trainer.achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    // Check if this is a notable achievement worth auto-posting
    const isNotable = this.isNotableAchievement(achievement);
    if (!isNotable) return;

    // Get trainer's active subreddits
    const subredditIds = await this.redis.smembers(`trainer_subreddits:${trainerId}`);
    
    for (const subredditId of subredditIds) {
      const config = await this.redditSystem.getSubredditCustomization(subredditId);
      if (config?.settings.autoPostSettings.newAchievements) {
        await this.redditSystem.shareAchievement(trainerId, achievementId, subredditId);
      }
    }
  }

  async autoPostBattleHighlight(battleId: string): Promise<void> {
    const battleData = await this.redis.get(`battle:${battleId}`);
    if (!battleData) return;

    const battle = JSON.parse(battleData);
    
    // Check if battle is worth highlighting
    const isHighlight = this.isBattleHighlight(battle);
    if (!isHighlight) return;

    // Create battle replay
    const replay = await this.redditSystem.createBattleReplay(battleId);
    
    // Post to relevant subreddits
    for (const participant of battle.participants) {
      const subredditIds = await this.redis.smembers(`trainer_subreddits:${participant.trainerId}`);
      
      for (const subredditId of subredditIds) {
        const config = await this.redditSystem.getSubredditCustomization(subredditId);
        if (config?.settings.autoPostSettings.weeklyHighlights) {
          await this.redditSystem.shareBattleReplay(replay.id, subredditId);
        }
      }
    }
  }

  // Social interaction helpers
  async getFriendActivity(trainerId: string): Promise<any[]> {
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) return [];

    const trainer: TrainerProfile = JSON.parse(trainerData);
    const activities: any[] = [];

    // Get friend activities
    for (const friendId of trainer.socialData.friends) {
      const friendActivities = await this.getRecentActivity(friendId);
      activities.push(...friendActivities);
    }

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
  }

  async getRecommendedFriends(trainerId: string): Promise<TrainerProfile[]> {
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) return [];

    const trainer: TrainerProfile = JSON.parse(trainerData);
    const recommendations: TrainerProfile[] = [];

    // Get trainers with similar interests
    const similarTrainers = await this.findSimilarTrainers(trainer);
    recommendations.push(...similarTrainers);

    // Get trainers from same subreddits
    const subredditIds = await this.redis.smembers(`trainer_subreddits:${trainerId}`);
    for (const subredditId of subredditIds) {
      const subredditTrainers = await this.getActiveSubredditTrainers(subredditId);
      recommendations.push(...subredditTrainers.slice(0, 5));
    }

    // Remove duplicates and current friends
    const uniqueRecommendations = recommendations
      .filter((rec, index, self) => 
        self.findIndex(r => r.trainerId === rec.trainerId) === index
      )
      .filter(rec => 
        rec.trainerId !== trainerId && 
        !trainer.socialData.friends.includes(rec.trainerId)
      );

    return uniqueRecommendations.slice(0, 10);
  }

  async getSocialStats(trainerId: string): Promise<any> {
    const trainerData = await this.redis.get(`trainer:${trainerId}`);
    if (!trainerData) return null;

    const trainer: TrainerProfile = JSON.parse(trainerData);

    // Get trading stats
    const trades = await this.tradingSystem.getUserTrades(trainerId);
    const completedTrades = trades.filter(t => t.status === 'completed');

    // Get challenge participation
    const challengeIds = await this.redis.smembers(`user_challenges:${trainerId}`);
    const activeChallenges = [];
    for (const challengeId of challengeIds) {
      const challenge = await this.redis.get(`community_challenge:${challengeId}`);
      if (challenge) {
        const challengeData = JSON.parse(challenge);
        if (challengeData.status === 'active') {
          activeChallenges.push(challengeData);
        }
      }
    }

    // Get Reddit posts
    const postIds = await this.redis.smembers(`user_posts:${trainerId}`);

    return {
      friends: trainer.socialData.friends.length,
      reputation: trainer.socialData.reputationScore,
      socialRank: trainer.socialData.socialRank,
      completedTrades: completedTrades.length,
      activeChallenges: activeChallenges.length,
      redditPosts: postIds.length,
      mentees: trainer.socialData.menteeIds.length,
      hasMentor: !!trainer.socialData.mentorId
    };
  }

  // Helper methods
  private generateLeaderboardSummary(leaderboards: any[]): string {
    let content = '📊 **Daily Leaderboard Update**\n\n';
    
    leaderboards.forEach(leaderboard => {
      content += `**${leaderboard.name}**\n`;
      leaderboard.entries.slice(0, 5).forEach((entry: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        content += `${medal} ${entry.username}: ${entry.value}\n`;
      });
      content += '\n';
    });

    return content;
  }

  private isNotableAchievement(achievement: any): boolean {
    // Define criteria for notable achievements
    const notableCategories = ['legendary', 'epic', 'milestone'];
    return notableCategories.some(category => 
      achievement.category?.includes(category) || 
      achievement.name.toLowerCase().includes(category)
    );
  }

  private isBattleHighlight(battle: any): boolean {
    // Define criteria for battle highlights
    return battle.duration > 300 || // Long battles (5+ minutes)
           battle.participants.some((p: any) => p.level > 50) || // High level battles
           battle.type === 'tournament'; // Tournament battles
  }

  private async getRecentActivity(trainerId: string): Promise<any[]> {
    // Get recent activities for a trainer
    const activities = [];
    
    // Recent captures
    const recentCaptures = await this.redis.lrange(`recent_captures:${trainerId}`, 0, 5);
    activities.push(...recentCaptures.map(capture => ({
      type: 'capture',
      data: JSON.parse(capture),
      timestamp: new Date()
    })));

    // Recent battles
    const recentBattles = await this.redis.lrange(`recent_battles:${trainerId}`, 0, 5);
    activities.push(...recentBattles.map(battle => ({
      type: 'battle',
      data: JSON.parse(battle),
      timestamp: new Date()
    })));

    return activities;
  }

  private async findSimilarTrainers(trainer: TrainerProfile): Promise<TrainerProfile[]> {
    // Find trainers with similar specializations or favorite habitats
    const similarTrainers: TrainerProfile[] = [];
    
    // This would implement similarity matching logic
    // For now, return empty array as placeholder
    
    return similarTrainers;
  }

  private async getActiveSubredditTrainers(subredditId: string): Promise<TrainerProfile[]> {
    const trainerIds = await this.redis.smembers(`subreddit_trainers:${subredditId}`);
    const trainers: TrainerProfile[] = [];
    
    for (const trainerId of trainerIds.slice(0, 10)) {
      const trainerData = await this.redis.get(`trainer:${trainerId}`);
      if (trainerData) {
        trainers.push(JSON.parse(trainerData));
      }
    }
    
    return trainers;
  }

  // Public API methods
  getTradingSystem(): TradingSystem {
    return this.tradingSystem;
  }

  getMarketplaceSystem(): MarketplaceSystem {
    return this.marketplaceSystem;
  }

  getChallengeSystem(): CommunityChallengeSystem {
    return this.challengeSystem;
  }

  getRedditSystem(): RedditIntegrationSystem {
    return this.redditSystem;
  }
}