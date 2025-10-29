import { Animal } from './animal.js';
import { Item, Currency, Achievement, HabitatType } from './common.js';

export interface CommunityChallenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  scope: ChallengeScope;
  subredditId?: string;
  subredditName?: string;
  objectives: ChallengeObjective[];
  rewards: ChallengeReward[];
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  participants: ChallengeParticipant[];
  progress: ChallengeProgress;
  metadata: ChallengeMetadata;
}

export enum ChallengeType {
  COLLECTION = 'collection',
  BATTLE = 'battle',
  DISCOVERY = 'discovery',
  CONSERVATION = 'conservation',
  SOCIAL = 'social',
  PUZZLE = 'puzzle'
}

export enum ChallengeScope {
  SUBREDDIT = 'subreddit',
  CROSS_SUBREDDIT = 'cross_subreddit',
  GLOBAL = 'global'
}

export interface ChallengeObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  target: number;
  current: number;
  completed: boolean;
  requirements?: ObjectiveRequirement[];
}

export enum ObjectiveType {
  CAPTURE_ANIMALS = 'capture_animals',
  WIN_BATTLES = 'win_battles',
  SOLVE_PUZZLES = 'solve_puzzles',
  DISCOVER_SPECIES = 'discover_species',
  TRADE_ITEMS = 'trade_items',
  SHARE_ACHIEVEMENTS = 'share_achievements',
  PARTICIPATE_TOURNAMENTS = 'participate_tournaments'
}

export interface ObjectiveRequirement {
  type: string;
  value: any;
  description: string;
}

export interface ChallengeReward {
  type: RewardType;
  animal?: Animal;
  item?: Item;
  currency?: Currency;
  achievement?: Achievement;
  title?: string;
  cosmetic?: CosmeticReward;
}

export enum RewardType {
  ANIMAL = 'animal',
  ITEM = 'item',
  CURRENCY = 'currency',
  ACHIEVEMENT = 'achievement',
  TITLE = 'title',
  COSMETIC = 'cosmetic'
}

export interface CosmeticReward {
  type: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ChallengeParticipant {
  trainerId: string;
  username: string;
  joinedAt: Date;
  contribution: number;
  personalProgress: Record<string, number>;
  rewardsClaimed: boolean;
}

export interface ChallengeProgress {
  totalParticipants: number;
  overallCompletion: number;
  objectiveProgress: Record<string, number>;
  milestones: ChallengeMilestone[];
}

export interface ChallengeMilestone {
  id: string;
  name: string;
  description: string;
  threshold: number;
  reached: boolean;
  reachedAt?: Date;
  rewards: ChallengeReward[];
}

export interface ChallengeMetadata {
  difficulty: ChallengeDifficulty;
  estimatedDuration: number; // in hours
  maxParticipants?: number;
  tags: string[];
  imageUrl?: string;
  sponsoredBy?: string;
}

export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme'
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: TournamentType;
  format: TournamentFormat;
  scope: ChallengeScope;
  subredditId?: string;
  subredditName?: string;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  entryFee?: Currency;
  prizePool: TournamentPrize[];
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  rules: TournamentRule[];
  createdBy: string;
}

export enum TournamentType {
  BATTLE = 'battle',
  PUZZLE_SPEED = 'puzzle_speed',
  COLLECTION_SHOWCASE = 'collection_showcase',
  TRIVIA = 'trivia'
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss'
}

export enum TournamentStatus {
  REGISTRATION = 'registration',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface TournamentParticipant {
  trainerId: string;
  username: string;
  registeredAt: Date;
  seed?: number;
  currentRound: number;
  wins: number;
  losses: number;
  eliminated: boolean;
}

export interface TournamentBracket {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  participant1Id: string;
  participant2Id: string;
  winnerId?: string;
  score?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  status: MatchStatus;
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FORFEIT = 'forfeit'
}

export interface TournamentPrize {
  position: number;
  rewards: ChallengeReward[];
}

export interface TournamentRule {
  id: string;
  description: string;
  category: string;
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: LeaderboardType;
  scope: ChallengeScope;
  subredditId?: string;
  category: LeaderboardCategory;
  timeframe: LeaderboardTimeframe;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
}

export enum LeaderboardType {
  SCORE = 'score',
  COLLECTION = 'collection',
  BATTLE = 'battle',
  STREAK = 'streak',
  ACHIEVEMENT = 'achievement'
}

export enum LeaderboardCategory {
  DAILY_PUZZLES = 'daily_puzzles',
  ARCADE_MODE = 'arcade_mode',
  BATTLE_WINS = 'battle_wins',
  ANIMALS_CAPTURED = 'animals_captured',
  STREAK_LENGTH = 'streak_length',
  TOTAL_SCORE = 'total_score'
}

export enum LeaderboardTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

export interface LeaderboardEntry {
  rank: number;
  trainerId: string;
  username: string;
  value: number;
  change: number; // Change from previous period
  badge?: string;
  specialRecognition?: string;
}

export interface CommunityDiscovery {
  id: string;
  name: string;
  description: string;
  type: DiscoveryType;
  requirements: DiscoveryRequirement[];
  rewards: ChallengeReward[];
  status: DiscoveryStatus;
  discoveredBy?: string[];
  discoveredAt?: Date;
  communityProgress: number;
  requiredProgress: number;
}

export enum DiscoveryType {
  NEW_HABITAT = 'new_habitat',
  RARE_SPECIES = 'rare_species',
  EVOLUTION_PATH = 'evolution_path',
  HIDDEN_AREA = 'hidden_area'
}

export interface DiscoveryRequirement {
  type: string;
  description: string;
  target: number;
  current: number;
}

export enum DiscoveryStatus {
  LOCKED = 'locked',
  IN_PROGRESS = 'in_progress',
  DISCOVERED = 'discovered'
}