import { TrainerProfile } from '../types/trainer.js';
import { Currency, Achievement } from '../types/common.js';

export interface MentorshipSystem {
  createMentorProfile(trainerId: string, expertise: MentorExpertise[]): Promise<MentorProfile>;
  requestMentorship(menteeId: string, mentorId: string, focus: MentorshipFocus): Promise<MentorshipRequest>;
  acceptMentorshipRequest(requestId: string): Promise<MentorshipPair>;
  completeMentorshipSession(pairId: string, sessionData: MentorshipSession): Promise<void>;
  getMentorRecommendations(trainerId: string): Promise<MentorProfile[]>;
}

export interface MentorProfile {
  trainerId: string;
  username: string;
  expertise: MentorExpertise[];
  rating: number;
  totalMentees: number;
  activeMentees: number;
  maxMentees: number;
  availability: MentorAvailability;
  achievements: MentorAchievement[];
  reviews: MentorReview[];
  preferences: MentorPreferences;
  stats: MentorStats;
  createdAt: Date;
  lastActiveAt: Date;
}

export enum MentorExpertise {
  BATTLE_STRATEGY = 'battle_strategy',
  ANIMAL_COLLECTION = 'animal_collection',
  PUZZLE_SOLVING = 'puzzle_solving',
  HABITAT_EXPLORATION = 'habitat_exploration',
  TOURNAMENT_PLAY = 'tournament_play',
  TRADING = 'trading',
  COMMUNITY_BUILDING = 'community_building'
}

export interface MentorAvailability {
  isActive: boolean;
  timeZone: string;
  availableHours: TimeSlot[];
  preferredSessionLength: number; // in minutes
  responseTime: number; // average hours to respond
}

export interface TimeSlot {
  day: string; // 'monday', 'tuesday', etc.
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface MentorAchievement {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  category: MentorExpertise;
}

export interface MentorReview {
  id: string;
  menteeId: string;
  menteeName: string;
  rating: number; // 1-5 stars
  comment: string;
  focus: MentorshipFocus;
  createdAt: Date;
}

export interface MentorPreferences {
  preferredMenteeLevel: { min: number, max: number };
  focusAreas: MentorshipFocus[];
  sessionTypes: SessionType[];
  communicationStyle: 'formal' | 'casual' | 'adaptive';
  groupSessions: boolean;
}

export interface MentorStats {
  totalSessions: number;
  totalHours: number;
  successfulMentorships: number;
  averageRating: number;
  specializations: Record<MentorExpertise, number>;
}

export enum MentorshipFocus {
  BEGINNER_GUIDANCE = 'beginner_guidance',
  COMPETITIVE_IMPROVEMENT = 'competitive_improvement',
  COLLECTION_STRATEGY = 'collection_strategy',
  BATTLE_MASTERY = 'battle_mastery',
  COMMUNITY_LEADERSHIP = 'community_leadership',
  ADVANCED_TECHNIQUES = 'advanced_techniques'
}

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  menteeName: string;
  mentorId: string;
  mentorName: string;
  focus: MentorshipFocus;
  message: string;
  status: RequestStatus;
  createdAt: Date;
  respondedAt?: Date;
}

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export interface MentorshipPair {
  id: string;
  mentorId: string;
  menteeId: string;
  focus: MentorshipFocus;
  status: PairStatus;
  sessions: MentorshipSession[];
  goals: MentorshipGoal[];
  progress: MentorshipProgress;
  startedAt: Date;
  lastSessionAt?: Date;
  completedAt?: Date;
}

export enum PairStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface MentorshipSession {
  id: string;
  pairId: string;
  type: SessionType;
  duration: number; // in minutes
  topics: string[];
  notes: string;
  mentorFeedback: string;
  menteeFeedback: string;
  rating: number;
  scheduledAt: Date;
  completedAt: Date;
  resources: SessionResource[];
}

export enum SessionType {
  ONE_ON_ONE = 'one_on_one',
  GROUP_SESSION = 'group_session',
  PRACTICE_BATTLE = 'practice_battle',
  COLLECTION_REVIEW = 'collection_review',
  STRATEGY_DISCUSSION = 'strategy_discussion',
  GOAL_SETTING = 'goal_setting'
}

export interface SessionResource {
  type: 'guide' | 'video' | 'article' | 'tool';
  title: string;
  url: string;
  description: string;
}

export interface MentorshipGoal {
  id: string;
  description: string;
  category: MentorExpertise;
  targetValue: number;
  currentValue: number;
  deadline: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface MentorshipProgress {
  overallProgress: number; // 0-100
  goalsCompleted: number;
  totalGoals: number;
  skillImprovements: SkillImprovement[];
  milestones: ProgressMilestone[];
}

export interface SkillImprovement {
  skill: MentorExpertise;
  beforeRating: number;
  currentRating: number;
  improvement: number;
}

export interface ProgressMilestone {
  id: string;
  name: string;
  description: string;
  achievedAt: Date;
  rewards: MentorshipReward[];
}

export interface MentorshipReward {
  type: 'currency' | 'achievement' | 'title' | 'cosmetic';
  value: any;
  recipient: 'mentor' | 'mentee' | 'both';
}

export class MentorshipManager implements MentorshipSystem {
  private static instance: MentorshipManager;
  private mentors: Map<string, MentorProfile> = new Map();
  private mentorshipRequests: Map<string, MentorshipRequest> = new Map();
  private mentorshipPairs: Map<string, MentorshipPair> = new Map();
  private menteeIndex: Map<string, string[]> = new Map(); // menteeId -> pairIds[]

  public static getInstance(): MentorshipManager {
    if (!MentorshipManager.instance) {
      MentorshipManager.instance = new MentorshipManager();
    }
    return MentorshipManager.instance;
  }

  async createMentorProfile(trainerId: string, expertise: MentorExpertise[]): Promise<MentorProfile> {
    if (this.mentors.has(trainerId)) {
      throw new Error('Mentor profile already exists');
    }

    const mentorProfile: MentorProfile = {
      trainerId,
      username: '', // Would be populated from trainer profile
      expertise,
      rating: 5.0, // Start with perfect rating
      totalMentees: 0,
      activeMentees: 0,
      maxMentees: 3, // Default limit
      availability: {
        isActive: true,
        timeZone: 'UTC',
        availableHours: [
          { day: 'saturday', startHour: 10, endHour: 16 },
          { day: 'sunday', startHour: 10, endHour: 16 }
        ],
        preferredSessionLength: 60,
        responseTime: 24
      },
      achievements: [],
      reviews: [],
      preferences: {
        preferredMenteeLevel: { min: 1, max: 20 },
        focusAreas: [MentorshipFocus.BEGINNER_GUIDANCE],
        sessionTypes: [SessionType.ONE_ON_ONE, SessionType.STRATEGY_DISCUSSION],
        communicationStyle: 'adaptive',
        groupSessions: false
      },
      stats: {
        totalSessions: 0,
        totalHours: 0,
        successfulMentorships: 0,
        averageRating: 5.0,
        specializations: expertise.reduce((acc, exp) => ({ ...acc, [exp]: 0 }), {} as Record<MentorExpertise, number>)
      },
      createdAt: new Date(),
      lastActiveAt: new Date()
    };

    this.mentors.set(trainerId, mentorProfile);
    return mentorProfile;
  }

  async requestMentorship(menteeId: string, mentorId: string, focus: MentorshipFocus): Promise<MentorshipRequest> {
    const mentor = this.mentors.get(mentorId);
    if (!mentor || !mentor.availability.isActive) {
      throw new Error('Mentor not available');
    }

    if (mentor.activeMentees >= mentor.maxMentees) {
      throw new Error('Mentor has reached maximum mentee capacity');
    }

    const requestId = `request_${menteeId}_${mentorId}_${Date.now()}`;
    
    const request: MentorshipRequest = {
      id: requestId,
      menteeId,
      menteeName: '', // Would be populated from trainer profile
      mentorId,
      mentorName: mentor.username,
      focus,
      message: '', // Would come from request data
      status: RequestStatus.PENDING,
      createdAt: new Date()
    };

    this.mentorshipRequests.set(requestId, request);
    return request;
  }

  async acceptMentorshipRequest(requestId: string): Promise<MentorshipPair> {
    const request = this.mentorshipRequests.get(requestId);
    if (!request || request.status !== RequestStatus.PENDING) {
      throw new Error('Invalid or expired request');
    }

    const mentor = this.mentors.get(request.mentorId);
    if (!mentor) {
      throw new Error('Mentor not found');
    }

    // Update request status
    request.status = RequestStatus.ACCEPTED;
    request.respondedAt = new Date();
    this.mentorshipRequests.set(requestId, request);

    // Create mentorship pair
    const pairId = `pair_${request.mentorId}_${request.menteeId}_${Date.now()}`;
    
    const pair: MentorshipPair = {
      id: pairId,
      mentorId: request.mentorId,
      menteeId: request.menteeId,
      focus: request.focus,
      status: PairStatus.ACTIVE,
      sessions: [],
      goals: this.generateInitialGoals(request.focus),
      progress: {
        overallProgress: 0,
        goalsCompleted: 0,
        totalGoals: 0,
        skillImprovements: [],
        milestones: []
      },
      startedAt: new Date()
    };

    this.mentorshipPairs.set(pairId, pair);

    // Update mentor stats
    mentor.activeMentees++;
    mentor.totalMentees++;
    this.mentors.set(request.mentorId, mentor);

    // Update mentee index
    const menteePairs = this.menteeIndex.get(request.menteeId) || [];
    menteePairs.push(pairId);
    this.menteeIndex.set(request.menteeId, menteePairs);

    return pair;
  }

  async completeMentorshipSession(pairId: string, sessionData: MentorshipSession): Promise<void> {
    const pair = this.mentorshipPairs.get(pairId);
    if (!pair || pair.status !== PairStatus.ACTIVE) {
      throw new Error('Invalid or inactive mentorship pair');
    }

    const mentor = this.mentors.get(pair.mentorId);
    if (!mentor) {
      throw new Error('Mentor not found');
    }

    // Add session to pair
    pair.sessions.push(sessionData);
    pair.lastSessionAt = sessionData.completedAt;

    // Update mentor stats
    mentor.stats.totalSessions++;
    mentor.stats.totalHours += sessionData.duration / 60;
    
    // Update specialization stats
    const expertise = this.getExpertiseFromFocus(pair.focus);
    if (expertise && mentor.stats.specializations[expertise] !== undefined) {
      mentor.stats.specializations[expertise]++;
    }

    // Update progress
    this.updateMentorshipProgress(pair, sessionData);

    // Check for milestone achievements
    this.checkMilestones(pair);

    this.mentorshipPairs.set(pairId, pair);
    this.mentors.set(pair.mentorId, mentor);
  }

  async getMentorRecommendations(trainerId: string): Promise<MentorProfile[]> {
    // Get trainer's current skill level and needs (simplified)
    const availableMentors = Array.from(this.mentors.values())
      .filter(mentor => 
        mentor.availability.isActive && 
        mentor.activeMentees < mentor.maxMentees
      );

    // Sort by rating and availability
    return availableMentors
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10); // Return top 10 recommendations
  }

  // Community governance system
  async createCommunityVote(proposal: CommunityProposal): Promise<CommunityVote> {
    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const vote: CommunityVote = {
      id: voteId,
      proposal,
      status: VoteStatus.ACTIVE,
      votes: { yes: 0, no: 0, abstain: 0 },
      voters: [],
      createdAt: new Date(),
      endsAt: new Date(Date.now() + proposal.duration * 24 * 60 * 60 * 1000), // Convert days to ms
      results: null
    };

    this.communityVotes.set(voteId, vote);
    return vote;
  }

  async castVote(voteId: string, voterId: string, choice: VoteChoice): Promise<boolean> {
    const vote = this.communityVotes.get(voteId);
    if (!vote || vote.status !== VoteStatus.ACTIVE) {
      return false;
    }

    if (new Date() > vote.endsAt) {
      vote.status = VoteStatus.COMPLETED;
      this.communityVotes.set(voteId, vote);
      return false;
    }

    // Check if already voted
    if (vote.voters.includes(voterId)) {
      return false;
    }

    // Cast vote
    vote.votes[choice]++;
    vote.voters.push(voterId);
    
    this.communityVotes.set(voteId, vote);
    return true;
  }

  // Helper methods
  private generateInitialGoals(focus: MentorshipFocus): MentorshipGoal[] {
    const goalTemplates = {
      [MentorshipFocus.BEGINNER_GUIDANCE]: [
        { description: 'Capture 10 different animals', category: MentorExpertise.ANIMAL_COLLECTION, target: 10 },
        { description: 'Win 5 battles', category: MentorExpertise.BATTLE_STRATEGY, target: 5 },
        { description: 'Solve 20 daily puzzles', category: MentorExpertise.PUZZLE_SOLVING, target: 20 }
      ],
      [MentorshipFocus.COMPETITIVE_IMPROVEMENT]: [
        { description: 'Reach Silver rank', category: MentorExpertise.BATTLE_STRATEGY, target: 1400 },
        { description: 'Win 3 tournament matches', category: MentorExpertise.TOURNAMENT_PLAY, target: 3 }
      ],
      [MentorshipFocus.COLLECTION_STRATEGY]: [
        { description: 'Complete 3 habitat collections', category: MentorExpertise.ANIMAL_COLLECTION, target: 3 },
        { description: 'Find 5 rare animals', category: MentorExpertise.HABITAT_EXPLORATION, target: 5 }
      ]
    };

    const templates = goalTemplates[focus] || goalTemplates[MentorshipFocus.BEGINNER_GUIDANCE];
    
    return templates.map((template, index) => ({
      id: `goal_${index}_${Date.now()}`,
      description: template.description,
      category: template.category,
      targetValue: template.target,
      currentValue: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      completed: false
    }));
  }

  private updateMentorshipProgress(pair: MentorshipPair, session: MentorshipSession): void {
    // Update overall progress based on session completion
    const progressIncrement = 100 / 10; // Assume 10 sessions for completion
    pair.progress.overallProgress = Math.min(100, pair.progress.overallProgress + progressIncrement);

    // Check goal progress (simplified)
    pair.goals.forEach(goal => {
      if (!goal.completed) {
        // This would be updated based on actual trainer achievements
        goal.currentValue += 1; // Simplified increment
        if (goal.currentValue >= goal.targetValue) {
          goal.completed = true;
          goal.completedAt = new Date();
          pair.progress.goalsCompleted++;
        }
      }
    });

    pair.progress.totalGoals = pair.goals.length;
  }

  private checkMilestones(pair: MentorshipPair): void {
    const milestones = [
      { sessions: 1, name: 'First Session', description: 'Completed your first mentorship session' },
      { sessions: 5, name: 'Making Progress', description: 'Completed 5 mentorship sessions' },
      { sessions: 10, name: 'Dedicated Learner', description: 'Completed 10 mentorship sessions' }
    ];

    milestones.forEach(milestone => {
      if (pair.sessions.length >= milestone.sessions) {
        const existingMilestone = pair.progress.milestones.find(m => m.name === milestone.name);
        if (!existingMilestone) {
          pair.progress.milestones.push({
            id: `milestone_${milestone.sessions}`,
            name: milestone.name,
            description: milestone.description,
            achievedAt: new Date(),
            rewards: this.generateMilestoneRewards(milestone.sessions)
          });
        }
      }
    });
  }

  private generateMilestoneRewards(sessionCount: number): MentorshipReward[] {
    const rewards: MentorshipReward[] = [];
    
    if (sessionCount === 1) {
      rewards.push({
        type: 'achievement',
        value: { id: 'first_session', name: 'First Session', description: 'Completed first mentorship session' },
        recipient: 'both'
      });
    } else if (sessionCount === 10) {
      rewards.push({
        type: 'currency',
        value: { researchPoints: 100 },
        recipient: 'mentee'
      });
      rewards.push({
        type: 'currency',
        value: { researchPoints: 50 },
        recipient: 'mentor'
      });
    }

    return rewards;
  }

  private getExpertiseFromFocus(focus: MentorshipFocus): MentorExpertise | null {
    const mapping = {
      [MentorshipFocus.BEGINNER_GUIDANCE]: MentorExpertise.COMMUNITY_BUILDING,
      [MentorshipFocus.COMPETITIVE_IMPROVEMENT]: MentorExpertise.BATTLE_STRATEGY,
      [MentorshipFocus.COLLECTION_STRATEGY]: MentorExpertise.ANIMAL_COLLECTION,
      [MentorshipFocus.BATTLE_MASTERY]: MentorExpertise.BATTLE_STRATEGY,
      [MentorshipFocus.COMMUNITY_LEADERSHIP]: MentorExpertise.COMMUNITY_BUILDING,
      [MentorshipFocus.ADVANCED_TECHNIQUES]: MentorExpertise.TOURNAMENT_PLAY
    };

    return mapping[focus] || null;
  }

  // Public getters
  getMentorProfile(trainerId: string): MentorProfile | undefined {
    return this.mentors.get(trainerId);
  }

  getMentorshipPair(pairId: string): MentorshipPair | undefined {
    return this.mentorshipPairs.get(pairId);
  }

  getMentorshipsByMentee(menteeId: string): MentorshipPair[] {
    const pairIds = this.menteeIndex.get(menteeId) || [];
    return pairIds.map(id => this.mentorshipPairs.get(id)).filter(Boolean) as MentorshipPair[];
  }

  getMentorshipsByMentor(mentorId: string): MentorshipPair[] {
    return Array.from(this.mentorshipPairs.values())
      .filter(pair => pair.mentorId === mentorId);
  }

  getAllMentors(): MentorProfile[] {
    return Array.from(this.mentors.values());
  }

  getMentorshipStats(): {
    totalMentors: number,
    activePairs: number,
    completedSessions: number,
    averageRating: number
  } {
    const mentors = Array.from(this.mentors.values());
    const pairs = Array.from(this.mentorshipPairs.values());
    const activePairs = pairs.filter(pair => pair.status === PairStatus.ACTIVE).length;
    const completedSessions = pairs.reduce((sum, pair) => sum + pair.sessions.length, 0);
    const averageRating = mentors.length > 0 ? 
      mentors.reduce((sum, mentor) => sum + mentor.rating, 0) / mentors.length : 0;

    return {
      totalMentors: mentors.length,
      activePairs,
      completedSessions,
      averageRating: Math.round(averageRating * 10) / 10
    };
  }

  // Community governance properties and methods
  private communityVotes: Map<string, CommunityVote> = new Map();

  getCommunityVote(voteId: string): CommunityVote | undefined {
    return this.communityVotes.get(voteId);
  }

  getActiveVotes(): CommunityVote[] {
    return Array.from(this.communityVotes.values())
      .filter(vote => vote.status === VoteStatus.ACTIVE && new Date() <= vote.endsAt);
  }

  getCompletedVotes(): CommunityVote[] {
    return Array.from(this.communityVotes.values())
      .filter(vote => vote.status === VoteStatus.COMPLETED);
  }
}

// Community governance interfaces
export interface CommunityProposal {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  proposerId: string;
  proposerName: string;
  duration: number; // in days
  requiredVotes: number;
  impact: ProposalImpact;
}

export enum ProposalCategory {
  GAME_BALANCE = 'game_balance',
  NEW_FEATURES = 'new_features',
  COMMUNITY_RULES = 'community_rules',
  EVENTS = 'events',
  ECONOMY = 'economy'
}

export enum ProposalImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CommunityVote {
  id: string;
  proposal: CommunityProposal;
  status: VoteStatus;
  votes: { yes: number, no: number, abstain: number };
  voters: string[];
  createdAt: Date;
  endsAt: Date;
  results: VoteResults | null;
}

export enum VoteStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface VoteResults {
  outcome: 'passed' | 'failed';
  totalVotes: number;
  participationRate: number;
  breakdown: { yes: number, no: number, abstain: number };
  implementationDate?: Date;
}