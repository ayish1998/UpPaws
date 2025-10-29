/**
 * Unit tests for Trainer Progression System
 */

import { TrainerProgressionSystem, ProgressionEventType, LevelUpResult } from '../../core/trainer-progression-system.js';
import { TrainerProfile } from '../../types/trainer.js';
import { HabitatType, TrainerPath, Rarity } from '../../types/common.js';

describe('TrainerProgressionSystem', () => {
  let mockTrainer: TrainerProfile;

  beforeEach(() => {
    // Initialize the progression system
    TrainerProgressionSystem.initialize();

    // Create mock trainer
    mockTrainer = createMockTrainer();
  });

  describe('Experience and Leveling', () => {
    test('should calculate experience gain correctly for animal capture', () => {
      const eventData = { rarity: Rarity.COMMON, shiny: false };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.experienceGained).toBe(50); // Base experience for common animal
      expect(result.leveledUp).toBe(false); // Should not level up from single capture
    });

    test('should apply rarity multiplier for rare animal capture', () => {
      const eventData = { rarity: Rarity.LEGENDARY, shiny: false };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.experienceGained).toBe(150); // 50 * 3 for legendary
    });

    test('should apply shiny multiplier', () => {
      const eventData = { rarity: Rarity.COMMON, shiny: true };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.experienceGained).toBe(100); // 50 * 2 for shiny
    });

    test('should apply specialization bonus', () => {
      mockTrainer.specialization = TrainerPath.RESEARCH;
      const eventData = { rarity: Rarity.COMMON, shiny: false };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.experienceGained).toBe(55); // 50 * 1.1 for research specialization
    });

    test('should level up trainer when enough experience gained', () => {
      // Set trainer close to next level
      mockTrainer.level = 1;
      mockTrainer.experience = 150; // Need 200 total for level 2

      const eventData = { rarity: Rarity.COMMON, shiny: false };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(mockTrainer.level).toBe(2);
    });

    test('should provide level up rewards', () => {
      mockTrainer.level = 1;
      mockTrainer.experience = 150;

      const eventData = { rarity: Rarity.COMMON, shiny: false };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.rewardsEarned.length).toBeGreaterThan(0);
      expect(result.rewardsEarned[0].type).toBe('currency');
      expect(result.rewardsEarned[0].id).toBe('pawCoins');
    });

    test('should provide milestone rewards at level 5', () => {
      mockTrainer.level = 4;
      mockTrainer.experience = 900; // Close to level 5

      const eventData = { rarity: Rarity.LEGENDARY, shiny: false };
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        eventData
      );

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(5);
      expect(result.rewardsEarned.some(reward => reward.id === 'researchPoints')).toBe(true);
    });
  });

  describe('Stat Updates', () => {
    test('should update animal capture stats', () => {
      const initialCaptures = mockTrainer.stats.totalAnimalsCapture;
      
      TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        { rarity: Rarity.COMMON }
      );

      expect(mockTrainer.stats.totalAnimalsCapture).toBe(initialCaptures + 1);
    });

    test('should update battle win stats', () => {
      const initialWins = mockTrainer.stats.totalBattlesWon;
      
      TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.BATTLE_WON,
        { battleType: 'trainer' }
      );

      expect(mockTrainer.stats.totalBattlesWon).toBe(initialWins + 1);
    });

    test('should update battle loss stats', () => {
      const initialLosses = mockTrainer.stats.totalBattlesLost;
      
      TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.BATTLE_LOST,
        { battleType: 'trainer' }
      );

      expect(mockTrainer.stats.totalBattlesLost).toBe(initialLosses + 1);
    });

    test('should update puzzle solved stats', () => {
      const initialPuzzles = mockTrainer.stats.totalPuzzlesSolved;
      
      TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.PUZZLE_SOLVED,
        { difficulty: 1 }
      );

      expect(mockTrainer.stats.totalPuzzlesSolved).toBe(initialPuzzles + 1);
    });

    test('should update habitat exploration stats', () => {
      const initialExplored = mockTrainer.stats.totalHabitatsExplored;
      
      TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.HABITAT_EXPLORED,
        { habitatType: HabitatType.FOREST }
      );

      expect(mockTrainer.stats.totalHabitatsExplored).toBe(initialExplored + 1);
    });

    test('should update last active timestamp', () => {
      const oldTimestamp = mockTrainer.lastActiveAt;
      
      TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.ANIMAL_CAPTURED,
        { rarity: Rarity.COMMON }
      );

      expect(mockTrainer.lastActiveAt.getTime()).toBeGreaterThan(oldTimestamp.getTime());
    });
  });

  describe('Level Calculation', () => {
    test('should calculate correct level from experience', () => {
      // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
      expect(TrainerProgressionSystem['calculateLevelFromExperience'](0)).toBe(1);
      expect(TrainerProgressionSystem['calculateLevelFromExperience'](99)).toBe(1);
      expect(TrainerProgressionSystem['calculateLevelFromExperience'](100)).toBe(1);
      expect(TrainerProgressionSystem['calculateLevelFromExperience'](200)).toBe(2);
      expect(TrainerProgressionSystem['calculateLevelFromExperience'](600)).toBe(3);
    });

    test('should cap level at 100', () => {
      const highExperience = 1000000; // Very high experience
      const level = TrainerProgressionSystem['calculateLevelFromExperience'](highExperience);
      expect(level).toBeLessThanOrEqual(100);
    });

    test('should calculate experience for next level', () => {
      expect(TrainerProgressionSystem.getExperienceForNextLevel(1)).toBe(200);
      expect(TrainerProgressionSystem.getExperienceForNextLevel(5)).toBe(600);
      expect(TrainerProgressionSystem.getExperienceForNextLevel(10)).toBe(1100);
    });
  });

  describe('Gym Challenges', () => {
    test('should get available gyms for qualified trainer', () => {
      mockTrainer.level = 15;
      mockTrainer.stats.totalAnimalsCapture = 10;
      
      const availableGyms = TrainerProgressionSystem.getAvailableGyms(mockTrainer);
      
      expect(availableGyms.length).toBeGreaterThan(0);
      expect(availableGyms[0].name).toBe('Forest Sanctuary Gym');
    });

    test('should not show gyms for unqualified trainer', () => {
      mockTrainer.level = 5; // Too low level
      mockTrainer.stats.totalAnimalsCapture = 1; // Too few captures
      
      const availableGyms = TrainerProgressionSystem.getAvailableGyms(mockTrainer);
      
      expect(availableGyms.length).toBe(0);
    });

    test('should complete gym challenge successfully', () => {
      mockTrainer.level = 15;
      mockTrainer.stats.totalAnimalsCapture = 10;
      
      const success = TrainerProgressionSystem.completeGymChallenge(mockTrainer, 'forest_gym');
      
      expect(success).toBe(true);
      expect(mockTrainer.badges.length).toBe(1);
      expect(mockTrainer.badges[0].id).toBe('forest_badge');
      expect(mockTrainer.currency.pawCoins).toBeGreaterThan(1000); // Should have received reward
    });

    test('should fail gym challenge for unqualified trainer', () => {
      mockTrainer.level = 5; // Too low
      
      const success = TrainerProgressionSystem.completeGymChallenge(mockTrainer, 'forest_gym');
      
      expect(success).toBe(false);
      expect(mockTrainer.badges.length).toBe(0);
    });
  });

  describe('Elite Four Progress', () => {
    test('should show Elite Four progress for qualified trainer', () => {
      mockTrainer.level = 50;
      mockTrainer.stats.totalAnimalsCapture = 100;
      
      const progress = TrainerProgressionSystem.getEliteFourProgress(mockTrainer);
      
      expect(progress.length).toBe(4);
      expect(progress[0].canChallenge).toBe(true);
      expect(progress[0].defeated).toBe(false);
    });

    test('should show Elite Four as not available for low level trainer', () => {
      mockTrainer.level = 30; // Too low
      
      const progress = TrainerProgressionSystem.getEliteFourProgress(mockTrainer);
      
      expect(progress[0].canChallenge).toBe(false);
    });
  });

  describe('Progression Summary', () => {
    test('should provide accurate progression summary', () => {
      mockTrainer.level = 15;
      mockTrainer.experience = 1500;
      mockTrainer.badges = [
        {
          id: 'forest_badge',
          name: 'Forest Badge',
          description: 'Forest mastery',
          habitatType: HabitatType.FOREST,
          earnedAt: new Date(),
          gymLeader: 'Ranger Oak'
        }
      ];
      
      const summary = TrainerProgressionSystem.getProgressionSummary(mockTrainer);
      
      expect(summary.level).toBe(15);
      expect(summary.badges).toBe(1);
      expect(summary.eliteFourDefeated).toBe(0);
      expect(summary.isChampion).toBe(false);
      expect(summary.nextMilestone).toBeTruthy();
    });

    test('should show correct next milestone for low level trainer', () => {
      mockTrainer.level = 5;
      
      const summary = TrainerProgressionSystem.getProgressionSummary(mockTrainer);
      
      expect(summary.nextMilestone).toBe('Reach level 10 to challenge first gym');
    });

    test('should show Elite Four milestone for high level trainer', () => {
      mockTrainer.level = 45;
      mockTrainer.badges = Array(8).fill(null).map((_, i) => ({
        id: `badge_${i}`,
        name: `Badge ${i}`,
        description: 'Test badge',
        habitatType: HabitatType.FOREST,
        earnedAt: new Date(),
        gymLeader: 'Test Leader'
      }));
      
      const summary = TrainerProgressionSystem.getProgressionSummary(mockTrainer);
      
      expect(summary.nextMilestone).toBe('Reach level 50 to challenge Elite Four');
    });
  });

  describe('Specialization Bonuses', () => {
    test('should apply battle specialization bonus to battle events', () => {
      mockTrainer.specialization = TrainerPath.BATTLE;
      
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.BATTLE_WON,
        { battleType: 'trainer' }
      );

      expect(result.experienceGained).toBe(130); // 100 * 1.3 for battle specialization
    });

    test('should apply research specialization bonus to research events', () => {
      mockTrainer.specialization = TrainerPath.RESEARCH;
      
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.PUZZLE_SOLVED,
        { difficulty: 1 }
      );

      expect(result.experienceGained).toBe(39); // 30 * 1.3 for research specialization
    });

    test('should apply conservation specialization bonus to conservation events', () => {
      mockTrainer.specialization = TrainerPath.CONSERVATION;
      
      const result = TrainerProgressionSystem.processProgressionEvent(
        mockTrainer,
        ProgressionEventType.CONSERVATION_MISSION,
        { missionType: 'habitat_protection' }
      );

      expect(result.experienceGained).toBe(225); // 150 * 1.5 for conservation specialization
    });
  });
});

// Helper function
function createMockTrainer(): TrainerProfile {
  return {
    username: 'TestTrainer',
    trainerId: 'trainer123',
    level: 10,
    experience: 1000,
    badges: [],
    specialization: TrainerPath.BATTLE,
    stats: {
      totalAnimalsCapture: 5,
      totalBattlesWon: 3,
      totalBattlesLost: 1,
      totalPuzzlesSolved: 10,
      totalHabitatsExplored: 2,
      currentStreak: 2,
      longestStreak: 5,
      totalPlayTime: 3600
    },
    inventory: [],
    currency: { pawCoins: 1000, researchPoints: 500, battleTokens: 100 },
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
      reputationScore: 100,
      socialRank: 'trainer'
    },
    createdAt: new Date('2024-01-01'),
    lastActiveAt: new Date('2024-01-01')
  };
}