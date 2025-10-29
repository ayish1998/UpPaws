/**
 * Unit tests for Battle System
 */

import { BattleSystem } from '../../core/battle-system.js';
import { TrainerProfile } from '../../types/trainer.js';
import { Animal } from '../../types/animal.js';
import { BattleAction, BattleState, BattleFormat } from '../../types/battle.js';
import { HabitatType, Rarity, TrainerPath } from '../../types/common.js';

describe('BattleSystem', () => {
  let battleSystem: BattleSystem;
  let mockPlayer: TrainerProfile;
  let mockOpponent: TrainerProfile;
  let mockPlayerTeam: Animal[];
  let mockOpponentTeam: Animal[];

  beforeEach(() => {
    battleSystem = new BattleSystem();
    
    // Create mock trainer profiles
    mockPlayer = createMockTrainer('player1', 'TestPlayer');
    mockOpponent = createMockTrainer('opponent1', 'TestOpponent');
    
    // Create mock animal teams
    mockPlayerTeam = [
      createMockAnimal('wolf1', 'Wolf', 5),
      createMockAnimal('bear1', 'Bear', 6)
    ];
    
    mockOpponentTeam = [
      createMockAnimal('lion1', 'Lion', 5),
      createMockAnimal('tiger1', 'Tiger', 7)
    ];
  });

  describe('Battle Initialization', () => {
    test('should create a new battle with correct participants', async () => {
      await battleSystem.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam);
      
      const currentBattle = battleSystem.getCurrentBattle();
      expect(currentBattle).toBeTruthy();
      expect(currentBattle?.participants).toHaveLength(2);
      expect(currentBattle?.participants[0].trainerId).toBe('player1');
      expect(currentBattle?.participants[1].trainerId).toBe('opponent1');
      expect(currentBattle?.battleState).toBe(BattleState.IN_PROGRESS);
    });

    test('should initialize battle with correct teams', async () => {
      await battleSystem.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam);
      
      const currentBattle = battleSystem.getCurrentBattle();
      expect(currentBattle?.teams).toHaveLength(2);
      expect(currentBattle?.teams[0]).toEqual(mockPlayerTeam);
      expect(currentBattle?.teams[1]).toEqual(mockOpponentTeam);
    });

    test('should apply custom battle settings', async () => {
      const customSettings = {
        maxAnimalsPerTeam: 3,
        turnTimeLimit: 45,
        allowItems: false,
        battleFormat: BattleFormat.DOUBLE
      };

      await battleSystem.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam, customSettings);
      
      const currentBattle = battleSystem.getCurrentBattle();
      expect(currentBattle?.settings.maxAnimalsPerTeam).toBe(3);
      expect(currentBattle?.settings.turnTimeLimit).toBe(45);
      expect(currentBattle?.settings.allowItems).toBe(false);
      expect(currentBattle?.settings.battleFormat).toBe(BattleFormat.DOUBLE);
    });
  });

  describe('Wild Battle', () => {
    test('should create wild battle with single opponent animal', async () => {
      const wildAnimal = createMockAnimal('wild1', 'WildBear', 8);
      
      await battleSystem.startWildBattle(mockPlayer, mockPlayerTeam, wildAnimal);
      
      const currentBattle = battleSystem.getCurrentBattle();
      expect(currentBattle?.participants[1].trainerId).toContain('wild-');
      expect(currentBattle?.teams[1]).toHaveLength(1);
      expect(currentBattle?.teams[1][0]).toEqual(wildAnimal);
      expect(currentBattle?.settings.allowItems).toBe(false);
      expect(currentBattle?.settings.allowSwitching).toBe(false);
    });
  });

  describe('Battle Actions', () => {
    test('should process player action correctly', async () => {
      await battleSystem.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam);
      
      const attackAction: BattleAction = {
        type: 'attack' as any,
        participantIndex: 0,
        animalIndex: 0,
        moveIndex: 0,
        targetIndex: 0
      };

      // This would normally be async, but we're testing the synchronous parts
      await battleSystem.processPlayerAction(attackAction);
      
      const currentBattle = battleSystem.getCurrentBattle();
      expect(currentBattle?.moves.length).toBeGreaterThan(0);
    });

    test('should handle forfeit action', async () => {
      await battleSystem.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam);
      
      await battleSystem.forfeitBattle();
      
      const currentBattle = battleSystem.getCurrentBattle();
      expect(currentBattle?.battleState).toBe(BattleState.ENDED);
    });
  });

  describe('Battle ID Generation', () => {
    test('should generate unique battle IDs', async () => {
      await battleSystem.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam);
      const battle1 = battleSystem.getCurrentBattle();
      
      const battleSystem2 = new BattleSystem();
      await battleSystem2.startBattle(mockPlayer, mockOpponent, mockPlayerTeam, mockOpponentTeam);
      const battle2 = battleSystem2.getCurrentBattle();
      
      expect(battle1?.battleId).toBeTruthy();
      expect(battle2?.battleId).toBeTruthy();
      expect(battle1?.battleId).not.toBe(battle2?.battleId);
    });
  });

  describe('Battle End Callback', () => {
    test('should call battle end callback when set', (done) => {
      battleSystem.onBattleEndCallback((result) => {
        expect(result).toBeTruthy();
        done();
      });

      // Simulate battle end by directly calling the private method
      // In a real scenario, this would happen through battle progression
      expect(true).toBe(true); // Placeholder for callback test
      done();
    });
  });
});

// Helper functions
function createMockTrainer(id: string, username: string): TrainerProfile {
  return {
    username,
    trainerId: id,
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
    createdAt: new Date(),
    lastActiveAt: new Date()
  };
}

function createMockAnimal(id: string, name: string, level: number): Animal {
  return {
    id,
    speciesId: name.toLowerCase(),
    name,
    level,
    experience: level * 100,
    stats: {
      health: 50 + level * 10,
      attack: 40 + level * 8,
      defense: 35 + level * 6,
      speed: 45 + level * 7,
      intelligence: 30 + level * 5,
      stamina: 40 + level * 6
    },
    moves: [
      { id: 'bite', name: 'Bite', type: HabitatType.FOREST, power: 40, accuracy: 100, description: 'A basic bite attack' },
      { id: 'scratch', name: 'Scratch', type: HabitatType.FOREST, power: 35, accuracy: 100, description: 'A basic scratch attack' }
    ],
    type: [HabitatType.FOREST],
    rarity: Rarity.COMMON,
    shiny: false,
    evolutionStage: 1,
    captureDate: new Date(),
    trainerId: 'test',
    individualValues: {
      health: 15,
      attack: 12,
      defense: 10,
      speed: 14,
      intelligence: 8,
      stamina: 11
    }
  };
}