import { Animal, Move } from '../types/animal.js';
import { Battle, BattleAction, BattleActionType } from '../types/battle.js';
import { TrainerProfile } from '../types/trainer.js';

/**
 * Battle interface system for turn-based combat
 */
export class BattleInterface {
  private container: HTMLElement;
  private currentBattle: Battle | null = null;
  private selectedAnimal: Animal | null = null;
  private selectedMove: Move | null = null;
  private animationQueue: BattleAnimation[] = [];
  private isAnimating = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeInterface();
  }

  /**
   * Initialize the battle interface HTML structure
   */
  private initializeInterface(): void {
    this.container.innerHTML = `
      <div class="battle-screen">
        <!-- Battle Header -->
        <div class="battle-header">
          <div class="trainer-info opponent">
            <div class="trainer-name" id="opponent-name">Wild Animal</div>
            <div class="trainer-level" id="opponent-level">Lv. 5</div>
          </div>
          <div class="battle-timer" id="battle-timer">30</div>
          <div class="trainer-info player">
            <div class="trainer-name" id="player-name">Player</div>
            <div class="trainer-level" id="player-level">Lv. 1</div>
          </div>
        </div>

        <!-- Battle Field -->
        <div class="battle-field">
          <!-- Opponent Animal -->
          <div class="animal-container opponent" id="opponent-animal">
            <div class="animal-sprite" id="opponent-sprite">🦁</div>
            <div class="health-bar-container">
              <div class="animal-name" id="opponent-animal-name">Lion</div>
              <div class="health-bar">
                <div class="health-fill" id="opponent-health" style="width: 100%"></div>
                <div class="health-text" id="opponent-health-text">100/100</div>
              </div>
              <div class="status-effects" id="opponent-status"></div>
            </div>
          </div>

          <!-- Player Animal -->
          <div class="animal-container player" id="player-animal">
            <div class="animal-sprite" id="player-sprite">🐺</div>
            <div class="health-bar-container">
              <div class="animal-name" id="player-animal-name">Wolf</div>
              <div class="health-bar">
                <div class="health-fill" id="player-health" style="width: 100%"></div>
                <div class="health-text" id="player-health-text">100/100</div>
              </div>
              <div class="status-effects" id="player-status"></div>
            </div>
          </div>

          <!-- Battle Effects -->
          <div class="battle-effects" id="battle-effects"></div>
        </div>

        <!-- Battle Controls -->
        <div class="battle-controls" id="battle-controls">
          <!-- Main Menu -->
          <div class="control-panel main-menu" id="main-menu">
            <button class="battle-button attack-btn" id="attack-btn">
              ⚔️ Attack
            </button>
            <button class="battle-button switch-btn" id="switch-btn">
              🔄 Switch
            </button>
            <button class="battle-button item-btn" id="item-btn">
              🎒 Items
            </button>
            <button class="battle-button forfeit-btn" id="forfeit-btn">
              🏃 Forfeit
            </button>
          </div>

          <!-- Move Selection -->
          <div class="control-panel move-menu hidden" id="move-menu">
            <div class="moves-grid" id="moves-grid">
              <!-- Moves will be populated dynamically -->
            </div>
            <button class="battle-button back-btn" id="move-back-btn">← Back</button>
          </div>

          <!-- Animal Switch Menu -->
          <div class="control-panel switch-menu hidden" id="switch-menu">
            <div class="animals-grid" id="animals-grid">
              <!-- Animals will be populated dynamically -->
            </div>
            <button class="battle-button back-btn" id="switch-back-btn">← Back</button>
          </div>

          <!-- Item Menu -->
          <div class="control-panel item-menu hidden" id="item-menu">
            <div class="items-grid" id="items-grid">
              <!-- Items will be populated dynamically -->
            </div>
            <button class="battle-button back-btn" id="item-back-btn">← Back</button>
          </div>
        </div>

        <!-- Battle Log -->
        <div class="battle-log" id="battle-log">
          <div class="log-content" id="log-content">
            <div class="log-message">Battle begins!</div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners to battle interface elements
   */
  private attachEventListeners(): void {
    // Main menu buttons
    document.getElementById('attack-btn')?.addEventListener('click', () => this.showMoveMenu());
    document.getElementById('switch-btn')?.addEventListener('click', () => this.showSwitchMenu());
    document.getElementById('item-btn')?.addEventListener('click', () => this.showItemMenu());
    document.getElementById('forfeit-btn')?.addEventListener('click', () => this.forfeitBattle());

    // Back buttons
    document.getElementById('move-back-btn')?.addEventListener('click', () => this.showMainMenu());
    document.getElementById('switch-back-btn')?.addEventListener('click', () => this.showMainMenu());
    document.getElementById('item-back-btn')?.addEventListener('click', () => this.showMainMenu());
  }

  /**
   * Start a new battle
   */
  public startBattle(battle: Battle): void {
    this.currentBattle = battle;
    this.updateBattleDisplay();
    this.addLogMessage('Battle begins!');
    this.showMainMenu();
  }

  /**
   * Update the battle display with current battle state
   */
  private updateBattleDisplay(): void {
    if (!this.currentBattle) return;

    const playerTeam = this.currentBattle.teams[0];
    const opponentTeam = this.currentBattle.teams[1];
    const playerAnimal = playerTeam[0];
    const opponentAnimal = opponentTeam[0];

    // Update player animal display
    this.updateAnimalDisplay('player', playerAnimal);
    
    // Update opponent animal display
    this.updateAnimalDisplay('opponent', opponentAnimal);

    // Update trainer info
    const playerTrainer = this.currentBattle.participants[0];
    const opponentTrainer = this.currentBattle.participants[1];
    
    document.getElementById('player-name')!.textContent = playerTrainer.trainerName;
    document.getElementById('opponent-name')!.textContent = opponentTrainer.trainerName;
  }

  /**
   * Update animal display (health, name, sprite, status effects)
   */
  private updateAnimalDisplay(side: 'player' | 'opponent', animal: Animal): void {
    const nameEl = document.getElementById(`${side}-animal-name`);
    const spriteEl = document.getElementById(`${side}-sprite`);
    const healthFillEl = document.getElementById(`${side}-health`);
    const healthTextEl = document.getElementById(`${side}-health-text`);
    const statusEl = document.getElementById(`${side}-status`);

    if (nameEl) nameEl.textContent = animal.nickname || animal.name;
    if (spriteEl) spriteEl.textContent = this.getAnimalEmoji(animal);
    
    // Update health bar
    const healthPercent = (animal.stats.health / animal.stats.maxHealth) * 100;
    if (healthFillEl) {
      healthFillEl.style.width = `${healthPercent}%`;
      healthFillEl.className = `health-fill ${this.getHealthBarClass(healthPercent)}`;
    }
    
    if (healthTextEl) {
      healthTextEl.textContent = `${animal.stats.health}/${animal.stats.maxHealth}`;
    }

    // Update status effects (placeholder for now)
    if (statusEl) {
      statusEl.innerHTML = '';
      // TODO: Add status effect indicators
    }
  }

  /**
   * Get emoji representation for an animal
   */
  private getAnimalEmoji(animal: Animal): string {
    // Simple mapping - in a real implementation, this would be more sophisticated
    const emojiMap: Record<string, string> = {
      'lion': '🦁',
      'wolf': '🐺',
      'bear': '🐻',
      'eagle': '🦅',
      'shark': '🦈',
      'elephant': '🐘',
      'tiger': '🐯',
      'fox': '🦊'
    };
    
    return emojiMap[animal.name.toLowerCase()] || '🐾';
  }

  /**
   * Get CSS class for health bar based on health percentage
   */
  private getHealthBarClass(healthPercent: number): string {
    if (healthPercent > 50) return 'health-high';
    if (healthPercent > 25) return 'health-medium';
    return 'health-low';
  }

  /**
   * Show the main battle menu
   */
  private showMainMenu(): void {
    this.hideAllMenus();
    document.getElementById('main-menu')?.classList.remove('hidden');
  }

  /**
   * Show the move selection menu
   */
  private showMoveMenu(): void {
    if (!this.currentBattle) return;
    
    const playerAnimal = this.currentBattle.teams[0][0];
    this.populateMoveMenu(playerAnimal.moves);
    
    this.hideAllMenus();
    document.getElementById('move-menu')?.classList.remove('hidden');
  }

  /**
   * Show the animal switch menu
   */
  private showSwitchMenu(): void {
    if (!this.currentBattle) return;
    
    const playerTeam = this.currentBattle.teams[0];
    this.populateSwitchMenu(playerTeam);
    
    this.hideAllMenus();
    document.getElementById('switch-menu')?.classList.remove('hidden');
  }

  /**
   * Show the item menu
   */
  private showItemMenu(): void {
    // TODO: Implement item menu population
    this.hideAllMenus();
    document.getElementById('item-menu')?.classList.remove('hidden');
  }

  /**
   * Hide all menu panels
   */
  private hideAllMenus(): void {
    document.querySelectorAll('.control-panel').forEach(panel => {
      panel.classList.add('hidden');
    });
  }

  /**
   * Populate the move selection menu
   */
  private populateMoveMenu(moves: Move[]): void {
    const movesGrid = document.getElementById('moves-grid');
    if (!movesGrid) return;

    movesGrid.innerHTML = '';
    
    moves.forEach((move, index) => {
      const moveButton = document.createElement('button');
      moveButton.className = 'move-button';
      moveButton.innerHTML = `
        <div class="move-name">${move.name}</div>
        <div class="move-info">
          <span class="move-type">${move.type}</span>
          <span class="move-power">PWR: ${move.power}</span>
        </div>
        <div class="move-description">${move.description}</div>
      `;
      
      moveButton.addEventListener('click', () => this.selectMove(move, index));
      movesGrid.appendChild(moveButton);
    });
  }

  /**
   * Populate the animal switch menu
   */
  private populateSwitchMenu(team: Animal[]): void {
    const animalsGrid = document.getElementById('animals-grid');
    if (!animalsGrid) return;

    animalsGrid.innerHTML = '';
    
    team.forEach((animal, index) => {
      if (index === 0) return; // Skip current animal
      
      const animalButton = document.createElement('button');
      animalButton.className = 'animal-button';
      animalButton.innerHTML = `
        <div class="animal-sprite-small">${this.getAnimalEmoji(animal)}</div>
        <div class="animal-info">
          <div class="animal-name">${animal.nickname || animal.name}</div>
          <div class="animal-level">Lv. ${animal.level}</div>
          <div class="animal-health">HP: ${animal.stats.health}/${animal.stats.maxHealth}</div>
        </div>
      `;
      
      animalButton.addEventListener('click', () => this.selectSwitch(animal, index));
      animalsGrid.appendChild(animalButton);
    });
  }

  /**
   * Handle move selection
   */
  private selectMove(move: Move, moveIndex: number): void {
    this.selectedMove = move;
    
    const action: BattleAction = {
      type: BattleActionType.ATTACK,
      participantIndex: 0, // Player is always index 0
      animalIndex: 0, // Current animal
      moveIndex,
      targetIndex: 0 // Opponent animal
    };
    
    this.submitAction(action);
    this.addLogMessage(`${this.currentBattle?.teams[0][0].name} used ${move.name}!`);
  }

  /**
   * Handle animal switch selection
   */
  private selectSwitch(animal: Animal, animalIndex: number): void {
    const action: BattleAction = {
      type: BattleActionType.SWITCH,
      participantIndex: 0,
      animalIndex: 0,
      switchToIndex: animalIndex
    };
    
    this.submitAction(action);
    this.addLogMessage(`Go, ${animal.nickname || animal.name}!`);
  }

  /**
   * Handle forfeit battle
   */
  private forfeitBattle(): void {
    const action: BattleAction = {
      type: BattleActionType.FORFEIT,
      participantIndex: 0,
      animalIndex: 0
    };
    
    this.submitAction(action);
    this.addLogMessage('You forfeited the battle!');
  }

  /**
   * Submit a battle action
   */
  private submitAction(action: BattleAction): void {
    // TODO: Send action to battle engine
    console.log('Battle action submitted:', action);
    this.showMainMenu();
  }

  /**
   * Add a message to the battle log
   */
  public addLogMessage(message: string): void {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'log-message';
    messageEl.textContent = message;
    
    logContent.appendChild(messageEl);
    logContent.scrollTop = logContent.scrollHeight;
  }

  /**
   * Play battle animation
   */
  public playAnimation(animation: BattleAnimation): Promise<void> {
    return new Promise((resolve) => {
      this.animationQueue.push(animation);
      if (!this.isAnimating) {
        this.processAnimationQueue().then(resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Process the animation queue
   */
  private async processAnimationQueue(): Promise<void> {
    this.isAnimating = true;
    
    while (this.animationQueue.length > 0) {
      const animation = this.animationQueue.shift()!;
      await this.executeAnimation(animation);
    }
    
    this.isAnimating = false;
  }

  /**
   * Execute a single animation
   */
  private async executeAnimation(animation: BattleAnimation): Promise<void> {
    return new Promise((resolve) => {
      const effectsContainer = document.getElementById('battle-effects');
      if (!effectsContainer) {
        resolve();
        return;
      }

      switch (animation.type) {
        case 'attack':
          this.animateAttack(animation, resolve);
          break;
        case 'damage':
          this.animateDamage(animation, resolve);
          break;
        case 'heal':
          this.animateHeal(animation, resolve);
          break;
        case 'status':
          this.animateStatusEffect(animation, resolve);
          break;
        default:
          resolve();
      }
    });
  }

  /**
   * Animate an attack
   */
  private animateAttack(animation: BattleAnimation, callback: () => void): void {
    const attackerEl = document.getElementById(
      animation.source === 'player' ? 'player-sprite' : 'opponent-sprite'
    );
    
    if (attackerEl) {
      attackerEl.classList.add('attack-animation');
      setTimeout(() => {
        attackerEl.classList.remove('attack-animation');
        callback();
      }, 600);
    } else {
      callback();
    }
  }

  /**
   * Animate damage
   */
  private animateDamage(animation: BattleAnimation, callback: () => void): void {
    const targetEl = document.getElementById(
      animation.target === 'player' ? 'player-animal' : 'opponent-animal'
    );
    
    if (targetEl) {
      targetEl.classList.add('damage-animation');
      
      // Show damage number
      const damageEl = document.createElement('div');
      damageEl.className = 'damage-number';
      damageEl.textContent = `-${animation.value}`;
      targetEl.appendChild(damageEl);
      
      setTimeout(() => {
        targetEl.classList.remove('damage-animation');
        damageEl.remove();
        callback();
      }, 800);
    } else {
      callback();
    }
  }

  /**
   * Animate healing
   */
  private animateHeal(animation: BattleAnimation, callback: () => void): void {
    const targetEl = document.getElementById(
      animation.target === 'player' ? 'player-animal' : 'opponent-animal'
    );
    
    if (targetEl) {
      targetEl.classList.add('heal-animation');
      
      // Show heal number
      const healEl = document.createElement('div');
      healEl.className = 'heal-number';
      healEl.textContent = `+${animation.value}`;
      targetEl.appendChild(healEl);
      
      setTimeout(() => {
        targetEl.classList.remove('heal-animation');
        healEl.remove();
        callback();
      }, 800);
    } else {
      callback();
    }
  }

  /**
   * Animate status effect
   */
  private animateStatusEffect(animation: BattleAnimation, callback: () => void): void {
    const targetEl = document.getElementById(
      animation.target === 'player' ? 'player-animal' : 'opponent-animal'
    );
    
    if (targetEl) {
      targetEl.classList.add('status-animation');
      setTimeout(() => {
        targetEl.classList.remove('status-animation');
        callback();
      }, 400);
    } else {
      callback();
    }
  }

  /**
   * Show victory screen
   */
  public showVictoryScreen(winner: string, experienceGained: number): void {
    const victoryScreen = document.createElement('div');
    victoryScreen.className = 'victory-screen';
    victoryScreen.innerHTML = `
      <div class="victory-content">
        <h2 class="victory-title">${winner === 'player' ? '🎉 Victory!' : '💔 Defeat'}</h2>
        <div class="victory-stats">
          <div class="exp-gained">Experience Gained: +${experienceGained}</div>
        </div>
        <button class="victory-button" id="victory-continue">Continue</button>
      </div>
    `;
    
    this.container.appendChild(victoryScreen);
    
    document.getElementById('victory-continue')?.addEventListener('click', () => {
      victoryScreen.remove();
      // TODO: Return to main game
    });
  }
}

/**
 * Battle animation interface
 */
export interface BattleAnimation {
  type: 'attack' | 'damage' | 'heal' | 'status';
  source?: 'player' | 'opponent';
  target?: 'player' | 'opponent';
  value?: number;
  duration?: number;
}