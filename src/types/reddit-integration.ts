import { Animal } from './animal.js';
import { TrainerProfile } from './trainer.js';
import { Achievement } from './common.js';

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  subredditId: string;
  authorId: string;
  authorUsername: string;
  postType: RedditPostType;
  metadata: PostMetadata;
  createdAt: Date;
  upvotes: number;
  comments: number;
  url?: string;
}

export enum RedditPostType {
  TRAINER_PROFILE = 'trainer_profile',
  COLLECTION_SHOWCASE = 'collection_showcase',
  BATTLE_REPLAY = 'battle_replay',
  ACHIEVEMENT_SHARE = 'achievement_share',
  COMMUNITY_CHALLENGE = 'community_challenge',
  TOURNAMENT_RESULT = 'tournament_result'
}

export interface PostMetadata {
  trainerId?: string;
  battleId?: string;
  achievementId?: string;
  challengeId?: string;
  tournamentId?: string;
  animals?: Animal[];
  customData?: Record<string, any>;
}

export interface TrainerProfileShare {
  trainerId: string;
  username: string;
  level: number;
  badges: string[];
  favoriteAnimals: Animal[];
  stats: ProfileShareStats;
  achievements: Achievement[];
  customization: ProfileCustomization;
}

export interface ProfileShareStats {
  totalAnimalsCapture: number;
  totalBattlesWon: number;
  currentStreak: number;
  favoriteHabitat: string;
  playtime: number;
}

export interface ProfileCustomization {
  theme: string;
  backgroundColor: string;
  accentColor: string;
  displayBadges: string[];
  showcaseAnimals: Animal[];
  motto?: string;
}

export interface CollectionShowcase {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  animals: Animal[];
  category: ShowcaseCategory;
  filters: ShowcaseFilters;
  stats: ShowcaseStats;
  createdAt: Date;
}

export enum ShowcaseCategory {
  RARE_COLLECTION = 'rare_collection',
  HABITAT_SPECIALISTS = 'habitat_specialists',
  EVOLUTION_CHAINS = 'evolution_chains',
  SHINY_COLLECTION = 'shiny_collection',
  BATTLE_TEAM = 'battle_team',
  RECENT_CAPTURES = 'recent_captures'
}

export interface ShowcaseFilters {
  rarity?: string[];
  habitats?: string[];
  minLevel?: number;
  shinyOnly?: boolean;
  recentOnly?: boolean;
}

export interface ShowcaseStats {
  totalAnimals: number;
  averageLevel: number;
  rarityBreakdown: Record<string, number>;
  habitatBreakdown: Record<string, number>;
  completionPercentage: number;
}

export interface BattleReplay {
  id: string;
  battleId: string;
  title: string;
  description: string;
  participants: BattleParticipant[];
  winner: string;
  duration: number;
  highlights: BattleHighlight[];
  stats: BattleReplayStats;
  shareableUrl: string;
  embeddedViewer: EmbeddedViewer;
}

export interface BattleParticipant {
  trainerId: string;
  username: string;
  team: Animal[];
  finalScore: number;
}

export interface BattleHighlight {
  timestamp: number;
  type: HighlightType;
  description: string;
  participants: string[];
}

export enum HighlightType {
  CRITICAL_HIT = 'critical_hit',
  EVOLUTION_MID_BATTLE = 'evolution_mid_battle',
  COMEBACK_VICTORY = 'comeback_victory',
  PERFECT_GAME = 'perfect_game',
  RARE_MOVE = 'rare_move'
}

export interface BattleReplayStats {
  totalMoves: number;
  averageMoveTime: number;
  mostUsedMove: string;
  damageDealt: Record<string, number>;
  accuracyRate: Record<string, number>;
}

export interface EmbeddedViewer {
  viewerUrl: string;
  thumbnailUrl: string;
  duration: number;
  keyMoments: number[];
  controls: ViewerControls;
}

export interface ViewerControls {
  playPause: boolean;
  speedControl: boolean;
  jumpToMoments: boolean;
  fullscreen: boolean;
}

export interface AchievementPost {
  achievementId: string;
  trainerId: string;
  username: string;
  achievementName: string;
  description: string;
  rarity: string;
  unlockedAt: Date;
  progress: AchievementProgress;
  celebrationStyle: CelebrationStyle;
  shareMessage: string;
}

export interface AchievementProgress {
  current: number;
  total: number;
  milestones: AchievementMilestone[];
}

export interface AchievementMilestone {
  value: number;
  description: string;
  reached: boolean;
  reachedAt?: Date;
}

export interface CelebrationStyle {
  animation: string;
  colors: string[];
  effects: string[];
  duration: number;
}

export interface SubredditCustomization {
  subredditId: string;
  subredditName: string;
  moderatorId: string;
  settings: SubredditSettings;
  theme: SubredditTheme;
  features: SubredditFeatures;
  gymLeader: GymLeaderConfig;
}

export interface SubredditSettings {
  allowTrading: boolean;
  allowBattles: boolean;
  allowChallenges: boolean;
  moderationLevel: ModerationLevel;
  autoPostSettings: AutoPostSettings;
  leaderboardSettings: LeaderboardSettings;
}

export enum ModerationLevel {
  OPEN = 'open',
  MODERATED = 'moderated',
  RESTRICTED = 'restricted'
}

export interface AutoPostSettings {
  dailyLeaderboard: boolean;
  weeklyHighlights: boolean;
  challengeUpdates: boolean;
  tournamentResults: boolean;
  newAchievements: boolean;
}

export interface LeaderboardSettings {
  categories: string[];
  updateFrequency: string;
  displayCount: number;
  includeGlobal: boolean;
}

export interface SubredditTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  customCSS?: string;
}

export interface SubredditFeatures {
  customChallenges: boolean;
  exclusiveAnimals: boolean;
  specialEvents: boolean;
  customBadges: boolean;
  mentorshipProgram: boolean;
}

export interface GymLeaderConfig {
  trainerId: string;
  username: string;
  specialization: string;
  team: Animal[];
  badge: GymBadge;
  challengeRules: GymChallengeRules;
}

export interface GymBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  requirements: string[];
}

export interface GymChallengeRules {
  teamSize: number;
  levelRestrictions: LevelRestriction[];
  habitatRestrictions: string[];
  specialRules: string[];
}

export interface LevelRestriction {
  min: number;
  max: number;
  applies: string; // 'all' | 'individual' | 'average'
}