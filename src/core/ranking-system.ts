import { TrainerProfile } from '../types/trainer.js';
import { Animal } from '../types/animal.js';

export interface RankingSystem {
  calculatePlayerRank(trainerId: string): Promise<PlayerRank>;
  updateRankAfterMatch(winnerId: string, loserId: string, matchType: MatchType): Promise<void>;
  getLeaderboard(category: RankingCategory, timeframe: TimeFrame): Promise<RankingEntry[]>;
  findMatchmakingOpponent(trainerId: string, preferences: MatchmakingPreferences): Promise<string | null>;
}

export interface PlayerRank {
  trainerId: string;
  overallRating: number;
  categoryRatings: Record<RankingCategory, number>;
  tier: RankTier;
  division: number;
  points: number;
  streak: number;
  seasonStats: SeasonStats;
  badges: RankBadge[];
}

export enum RankingCategory {
  OVERALL = 'overall',
  BATTLE = 'battle',
  PUZZLE = 'puzzle',
  COLLECTION = 'collection',
  TOURNAMENT = 'tournament'
}

export enum TimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  ALL_TIME = 'all_time'
}

export enum MatchType {
  CASUAL = 'casual',
  RANKED = 'ranked',
  TOURNAMENT = 'tournament',
  WEEKLY_CHALLENGE = 'weekly_challenge'
}

export enum RankTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
  CHAMPION = 'champion'
}

export interface RankingEntry {
  rank: number;
  trainerId: string;
  username: string;
  rating: number;
  tier: RankTier;
  division: number;
  change: number; // Change from previous period
  streak: number;
  gamesPlayed: number;
  winRate: number;
}

export interface SeasonStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  highestRating: number;
  currentStreak: number;
  longestStreak: number;
}

export interface RankBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  earnedAt: Date;
  category: RankingCategory;
}

export interface MatchmakingPreferences {
  gameMode: string;
  maxWaitTime: number;
  ratingRange: number;
  allowCrossRegion: boolean;
  preferredOpponentLevel?: number;
}

export interface MatchmakingResult {
  opponentId: string;
  estimatedMatchQuality: number;
  waitTime: number;
  ratingDifference: number;
}

export class CompetitiveRankingSystem implements RankingSystem {
  private static instance: CompetitiveRankingSystem;
  private playerRanks: Map<string, PlayerRank> = new Map();
  private matchHistory: Map<string, MatchRecord[]> = new Map();
  private leaderboards: Map<string, RankingEntry[]> = new Map();
  private matchmakingQueue: Map<string, MatchmakingRequest> = new Map();

  public static getInstance(): CompetitiveRankingSystem {
    if (!CompetitiveRankingSystem.instance) {
      CompetitiveRankingSystem.instance = new CompetitiveRankingSystem();
    }
    return CompetitiveRankingSystem.instance;
  }

  async calculatePlayerRank(trainerId: string): Promise<PlayerRank> {
    let rank = this.playerRanks.get(trainerId);
    
    if (!rank) {
      rank = this.createDefaultRank(trainerId);
      this.playerRanks.set(trainerId, rank);
    }

    // Recalculate based on recent performance
    const recentMatches = this.getRecentMatches(trainerId, 20);
    rank = this.updateRankFromMatches(rank, recentMatches);
    
    this.playerRanks.set(trainerId, rank);
    return rank;
  }

  async updateRankAfterMatch(winnerId: string, loserId: string, matchType: MatchType): Promise<void> {
    const winnerRank = await this.calculatePlayerRank(winnerId);
    const loserRank = await this.calculatePlayerRank(loserId);

    // Calculate rating changes using modified Elo system
    const ratingChange = this.calculateRatingChange(winnerRank, loserRank, matchType);
    
    // Update winner
    winnerRank.overallRating += ratingChange.winner;
    winnerRank.points += this.getPointsForWin(matchType);
    winnerRank.streak = winnerRank.streak > 0 ? winnerRank.streak + 1 : 1;
    winnerRank.seasonStats.wins++;
    winnerRank.seasonStats.gamesPlayed++;
    
    // Update loser
    loserRank.overallRating += ratingChange.loser; // This will be negative
    loserRank.streak = loserRank.streak < 0 ? loserRank.streak - 1 : -1;
    loserRank.seasonStats.losses++;
    loserRank.seasonStats.gamesPlayed++;

    // Update tiers and divisions
    this.updateTierAndDivision(winnerRank);
    this.updateTierAndDivision(loserRank);

    // Record match
    this.recordMatch(winnerId, loserId, matchType, ratingChange);

    // Update leaderboards
    this.updateLeaderboards();

    this.playerRanks.set(winnerId, winnerRank);
    this.playerRanks.set(loserId, loserRank);
  }

  async getLeaderboard(category: RankingCategory, timeframe: TimeFrame): Promise<RankingEntry[]> {
    const leaderboardKey = `${category}_${timeframe}`;
    let leaderboard = this.leaderboards.get(leaderboardKey);

    if (!leaderboard) {
      leaderboard = this.generateLeaderboard(category, timeframe);
      this.leaderboards.set(leaderboardKey, leaderboard);
    }

    return leaderboard;
  }

  async findMatchmakingOpponent(trainerId: string, preferences: MatchmakingPreferences): Promise<string | null> {
    const playerRank = await this.calculatePlayerRank(trainerId);
    const targetRating = playerRank.overallRating;
    const ratingRange = preferences.ratingRange || 100;

    // Find suitable opponents
    const potentialOpponents = Array.from(this.playerRanks.entries())
      .filter(([id, rank]) => {
        if (id === trainerId) return false;
        if (Math.abs(rank.overallRating - targetRating) > ratingRange) return false;
        if (this.matchmakingQueue.has(id)) return false; // Already in queue
        return true;
      })
      .sort(([, a], [, b]) => 
        Math.abs(a.overallRating - targetRating) - Math.abs(b.overallRating - targetRating)
      );

    if (potentialOpponents.length === 0) {
      // Add to matchmaking queue
      this.matchmakingQueue.set(trainerId, {
        trainerId,
        preferences,
        queuedAt: new Date(),
        rating: targetRating
      });
      return null;
    }

    // Return best match
    const [opponentId] = potentialOpponents[0];
    
    // Remove from queue if they were waiting
    this.matchmakingQueue.delete(opponentId);
    
    return opponentId;
  }

  // Skill-based matchmaking with quality estimation
  async findOptimalMatch(trainerId: string, preferences: MatchmakingPreferences): Promise<MatchmakingResult | null> {
    const opponentId = await this.findMatchmakingOpponent(trainerId, preferences);
    if (!opponentId) return null;

    const playerRank = await this.calculatePlayerRank(trainerId);
    const opponentRank = await this.calculatePlayerRank(opponentId);

    const ratingDifference = Math.abs(playerRank.overallRating - opponentRank.overallRating);
    const estimatedMatchQuality = Math.max(0, 100 - (ratingDifference / 10)); // 0-100 scale

    return {
      opponentId,
      estimatedMatchQuality,
      waitTime: 0, // Would be calculated based on queue time
      ratingDifference
    };
  }

  // Seasonal rank reset
  async resetSeasonalRanks(): Promise<void> {
    for (const [trainerId, rank] of this.playerRanks.entries()) {
      // Soft reset - reduce rating towards mean
      const newRating = Math.floor((rank.overallRating + 1000) / 2);
      
      rank.overallRating = newRating;
      rank.points = 0;
      rank.streak = 0;
      rank.seasonStats = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        highestRating: newRating,
        currentStreak: 0,
        longestStreak: 0
      };

      this.updateTierAndDivision(rank);
      this.playerRanks.set(trainerId, rank);
    }

    // Clear leaderboards
    this.leaderboards.clear();
  }

  // Private helper methods
  private createDefaultRank(trainerId: string): PlayerRank {
    return {
      trainerId,
      overallRating: 1000,
      categoryRatings: {
        [RankingCategory.OVERALL]: 1000,
        [RankingCategory.BATTLE]: 1000,
        [RankingCategory.PUZZLE]: 1000,
        [RankingCategory.COLLECTION]: 1000,
        [RankingCategory.TOURNAMENT]: 1000
      },
      tier: RankTier.BRONZE,
      division: 5,
      points: 0,
      streak: 0,
      seasonStats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        highestRating: 1000,
        currentStreak: 0,
        longestStreak: 0
      },
      badges: []
    };
  }

  private calculateRatingChange(winnerRank: PlayerRank, loserRank: PlayerRank, matchType: MatchType): { winner: number, loser: number } {
    const K = this.getKFactor(matchType);
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRank.overallRating - winnerRank.overallRating) / 400));
    const expectedLoser = 1 - expectedWinner;

    const winnerChange = Math.round(K * (1 - expectedWinner));
    const loserChange = Math.round(K * (0 - expectedLoser));

    return {
      winner: winnerChange,
      loser: loserChange
    };
  }

  private getKFactor(matchType: MatchType): number {
    switch (matchType) {
      case MatchType.CASUAL: return 16;
      case MatchType.RANKED: return 32;
      case MatchType.TOURNAMENT: return 48;
      case MatchType.WEEKLY_CHALLENGE: return 24;
      default: return 32;
    }
  }

  private getPointsForWin(matchType: MatchType): number {
    switch (matchType) {
      case MatchType.CASUAL: return 10;
      case MatchType.RANKED: return 25;
      case MatchType.TOURNAMENT: return 50;
      case MatchType.WEEKLY_CHALLENGE: return 35;
      default: return 25;
    }
  }

  private updateTierAndDivision(rank: PlayerRank): void {
    const rating = rank.overallRating;
    
    if (rating >= 2400) {
      rank.tier = RankTier.CHAMPION;
      rank.division = 1;
    } else if (rating >= 2200) {
      rank.tier = RankTier.GRANDMASTER;
      rank.division = Math.ceil((2400 - rating) / 50);
    } else if (rating >= 2000) {
      rank.tier = RankTier.MASTER;
      rank.division = Math.ceil((2200 - rating) / 50);
    } else if (rating >= 1800) {
      rank.tier = RankTier.DIAMOND;
      rank.division = Math.ceil((2000 - rating) / 50);
    } else if (rating >= 1600) {
      rank.tier = RankTier.PLATINUM;
      rank.division = Math.ceil((1800 - rating) / 50);
    } else if (rating >= 1400) {
      rank.tier = RankTier.GOLD;
      rank.division = Math.ceil((1600 - rating) / 50);
    } else if (rating >= 1200) {
      rank.tier = RankTier.SILVER;
      rank.division = Math.ceil((1400 - rating) / 50);
    } else {
      rank.tier = RankTier.BRONZE;
      rank.division = Math.ceil((1200 - rating) / 50);
    }

    // Update season high
    if (rating > rank.seasonStats.highestRating) {
      rank.seasonStats.highestRating = rating;
    }

    // Update win rate
    if (rank.seasonStats.gamesPlayed > 0) {
      rank.seasonStats.winRate = rank.seasonStats.wins / rank.seasonStats.gamesPlayed;
    }

    // Update streak records
    if (Math.abs(rank.streak) > Math.abs(rank.seasonStats.longestStreak)) {
      rank.seasonStats.longestStreak = rank.streak;
    }
    rank.seasonStats.currentStreak = rank.streak;
  }

  private recordMatch(winnerId: string, loserId: string, matchType: MatchType, ratingChange: { winner: number, loser: number }): void {
    const matchRecord: MatchRecord = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      winnerId,
      loserId,
      matchType,
      ratingChange,
      timestamp: new Date()
    };

    // Add to both players' history
    const winnerHistory = this.matchHistory.get(winnerId) || [];
    const loserHistory = this.matchHistory.get(loserId) || [];
    
    winnerHistory.push(matchRecord);
    loserHistory.push(matchRecord);
    
    // Keep only last 100 matches
    if (winnerHistory.length > 100) winnerHistory.shift();
    if (loserHistory.length > 100) loserHistory.shift();
    
    this.matchHistory.set(winnerId, winnerHistory);
    this.matchHistory.set(loserId, loserHistory);
  }

  private getRecentMatches(trainerId: string, count: number): MatchRecord[] {
    const history = this.matchHistory.get(trainerId) || [];
    return history.slice(-count);
  }

  private updateRankFromMatches(rank: PlayerRank, matches: MatchRecord[]): PlayerRank {
    // This could implement more sophisticated ranking based on recent performance
    // For now, we'll just ensure consistency
    return rank;
  }

  private generateLeaderboard(category: RankingCategory, timeframe: TimeFrame): RankingEntry[] {
    const entries = Array.from(this.playerRanks.entries())
      .map(([trainerId, rank]) => ({
        rank: 0, // Will be set after sorting
        trainerId,
        username: '', // Would be populated from trainer profile
        rating: rank.categoryRatings[category] || rank.overallRating,
        tier: rank.tier,
        division: rank.division,
        change: 0, // Would be calculated based on timeframe
        streak: rank.streak,
        gamesPlayed: rank.seasonStats.gamesPlayed,
        winRate: rank.seasonStats.winRate
      }))
      .sort((a, b) => b.rating - a.rating)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries.slice(0, 100); // Top 100
  }

  private updateLeaderboards(): void {
    // Update all leaderboards
    for (const category of Object.values(RankingCategory)) {
      for (const timeframe of Object.values(TimeFrame)) {
        const leaderboardKey = `${category}_${timeframe}`;
        const leaderboard = this.generateLeaderboard(category, timeframe);
        this.leaderboards.set(leaderboardKey, leaderboard);
      }
    }
  }

  // Public getters
  getPlayerRank(trainerId: string): PlayerRank | undefined {
    return this.playerRanks.get(trainerId);
  }

  getMatchHistory(trainerId: string): MatchRecord[] {
    return this.matchHistory.get(trainerId) || [];
  }

  getQueueStatus(): { totalInQueue: number, averageWaitTime: number } {
    const queueSize = this.matchmakingQueue.size;
    const averageWaitTime = queueSize > 0 ? 
      Array.from(this.matchmakingQueue.values())
        .reduce((sum, req) => sum + (Date.now() - req.queuedAt.getTime()), 0) / queueSize / 1000
      : 0;

    return {
      totalInQueue: queueSize,
      averageWaitTime: Math.round(averageWaitTime)
    };
  }
}

interface MatchRecord {
  id: string;
  winnerId: string;
  loserId: string;
  matchType: MatchType;
  ratingChange: { winner: number, loser: number };
  timestamp: Date;
}

interface MatchmakingRequest {
  trainerId: string;
  preferences: MatchmakingPreferences;
  queuedAt: Date;
  rating: number;
}