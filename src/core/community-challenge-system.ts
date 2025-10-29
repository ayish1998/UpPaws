import { RedisClient } from '../storage/redis-client.js';
import {
  CommunityChallenge,
  ChallengeType,
  ChallengeScope,
  ChallengeStatus,
  ChallengeParticipant,
  Tournament,
  TournamentType,
  TournamentStatus,
  TournamentParticipant,
  Leaderboard,
  LeaderboardType,
  LeaderboardCategory,
  LeaderboardTimeframe,
  LeaderboardEntry,
  CommunityDiscovery,
  DiscoveryStatus
} from '../types/community.js';

export class CommunityChallengeSystem {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  // Community Challenges
  async createCommunityChallenge(challenge: Omit<CommunityChallenge, 'id' | 'participants' | 'progress'>): Promise<CommunityChallenge> {
    const communityChallenge: CommunityChallenge = {
      ...challenge,
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [],
      progress: {
        totalParticipants: 0,
        overallCompletion: 0,
        objectiveProgress: {},
        milestones: challenge.metadata.difficulty === 'easy' ? [] : challenge.objectives.map((obj, index) => ({
          id: `milestone_${index}`,
          name: `${obj.description} Milestone`,
          description: `Complete ${Math.floor(obj.target * 0.5)} of ${obj.description}`,
          threshold: Math.floor(obj.target * 0.5),
          reached: false,
          rewards: []
        }))
      }
    };

    await this.redis.set(`community_challenge:${communityChallenge.id}`, JSON.stringify(communityChallenge));
    
    // Add to active challenges
    if (communityChallenge.status === ChallengeStatus.ACTIVE) {
      await this.redis.sadd('active_challenges', communityChallenge.id);
    }
    
    // Add to subreddit challenges if applicable
    if (communityChallenge.subredditId) {
      await this.redis.sadd(`subreddit_challenges:${communityChallenge.subredditId}`, communityChallenge.id);
    }

    return communityChallenge;
  }

  async joinChallenge(challengeId: string, trainerId: string, username: string): Promise<boolean> {
    const challenge = await this.getCommunityChallenge(challengeId);
    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      return false;
    }

    // Check if already participating
    if (challenge.participants.some(p => p.trainerId === trainerId)) {
      return false;
    }

    // Check max participants
    if (challenge.metadata.maxParticipants && 
        challenge.participants.length >= challenge.metadata.maxParticipants) {
      return false;
    }

    const participant: ChallengeParticipant = {
      trainerId,
      username,
      joinedAt: new Date(),
      contribution: 0,
      personalProgress: {},
      rewardsClaimed: false
    };

    challenge.participants.push(participant);
    challenge.progress.totalParticipants = challenge.participants.length;

    await this.redis.set(`community_challenge:${challengeId}`, JSON.stringify(challenge));
    await this.redis.sadd(`user_challenges:${trainerId}`, challengeId);

    return true;
  }

  async updateChallengeProgress(challengeId: string, trainerId: string, objectiveId: string, progress: number): Promise<void> {
    const challenge = await this.getCommunityChallenge(challengeId);
    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      return;
    }

    const participant = challenge.participants.find(p => p.trainerId === trainerId);
    if (!participant) {
      return;
    }

    // Update personal progress
    participant.personalProgress[objectiveId] = (participant.personalProgress[objectiveId] || 0) + progress;
    participant.contribution += progress;

    // Update overall objective progress
    const objective = challenge.objectives.find(obj => obj.id === objectiveId);
    if (objective) {
      objective.current = challenge.participants.reduce((sum, p) => 
        sum + (p.personalProgress[objectiveId] || 0), 0);
      
      if (objective.current >= objective.target) {
        objective.completed = true;
      }
    }

    // Check milestones
    for (const milestone of challenge.progress.milestones) {
      if (!milestone.reached && objective && objective.current >= milestone.threshold) {
        milestone.reached = true;
        milestone.reachedAt = new Date();
        // Award milestone rewards to all participants
        await this.awardMilestoneRewards(challenge, milestone);
      }
    }

    // Update overall completion
    const completedObjectives = challenge.objectives.filter(obj => obj.completed).length;
    challenge.progress.overallCompletion = (completedObjectives / challenge.objectives.length) * 100;

    // Check if challenge is completed
    if (challenge.progress.overallCompletion === 100) {
      challenge.status = ChallengeStatus.COMPLETED;
      await this.completeCommunityChallenge(challenge);
    }

    await this.redis.set(`community_challenge:${challengeId}`, JSON.stringify(challenge));
  }

  async getActiveChallenges(subredditId?: string): Promise<CommunityChallenge[]> {
    let challengeIds: string[];
    
    if (subredditId) {
      challengeIds = await this.redis.smembers(`subreddit_challenges:${subredditId}`);
    } else {
      challengeIds = await this.redis.smembers('active_challenges');
    }

    const challenges: CommunityChallenge[] = [];
    for (const challengeId of challengeIds) {
      const challenge = await this.getCommunityChallenge(challengeId);
      if (challenge && challenge.status === ChallengeStatus.ACTIVE) {
        challenges.push(challenge);
      }
    }

    return challenges.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  // Tournament System
  async createTournament(tournament: Omit<Tournament, 'id' | 'participants' | 'brackets'>): Promise<Tournament> {
    const newTournament: Tournament = {
      ...tournament,
      id: `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [],
      brackets: []
    };

    await this.redis.set(`tournament:${newTournament.id}`, JSON.stringify(newTournament));
    
    if (newTournament.status === TournamentStatus.REGISTRATION) {
      await this.redis.sadd('active_tournaments', newTournament.id);
    }

    if (newTournament.subredditId) {
      await this.redis.sadd(`subreddit_tournaments:${newTournament.subredditId}`, newTournament.id);
    }

    return newTournament;
  }

  async registerForTournament(tournamentId: string, trainerId: string, username: string): Promise<boolean> {
    const tournament = await this.getTournament(tournamentId);
    if (!tournament || tournament.status !== TournamentStatus.REGISTRATION) {
      return false;
    }

    // Check registration deadline
    if (new Date() > tournament.registrationDeadline) {
      return false;
    }

    // Check if already registered
    if (tournament.participants.some(p => p.trainerId === trainerId)) {
      return false;
    }

    // Check max participants
    if (tournament.participants.length >= tournament.maxParticipants) {
      return false;
    }

    const participant: TournamentParticipant = {
      trainerId,
      username,
      registeredAt: new Date(),
      currentRound: 0,
      wins: 0,
      losses: 0,
      eliminated: false
    };

    tournament.participants.push(participant);
    await this.redis.set(`tournament:${tournamentId}`, JSON.stringify(tournament));
    await this.redis.sadd(`user_tournaments:${trainerId}`, tournamentId);

    return true;
  }

  async startTournament(tournamentId: string): Promise<boolean> {
    const tournament = await this.getTournament(tournamentId);
    if (!tournament || tournament.status !== TournamentStatus.REGISTRATION) {
      return false;
    }

    if (tournament.participants.length < 2) {
      return false;
    }

    // Generate brackets based on format
    tournament.brackets = await this.generateTournamentBrackets(tournament);
    tournament.status = TournamentStatus.IN_PROGRESS;

    await this.redis.set(`tournament:${tournamentId}`, JSON.stringify(tournament));
    return true;
  }

  // Leaderboard System
  async updateLeaderboard(
    type: LeaderboardType,
    category: LeaderboardCategory,
    timeframe: LeaderboardTimeframe,
    trainerId: string,
    username: string,
    value: number,
    subredditId?: string
  ): Promise<void> {
    const leaderboardId = this.getLeaderboardId(type, category, timeframe, subredditId);
    const leaderboard = await this.getLeaderboard(leaderboardId) || await this.createLeaderboard(
      leaderboardId, type, category, timeframe, subredditId
    );

    // Update or add entry
    let entry = leaderboard.entries.find(e => e.trainerId === trainerId);
    if (entry) {
      const oldValue = entry.value;
      entry.value = value;
      entry.change = value - oldValue;
    } else {
      entry = {
        rank: 0,
        trainerId,
        username,
        value,
        change: 0
      };
      leaderboard.entries.push(entry);
    }

    // Sort and update ranks
    leaderboard.entries.sort((a, b) => b.value - a.value);
    leaderboard.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    leaderboard.lastUpdated = new Date();
    await this.redis.set(`leaderboard:${leaderboardId}`, JSON.stringify(leaderboard));
  }

  async getLeaderboard(leaderboardId: string): Promise<Leaderboard | null> {
    const data = await this.redis.get(`leaderboard:${leaderboardId}`);
    return data ? JSON.parse(data) : null;
  }

  async getTopLeaderboards(limit: number = 10): Promise<Leaderboard[]> {
    const leaderboardKeys = await this.redis.keys('leaderboard:*');
    const leaderboards: Leaderboard[] = [];

    for (const key of leaderboardKeys.slice(0, limit)) {
      const data = await this.redis.get(key);
      if (data) {
        leaderboards.push(JSON.parse(data));
      }
    }

    return leaderboards.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  // Community Discovery System
  async createCommunityDiscovery(discovery: Omit<CommunityDiscovery, 'id' | 'communityProgress'>): Promise<CommunityDiscovery> {
    const communityDiscovery: CommunityDiscovery = {
      ...discovery,
      id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      communityProgress: 0
    };

    await this.redis.set(`community_discovery:${communityDiscovery.id}`, JSON.stringify(communityDiscovery));
    await this.redis.sadd('active_discoveries', communityDiscovery.id);

    return communityDiscovery;
  }

  async contributeToDiscovery(discoveryId: string, trainerId: string, contribution: number): Promise<void> {
    const discovery = await this.getCommunityDiscovery(discoveryId);
    if (!discovery || discovery.status === DiscoveryStatus.DISCOVERED) {
      return;
    }

    discovery.communityProgress += contribution;

    if (discovery.communityProgress >= discovery.requiredProgress) {
      discovery.status = DiscoveryStatus.DISCOVERED;
      discovery.discoveredAt = new Date();
      discovery.discoveredBy = discovery.discoveredBy || [];
      if (!discovery.discoveredBy.includes(trainerId)) {
        discovery.discoveredBy.push(trainerId);
      }
      
      // Award discovery rewards to all contributors
      await this.awardDiscoveryRewards(discovery);
    }

    await this.redis.set(`community_discovery:${discoveryId}`, JSON.stringify(discovery));
  }

  // Helper methods
  private async getCommunityChallenge(challengeId: string): Promise<CommunityChallenge | null> {
    const data = await this.redis.get(`community_challenge:${challengeId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getTournament(tournamentId: string): Promise<Tournament | null> {
    const data = await this.redis.get(`tournament:${tournamentId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getCommunityDiscovery(discoveryId: string): Promise<CommunityDiscovery | null> {
    const data = await this.redis.get(`community_discovery:${discoveryId}`);
    return data ? JSON.parse(data) : null;
  }

  private getLeaderboardId(
    type: LeaderboardType,
    category: LeaderboardCategory,
    timeframe: LeaderboardTimeframe,
    subredditId?: string
  ): string {
    const scope = subredditId ? `subreddit_${subredditId}` : 'global';
    return `${type}_${category}_${timeframe}_${scope}`;
  }

  private async createLeaderboard(
    id: string,
    type: LeaderboardType,
    category: LeaderboardCategory,
    timeframe: LeaderboardTimeframe,
    subredditId?: string
  ): Promise<Leaderboard> {
    const leaderboard: Leaderboard = {
      id,
      name: `${category} ${timeframe} Leaderboard`,
      description: `Top performers in ${category} for ${timeframe}`,
      type,
      scope: subredditId ? ChallengeScope.SUBREDDIT : ChallengeScope.GLOBAL,
      subredditId,
      category,
      timeframe,
      entries: [],
      lastUpdated: new Date()
    };

    await this.redis.set(`leaderboard:${id}`, JSON.stringify(leaderboard));
    return leaderboard;
  }

  private async generateTournamentBrackets(tournament: Tournament): Promise<any[]> {
    // Placeholder for bracket generation logic
    return [];
  }

  private async completeCommunityChallenge(challenge: CommunityChallenge): Promise<void> {
    // Award final rewards to all participants
    for (const participant of challenge.participants) {
      await this.awardChallengeRewards(challenge, participant.trainerId);
    }
  }

  private async awardMilestoneRewards(challenge: CommunityChallenge, milestone: any): Promise<void> {
    // Award milestone rewards to all participants
    console.log('Awarding milestone rewards:', milestone.id);
  }

  private async awardChallengeRewards(challenge: CommunityChallenge, trainerId: string): Promise<void> {
    // Award challenge completion rewards
    console.log('Awarding challenge rewards to:', trainerId);
  }

  private async awardDiscoveryRewards(discovery: CommunityDiscovery): Promise<void> {
    // Award discovery rewards to all contributors
    console.log('Awarding discovery rewards:', discovery.id);
  }
}