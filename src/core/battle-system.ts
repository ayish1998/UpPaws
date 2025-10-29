import { BattleEngine } from './battle-engine.js';
import { BattleInterface, BattleAnimation } from '../ui/battle-interface.js';
import { 
  Battle, 
  BattleAction, 
  BattleParticipant, 
  BattleSettings, 
  BattleFormat, 
  BattleState 
} from '../types/battle.js';
import { Animal, Move } from '../types/animal.js';
import { TrainerProfile } from '../types/trainer.js';
import { BattleType } from '../types/common.js';

/**
 * Battle system that coordinates between battle engine and UI
 */
export class BattleSystem {
  private battleEngine: BattleEngine | null = null;
  private battleInterface: BattleInterface | null = null;
  private currentBattle: Battle | null = null;
  private onBattleEnd?: (result: any) => void;

  constructor(container?: HTMLElement) {
    if (container) {
      this.battleInterface = new BattleInterface(container);
    }
  }

  /**
   * Start a new battle between two trainers
   */
  public async startBattle(
    player: TrainerProfile,
    opponent: TrainerProfile,
    playerTeam: Animal[],
    opponentTeam: Animal[],
    settings?: Partial<BattleSettings>
  ): Promise<void> {
    // Create battle participants
    const participants: BattleParticipant[] = [
      {
        trainerId: player.trainerId,
        trainerName: player.username,
        teamIndex: 0,
        isReady: true,
        isAI: false
      },
      {
        trainerId: opponent.trainerId,
        trainerName: opponent.username,
        teamIndex: 1,
        isReady: true,
        isAI: true,
        aiDifficulty: 1
      }
    ];

    // Create battle settings
    const battleSettings: BattleSettings = {
      maxAnimalsPerTeam: 6,
      turnTimeLimit: 30,
      allowItems: true,
      allowSwitching: true,
      battleFormat: BattleFormat.SINGLE,
      ...settings
    };

    // Create battle
    this.currentBattle = {
      battleId: this.generateBattleId(),
      type: BattleType.TRAINER,
      participants,
      teams: [playerTeam, opponentTeam],
      currentTurn: 1,
      battleState: BattleState.IN_PROGRESS,
      moves: [],
      replay: {
        version: '1.0',
        battleId: '',
        participants,
        initialTeams: [playerTeam.map(a => ({...a})), opponentTeam.map(a => ({...a}))],
        moves: [],
        result: {
          isDraw: false,
          experienceGained: {},
          itemsWon: {},
          currencyWon: {},
          achievements: []
        },
        metadata: {
          duration: 0,
          totalTurns: 0,
          averageTurnTime: 0,
          spectators: 0,
          tags: []
        }
      },
      settings: battleSettings,
      createdAt: new Date(),
      startedAt: new Date()
    };

    // Initialize battle engine
    this.battleEngine = new BattleEngine(this.currentBattle);

    // Start battle interface
    if (this.battleInterface) {
      this.battleInterface.startBattle(this.currentBattle);
    }

    // Start battle loop
    await this.battleLoop();
  }

  /**
   * Start a wild animal battle
   */
  public async startWildBattle(
    player: TrainerProfile,
    playerTeam: Animal[],
    wildAnimal: Animal
  ): Promise<void> {
    // Create AI opponent for wild animal
    const wildTrainer: TrainerProfile = {
      username: 'Wild',
      trainerId: 'wild-' + Date.now(),
      level: wildAnimal.level,
      experience: 0,
      badges: [],
      specialization: 'RESEARCH' as any,
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
      currency: { pawCoins: 0, researchPoints: 0, battleTokens: 0 },
      achievements: [],
      preferences: {
        theme: 'default',
        soundEnabled: true,
        animationsEnabled: true,
        notificationsEnabled: true,
        privacySettings: {
          showProfile: false,
          showCollection: false,
          showStats: false,
          allowTrading: false,
          allowBattleRequests: false
        },
        gameplaySettings: {
          difficulty: 1,
          autoSave: false,
          hintPreference: 'normal',
          battleAnimationSpeed: 1
        }
      },
      socialData: {
        friends: [],
        blockedUsers: [],
        menteeIds: [],
        reputationScore: 0,
        socialRank: 'wild'
      },
      createdAt: new Date(),
      lastActiveAt: new Date()
    };

    await this.startBattle(player, wildTrainer, playerTeam, [wildAnimal], {
      allowItems: false,
      allowSwitching: false
    });
  }

  /**
   * Main battle loop
   */
  private async battleLoop(): Promise<void> {
    if (!this.battleEngine || !this.currentBattle) return;

    while (this.currentBattle.battleState === BattleState.IN_PROGRESS) {
      // Wait for player action (handled by UI events)
      await this.waitForPlayerAction();
      
      // Process AI turn if needed
      if (this.currentBattle.battleState === BattleState.IN_PROGRESS) {
        await this.processAITurn();
      }
    }

    // Battle ended
    await this.endBattle();
  }

  /**
   * Wait for player action
   */
  private async waitForPlayerAction(): Promise<void> {
    return new Promise((resolve) => {
      // This will be resolved when player makes an action through the UI
      this.onPlayerAction = resolve;
    });
  }

  private onPlayerAction?: () => void;

  /**
   * Process player battle action
   */
  public async processPlayerAction(action: BattleAction): Promise<void> {
    if (!this.battleEngine || !this.currentBattle) return;

    try {
      const result = await this.battleEngine.processAction(action);
      
      // Update UI with battle effects
      if (this.battleInterface) {
        this.battleInterface.addLogMessage(result.message);
        
        // Play animations for effects
        for (const effect of result.effects) {
          const animation: BattleAnimation = {
            type: effect.type as any,
            target: effect.target.startsWith('0') ? 'player' : 'opponent',
            value: effect.value
          };
          await this.battleInterface.playAnimation(animation);
        }
      }

      // Check if battle ended
      if (result.battleEnded) {
        this.currentBattle.battleState = BattleState.ENDED;
        this.currentBattle.endedAt = new Date();
      }

      // Resolve player action wait
      if (this.onPlayerAction) {
        this.onPlayerAction();
        this.onPlayerAction = undefined;
      }
    } catch (error) {
      console.error('Error processing player action:', error);
      if (this.battleInterface) {
        this.battleInterface.addLogMessage('An error occurred processing your action.');
      }
    }
  }

  /**
   * Process AI turn
   */
  private async processAITurn(): Promise<void> {
    if (!this.battleEngine || !this.currentBattle) return;

    // Get AI action from battle engine
    const aiAction = this.battleEngine.getAIAction(1); // Assuming AI is participant 1
    
    if (!aiAction) {
      console.error('No AI action available');
      return;
    }

    // Add delay for AI thinking (based on difficulty)
    const thinkingTime = this.getAIThinkingTime();
    await new Promise(resolve => setTimeout(resolve, thinkingTime));

    try {
      const result = await this.battleEngine.processAction(aiAction);
      
      // Update UI
      if (this.battleInterface) {
        this.battleInterface.addLogMessage(result.message);
        
        // Play animations
        for (const effect of result.effects) {
          const animation: BattleAnimation = {
            type: effect.type as any,
            source: 'opponent',
            target: effect.target.startsWith('0') ? 'player' : 'opponent',
            value: effect.value
          };
          await this.battleInterface.playAnimation(animation);
        }
      }

      // Check if battle ended
      if (result.battleEnded) {
        this.currentBattle.battleState = BattleState.ENDED;
        this.currentBattle.endedAt = new Date();
      }
    } catch (error) {
      console.error('Error processing AI action:', error);
    }
  }

  /**
   * Get AI thinking time based on difficulty
   */
  private getAIThinkingTime(): number {
    if (!this.currentBattle) return 1000;
    
    const aiParticipant = this.currentBattle.participants[1];
    const difficulty = aiParticipant.aiDifficulty || 1;
    
    // Higher difficulty = longer thinking time (more realistic)
    return 500 + (difficulty * 300);
  }

  /**
   * End the battle and show results
   */
  private async endBattle(): Promise<void> {
    if (!this.currentBattle || !this.battleInterface) return;

    const result = this.currentBattle.result;
    if (!result) return;

    const playerWon = result.winnerId === this.currentBattle.participants[0].trainerId;
    const winner = playerWon ? 'player' : 'opponent';
    const experienceGained = result.experienceGained[this.currentBattle.participants[0].trainerId] || 0;

    // Show victory/defeat screen
    this.battleInterface.showVictoryScreen(winner, experienceGained);

    // Call battle end callback
    if (this.onBattleEnd) {
      this.onBattleEnd(result);
    }
  }

  /**
   * Set battle end callback
   */
  public onBattleEndCallback(callback: (result: any) => void): void {
    this.onBattleEnd = callback;
  }

  /**
   * Generate unique battle ID
   */
  private generateBattleId(): string {
    return 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current battle
   */
  public getCurrentBattle(): Battle | null {
    return this.currentBattle;
  }

  /**
   * Forfeit current battle
   */
  public async forfeitBattle(): Promise<void> {
    if (!this.battleEngine || !this.currentBattle) return;

    const forfeitAction: BattleAction = {
      type: 'forfeit' as any,
      participantIndex: 0,
      animalIndex: 0
    };

    await this.processPlayerAction(forfeitAction);
  }
}