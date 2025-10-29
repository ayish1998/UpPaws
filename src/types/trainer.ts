import { TrainerPath, Currency, Achievement, Badge, Item } from './common.js';

export interface TrainerProfile {
  username: string;
  trainerId: string;
  level: number;
  experience: number;
  badges: Badge[];
  specialization: TrainerPath;
  stats: TrainerStats;
  inventory: Item[];
  currency: Currency;
  achievements: Achievement[];
  preferences: TrainerPreferences;
  socialData: SocialData;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface TrainerStats {
  totalAnimalsCapture: number;
  totalBattlesWon: number;
  totalBattlesLost: number;
  totalPuzzlesSolved: number;
  totalHabitatsExplored: number;
  currentStreak: number;
  longestStreak: number;
  totalPlayTime: number;
  favoriteHabitat?: string;
}

export interface TrainerPreferences {
  theme: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  notificationsEnabled: boolean;
  privacySettings: PrivacySettings;
  gameplaySettings: GameplaySettings;
}

export interface PrivacySettings {
  showProfile: boolean;
  showCollection: boolean;
  showStats: boolean;
  allowTrading: boolean;
  allowBattleRequests: boolean;
}

export interface GameplaySettings {
  difficulty: number;
  autoSave: boolean;
  hintPreference: string;
  battleAnimationSpeed: number;
}

export interface SocialData {
  friends: string[];
  blockedUsers: string[];
  guildId?: string;
  mentorId?: string;
  menteeIds: string[];
  reputationScore: number;
  socialRank: string;
}

// Validation functions
export function validateTrainerProfile(profile: Partial<TrainerProfile>): string[] {
  const errors: string[] = [];
  
  if (!profile.username || profile.username.trim().length === 0) {
    errors.push('Username is required');
  }
  
  if (!profile.trainerId || profile.trainerId.trim().length === 0) {
    errors.push('Trainer ID is required');
  }
  
  if (profile.level !== undefined && (profile.level < 1 || profile.level > 100)) {
    errors.push('Level must be between 1 and 100');
  }
  
  if (profile.experience !== undefined && profile.experience < 0) {
    errors.push('Experience cannot be negative');
  }
  
  return errors;
}

export function createDefaultTrainerProfile(username: string, trainerId: string): TrainerProfile {
  return {
    username,
    trainerId,
    level: 1,
    experience: 0,
    badges: [],
    specialization: TrainerPath.RESEARCH,
    stats: {
      totalAnimalsCapture: 0,
      totalBattlesWon: 0,
      totalBattlesLost: 0,
      totalPuzzlesSolved: 0,
      totalHabitatsExplored: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPlayTime: 0
    },
    inventory: [],
    currency: {
      pawCoins: 100,
      researchPoints: 0,
      battleTokens: 0
    },
    achievements: [],
    preferences: {
      theme: 'default',
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
        difficulty: 1,
        autoSave: true,
        hintPreference: 'normal',
        battleAnimationSpeed: 1
      }
    },
    socialData: {
      friends: [],
      blockedUsers: [],
      menteeIds: [],
      reputationScore: 0,
      socialRank: 'novice'
    },
    createdAt: new Date(),
    lastActiveAt: new Date()
  };
}