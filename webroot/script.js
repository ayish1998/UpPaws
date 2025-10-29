/** @typedef {import('./message.js').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('./message.js').WebViewMessage} WebViewMessage */

class AnimalQuestApp {
  constructor() {
    // Get references to HTML elements
    this.usernameLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#username'));
    this.userScoreLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#userScore'));
    this.userStreakVal = /** @type {HTMLSpanElement} */ (document.querySelector('#streakVal'));
    this.timerVal = /** @type {HTMLSpanElement} */ (document.querySelector('#timerVal'));
    this.challengeTitle = /** @type {HTMLHeadingElement} */ (document.querySelector('#challengeTitle'));
    this.challengeScenario = /** @type {HTMLParagraphElement} */ (document.querySelector('#challengeScenario'));
    this.emoji = /** @type {HTMLSpanElement} */ (document.querySelector('#emoji'));
    this.hintLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#hint'));
    this.answerSlots = /** @type {HTMLDivElement} */ (document.querySelector('#answerSlots'));
    this.letterBank = /** @type {HTMLDivElement} */ (document.querySelector('#letterBank'));
    
    this.puzzleSection = /** @type {HTMLDivElement} */ (document.querySelector('#puzzle-section'));
    this.resultSection = /** @type {HTMLDivElement} */ (document.querySelector('#result-section'));
    this.resultMessage = /** @type {HTMLDivElement} */ (document.querySelector('#result-message'));
    this.explanation = /** @type {HTMLParagraphElement} */ (document.querySelector('#explanation'));
    this.shareRow = /** @type {HTMLDivElement} */ (document.querySelector('#shareRow'));
    this.shareButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-share'));
    this.progress = /** @type {HTMLDivElement} */ (document.querySelector('#progress'));
    this.progressBar = /** @type {HTMLDivElement} */ (document.querySelector('#progressBar'));
    this.arcadeHud = /** @type {HTMLDivElement} */ (document.querySelector('#arcadeHud'));
    this.livesEl = /** @type {HTMLSpanElement} */ (document.querySelector('#lives'));
    this.comboEl = /** @type {HTMLSpanElement} */ (document.querySelector('#combo'));
    this.arcadeScoreEl = /** @type {HTMLSpanElement} */ (document.querySelector('#arcadeScore'));
    
    this.nextButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-next'));
    this.hintButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-hint'));
    this.submitButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-submit'));
    this.clearButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-clear'));
    this.muteToggle = /** @type {HTMLButtonElement} */ (document.querySelector('#muteToggle'));
    this.toast = /** @type {HTMLDivElement} */ (document.querySelector('#toast'));
    this.startOverlay = /** @type {HTMLDivElement} */ (document.querySelector('#startOverlay'));
    this.startButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-start'));
    this.countdownOverlay = /** @type {HTMLDivElement} */ (document.querySelector('#countdown'));
    this.countVal = /** @type {HTMLDivElement} */ (document.querySelector('#countVal'));
    const arcadeBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-arcade'));
    this.arcadeButton = arcadeBtn;
    this.powerFreeze = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-power-freeze'));
    this.powerReveal = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-power-reveal'));
    this.powerShuffle = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-power-shuffle'));
    this.leaderboardBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-leaderboard'));
    this.leaderboardOverlay = /** @type {HTMLDivElement} */ (document.querySelector('#leaderboardOverlay'));
    this.closeLeaderboardBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-close-leaderboard'));
    
    // Economy UI elements
    this.pawCoinsLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#pawCoins'));
    this.researchPointsLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#researchPoints'));
    this.battleTokensLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#battleTokens'));
    this.shopBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-shop'));
    this.shopOverlay = /** @type {HTMLDivElement} */ (document.querySelector('#shopOverlay'));
    this.closeShopBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-close-shop'));
    this.dailyRewardOverlay = /** @type {HTMLDivElement} */ (document.querySelector('#dailyRewardOverlay'));
    this.claimRewardBtn = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-claim-reward'));
    
    // Initialize data
    this.username = 'User';
    this.userScore = 0;
    this.puzzle = null;
    this.lastAnswerCorrect = false;
    this.timerId = null;
    this.countdownId = null;
    this.muted = false;
    this.usedHint = false;
    this.startTimeMs = 0;
    this.mode = 'daily';
    this.arcadeScore = 0;
    this.arcadeDifficulty = 1;
    this.lives = 3;
    this.combo = 1;
    this.freezeMs = 0;
    
    // Economy data
    this.trainerProfile = null;
    this.sessionId = null;
    this.cosmeticStore = [];
    
    // Add event listeners
    window.addEventListener('message', this.#onMessage);
    window.addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });
    });

    // Next / Back button
    this.nextButton.addEventListener('click', () => {
      try {
        console.log('Closing WebView');
        postWebViewMessage({ type: 'close' });
      } catch (e) {
        console.error('Failed to process next button click:', e);
      }
    });
    if (this.hintButton) this.hintButton.addEventListener('click', () => { this.#revealHint(); this.#playUi('hint'); });
    if (this.submitButton) this.submitButton.addEventListener('click', () => { this.#submitGuess(); this.#playUi('click'); });
    if (this.clearButton) this.clearButton.addEventListener('click', () => { this.#clearGuess(); this.#playUi('click'); });

    if (this.muteToggle) {
      this.muteToggle.addEventListener('click', () => {
        this.muted = !this.muted;
        this.muteToggle.textContent = this.muted ? '🔇' : '🔊';
      });
    }

    // Economy event listeners
    if (this.shopBtn) {
      this.shopBtn.addEventListener('click', () => {
        this.#showShop();
        this.#playUi('click');
      });
    }
    
    if (this.closeShopBtn) {
      this.closeShopBtn.addEventListener('click', () => {
        this.#hideShop();
        this.#playUi('click');
      });
    }
    
    if (this.claimRewardBtn) {
      this.claimRewardBtn.addEventListener('click', () => {
        this.#claimDailyReward();
        this.#playUi('click');
      });
    }
    
    // Shop tab switching
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#switchShopTab(btn.dataset.tab);
        this.#playUi('click');
      });
    });
    }
    if (this.startButton) this.startButton.addEventListener('click', () => { this.mode = 'daily'; this.#begin(); });
    if (this.arcadeButton) this.arcadeButton.addEventListener('click', () => { this.mode = 'arcade'; this.#begin(); });

    if (this.shareButton) {
      this.shareButton.addEventListener('click', () => this.#shareImage());
    }
    if (this.powerFreeze) this.powerFreeze.addEventListener('click', () => this.#useFreeze());
    if (this.powerReveal) this.powerReveal.addEventListener('click', () => this.#useReveal());
    if (this.powerShuffle) this.powerShuffle.addEventListener('click', () => this.#useShuffle());
    if (this.leaderboardBtn) this.leaderboardBtn.addEventListener('click', () => this.#showLeaderboard());
    if (this.closeLeaderboardBtn) this.closeLeaderboardBtn.addEventListener('click', () => this.#hideLeaderboard());
    
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        this.#switchLeaderboardTab(e.target.dataset.tab);
      }
    });

    // Educational Partnership event listeners
    this.educationBtn = document.querySelector('#btn-education');
    this.educationOverlay = document.querySelector('#educationOverlay');
    this.closeEducationBtn = document.querySelector('#btn-close-education');
    this.contentDetailOverlay = document.querySelector('#contentDetailOverlay');
    this.closeContentDetailBtn = document.querySelector('#btn-close-content-detail');
    this.amaQuestionOverlay = document.querySelector('#amaQuestionOverlay');
    this.closeAmaQuestionBtn = document.querySelector('#btn-close-ama-question');
    this.dataContributionOverlay = document.querySelector('#dataContributionOverlay');
    this.closeDataContributionBtn = document.querySelector('#btn-close-data-contribution');

    if (this.educationBtn) {
      this.educationBtn.addEventListener('click', () => {
        this.#showEducationOverlay();
        this.#playUi('click');
      });
    }

    if (this.closeEducationBtn) {
      this.closeEducationBtn.addEventListener('click', () => {
        this.#hideEducationOverlay();
        this.#playUi('click');
      });
    }

    if (this.closeContentDetailBtn) {
      this.closeContentDetailBtn.addEventListener('click', () => {
        this.#hideContentDetailOverlay();
        this.#playUi('click');
      });
    }

    if (this.closeAmaQuestionBtn) {
      this.closeAmaQuestionBtn.addEventListener('click', () => {
        this.#hideAmaQuestionOverlay();
        this.#playUi('click');
      });
    }

    if (this.closeDataContributionBtn) {
      this.closeDataContributionBtn.addEventListener('click', () => {
        this.#hideDataContributionOverlay();
        this.#playUi('click');
      });
    }

    // Education tab switching
    document.querySelectorAll('.education-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#switchEducationTab(btn.dataset.tab);
        this.#playUi('click');
      });
    });

    // Submit AMA question
    document.querySelector('#btn-submit-question')?.addEventListener('click', () => {
      this.#submitAmaQuestion();
      this.#playUi('click');
    });

    // Submit data contribution
    document.querySelector('#btn-submit-data')?.addEventListener('click', () => {
      this.#submitDataContribution();
      this.#playUi('click');
    });
  }
  
  /**
   * Handle answer selection
   * @param {string} answer
   */
  #submitGuess() {
    const guess = this.#currentGuess();
    if (!guess || guess.length < (this.puzzle?.answerLength || 1)) return;
    const secondsTaken = Math.round((Date.now() - this.startTimeMs) / 1000);
    postWebViewMessage({ type: 'submitGuess', data: { guess, secondsTaken, usedHint: this.usedHint } });
  }

  /**
   * @arg {MessageEvent<DevvitSystemMessage>} ev
   * @return {void}
   */
  #onMessage = (ev) => {
    console.log('Message received:', ev.data);
    
    // Reserved type for messages sent via `context.ui.webView.postMessage`
    if (ev.data.type !== 'devvit-message') return;
    
    try {
      const { message } = ev.data.data;
      console.log('Devvit message:', message);
      
      switch (message.type) {
        case 'initialData': {
          console.log('Received initialData:', message.data);
          const { username, puzzle, userScore, userStreak, leaderboard, trainerProfile, dailyReward, sessionId } = message.data;
          console.log('Puzzle data:', puzzle);
          
          this.username = username;
          this.userScore = userScore;
          this.puzzle = puzzle;
          this.trainerProfile = trainerProfile;
          this.sessionId = sessionId;
          
          // Update UI
          this.usernameLabel.innerText = username;
          this.userScoreLabel.innerText = userScore.toString();
          this.challengeTitle.innerText = 'Daily Animal Puzzle';
          this.challengeScenario.innerText = 'Arrange the letters to name the animal.';
          this.emoji.textContent = puzzle.emoji;
          this.hintLabel.textContent = 'Guess the animal';
          this.#buildBoard(puzzle.letters, puzzle.answerLength);
          
          // Update economy UI
          if (trainerProfile) {
            this.#updateCurrency(trainerProfile.currency);
            this.#updateInventory(trainerProfile.inventory);
          }
          
          // Show daily reward if available
          if (dailyReward) {
            this.#showDailyReward(dailyReward);
          }
          
          // Reset arcade HUD
          this.arcadeScore = 0;
          this.combo = 1;
          this.lives = 3;
          this.#syncArcadeHud();
          if (typeof userStreak === 'number') this.userStreakVal.innerText = String(userStreak);
          // Leaderboard
          if (Array.isArray(leaderboard) && leaderboard.length) {
            this.#renderLeaderboard(leaderboard);
          }
          
          // Load cosmetic store
          postWebViewMessage({ type: 'getCosmeticStore' });
          
          // Game is ready, auto-start immediately
          console.log('Game initialized with puzzle:', this.puzzle);
          
          // Hide start overlay immediately
          if (this.startOverlay) {
            this.startOverlay.classList.remove('visible');
            this.startOverlay.classList.add('hidden');
          }
          
          // Auto-start the game
          this.mode = 'daily';
          setTimeout(() => {
            this.#begin();
          }, 500);
          break;
        }
        case 'updateScore': {
          const { newScore } = message.data;
          this.userScore = newScore;
          this.userScoreLabel.innerText = newScore.toString();
          break;
        }
        case 'updateStreak': {
          const { newStreak } = message.data;
          this.userStreakVal.innerText = String(newStreak);
          if (newStreak === 3 || newStreak === 7) {
            this.#milestone(newStreak);
          }
          break;
        }
        case 'guessResult': {
          const { isCorrect, fact, answer } = message.data;
          this.lastAnswerCorrect = isCorrect;
          if (isCorrect) {
            // Win: stop timer
            this.#stopTimer();
            if (this.mode === 'arcade') {
              const elapsed = Math.round((Date.now() - this.startTimeMs) / 1000);
              const timeBonus = Math.max(0, Math.min(5, Math.ceil((15 - Math.min(15, elapsed)) / 3)));
              const gainedBase = Math.max(1, 5 + timeBonus - (this.usedHint ? 2 : 0));
              const gained = gainedBase * this.combo;
              this.arcadeScore += gained;
              this.combo = Math.min(5, this.combo + 1);
              this.arcadeDifficulty = Math.min(5, this.arcadeDifficulty + 1);
              this.#toast(`+${gained} (x${this.combo - 1} combo) — Score: ${this.arcadeScore}`);
              this.#syncArcadeHud();
              this.#playSound('correct');
              this.#playUi('win');
              postWebViewMessage({ type: 'getArcadePuzzle', data: { difficulty: this.arcadeDifficulty } });
            } else {
              this.puzzleSection.classList.add('hidden');
              this.resultSection.classList.remove('hidden');
              this.resultMessage.innerHTML = '✅ <span class="correct">Correct!</span>';
              this.#confetti();
              this.#playSound('correct');
              this.#playUi('win');
              if (this.shareRow) this.shareRow.classList.remove('hidden');
              this.explanation.innerText = fact;
            }
          } else {
            // Wrong: keep playing
            this.#playSound('incorrect');
            this.#playUi('lose');
            this.#shakeBoard();
            if (this.mode === 'arcade') {
              this.combo = 1; // reset combo
              this.lives -= 1;
              this.#syncArcadeHud();
              this.#toast(this.lives > 0 ? `Wrong! ❤️ ${this.lives} left` : 'No lives left');
              if (this.lives <= 0) {
                // game over -> notify server, show result panel
                this.#stopTimer();
                postWebViewMessage({ type: 'arcadeGameOver', data: { finalScore: this.arcadeScore } });
                this.puzzleSection.classList.add('hidden');
                this.resultSection.classList.remove('hidden');
                this.resultMessage.innerHTML = '🏁 <span class="incorrect">Game Over</span>';
                this.explanation.innerText = `Final score: ${this.arcadeScore}. Great run!`;
                if (this.shareRow) this.shareRow.classList.remove('hidden');
                return;
              }
            } else {
              this.#toast('Not quite. Try again!');
            }
          }
          break;
        }
        case 'nextArcadePuzzle': {
          const { puzzle } = message.data;
          this.puzzle = puzzle;
          this.puzzleSection.classList.remove('hidden');
          this.resultSection.classList.add('hidden');
          this.challengeTitle.innerText = 'Arcade — Next Animal';
          this.challengeScenario.innerText = 'Keep going! Each round gets tougher.';
          this.emoji.textContent = puzzle.emoji;
          this.hintLabel.textContent = 'Arcade: beat the clock!';
          this.#buildBoard(puzzle.letters, puzzle.answerLength);
          this.usedHint = false;
          this.#countdown(() => this.#startTimer());
          break;
        }
        case 'updateArcadeBest': {
          // reserved for future UI
          break;
        }
        case 'leaderboardData': {
          const { daily, arcade, streaks } = message.data;
          this.#renderLeaderboardData(daily, arcade, streaks);
          break;
        }
        case 'purchaseResult': {
          const { success, error, currency, inventory } = message.data;
          if (success) {
            this.#updateCurrency(currency);
            this.#updateInventory(inventory);
            this.#toast('Purchase successful!');
          } else {
            this.#toast(`Purchase failed: ${error || 'Unknown error'}`, 'error');
          }
          break;
        }
        case 'premiumResult': {
          const { success, error, premiumTier, currency } = message.data;
          if (success) {
            this.#updateCurrency(currency);
            this.#toast(`Premium subscription activated: ${premiumTier}!`);
            this.#hideShop();
          } else {
            this.#toast(`Premium purchase failed: ${error || 'Unknown error'}`, 'error');
          }
          break;
        }
        case 'cosmeticResult': {
          const { success, error, unlockedCosmetics, currency } = message.data;
          if (success) {
            this.#updateCurrency(currency);
            this.#toast('Cosmetic unlocked!');
          } else {
            this.#toast(`Cosmetic purchase failed: ${error || 'Unknown error'}`, 'error');
          }
          break;
        }
        case 'cosmeticStore': {
          const { items } = message.data;
          this.cosmeticStore = items;
          this.#renderCosmeticStore();
          break;
        }
        case 'useItemResult': {
          const { success, error, inventory } = message.data;
          if (success) {
            this.#updateInventory(inventory);
            this.#toast('Item used successfully!');
          } else {
            this.#toast(`Failed to use item: ${error || 'Unknown error'}`, 'error');
          }
          break;
        }
        case 'educationalPartners': {
          const { organizations } = message.data;
          this.#renderEducationalPartners(organizations);
          break;
        }
        case 'sponsoredContent': {
          const { content } = message.data;
          this.#renderSponsoredContent(content);
          break;
        }
        case 'sponsoredContentError': {
          const { error } = message.data;
          this.#toast(`Failed to load content: ${error}`, 'error');
          break;
        }
        case 'contentCompletionResult': {
          const { success, rewards, impactPoints } = message.data;
          if (success) {
            this.#toast(`Activity completed! Earned ${impactPoints} impact points`, 'success');
            this.#showContentRewards(rewards);
          } else {
            this.#toast('Failed to complete activity', 'error');
          }
          break;
        }
        case 'conservationImpact': {
          const { personalImpact, globalImpact } = message.data;
          this.#renderConservationImpact(personalImpact, globalImpact);
          break;
        }
        case 'expertAMAs': {
          const { amas } = message.data;
          this.#renderExpertAMAs(amas);
          break;
        }
        case 'amaQuestionResult': {
          const { success } = message.data;
          if (success) {
            this.#toast('Question submitted successfully!', 'success');
            this.#hideAmaQuestionOverlay();
          } else {
            this.#toast('Failed to submit question', 'error');
          }
          break;
        }
        case 'citizenScienceProjects': {
          const { projects } = message.data;
          this.#renderCitizenScienceProjects(projects);
          break;
        }
        case 'dataContributionResult': {
          const { success } = message.data;
          if (success) {
            this.#toast('Data contribution submitted successfully!', 'success');
            this.#hideDataContributionOverlay();
            // Refresh contributions list
            postWebViewMessage({ type: 'getTrainerContributions' });
          } else {
            this.#toast('Failed to submit data contribution', 'error');
          }
          break;
        }
        case 'trainerContributions': {
          const { contributions } = message.data;
          this.#renderTrainerContributions(contributions);
          break;
        }
        default: {
          console.error('Unknown message type', message);
          break;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error, ev.data);
    }
  };
  
  

  /** Build tiles and slots */
  #buildBoard(letters, answerLength) {
    console.log('Building board with letters:', letters, 'answerLength:', answerLength);
    console.log('answerSlots element:', this.answerSlots);
    console.log('letterBank element:', this.letterBank);
    
    if (!this.answerSlots || !this.letterBank) {
      console.error('Missing DOM elements for game board!');
      return;
    }
    
    this.answerSlots.innerHTML = '';
    this.letterBank.innerHTML = '';
    this.usedHint = false;
    // slots
    for (let i = 0; i < answerLength; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.index = String(i);
      slot.addEventListener('click', () => {
        // remove last filled tile
        for (let j = this.answerSlots.children.length - 1; j >= 0; j--) {
          const el = this.answerSlots.children[j];
          if (el.textContent) {
            this.#returnTile(el.textContent);
            el.textContent = '';
            break;
          }
        }
      });
      this.answerSlots.appendChild(slot);
    }
    // letter tiles
    letters.forEach((ch) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = ch;
      tile.addEventListener('click', () => { this.#placeTile(ch, tile); this.#playUi('click'); });
      this.letterBank.appendChild(tile);
    });
  }

  #placeTile(ch, tile) {
    for (let i = 0; i < this.answerSlots.children.length; i++) {
      const slot = this.answerSlots.children[i];
      if (!slot.textContent) {
        slot.textContent = ch;
        tile.style.visibility = 'hidden';
        tile.classList.add('tile-pop');
        slot.classList.add('slot-pulse');
        setTimeout(() => slot.classList.remove('slot-pulse'), 240);
        break;
      }
    }
  }

  #returnTile(ch) {
    // return a hidden tile with the same letter
    for (let i = 0; i < this.letterBank.children.length; i++) {
      const t = this.letterBank.children[i];
      if (t.textContent === ch && t.style.visibility === 'hidden') {
        t.style.visibility = 'visible';
        break;
      }
    }
  }

  #currentGuess() {
    let s = '';
    for (let i = 0; i < this.answerSlots.children.length; i++) {
      s += this.answerSlots.children[i].textContent || '';
    }
    return s;
  }

  #clearGuess() {
    for (let i = 0; i < this.answerSlots.children.length; i++) {
      const ch = this.answerSlots.children[i].textContent;
      if (ch) this.#returnTile(ch);
      this.answerSlots.children[i].textContent = '';
    }
  }

  #shakeBoard() {
    if (!this.answerSlots) return;
    this.answerSlots.classList.add('shake');
    setTimeout(() => this.answerSlots.classList.remove('shake'), 360);
  }

  #revealHint() {
    if (this.usedHint || !this.puzzle) return;
    this.hintLabel.textContent = this.puzzle.hint;
    this.usedHint = true;
  }

  #syncArcadeHud() {
    if (!this.arcadeHud) return;
    if (this.mode === 'arcade') {
      this.arcadeHud.classList.remove('hidden');
      if (this.livesEl) this.livesEl.textContent = String(this.lives);
      if (this.comboEl) this.comboEl.textContent = String(this.combo);
      if (this.arcadeScoreEl) this.arcadeScoreEl.textContent = String(this.arcadeScore);
    } else {
      this.arcadeHud.classList.add('hidden');
    }
  }

  #useFreeze() {
    if (this.mode !== 'arcade' || !this.timerId) return;
    this.#toast('❄️ Time frozen!');
    // pause the timer for 3 seconds by clearing interval and restarting with adjusted startTime
    const now = Date.now();
    const elapsed = now - this.startTimeMs;
    this.#stopTimer();
    setTimeout(() => {
      // resume with same elapsed baseline
      this.startTimeMs = Date.now() - elapsed;
      this.progress.classList.remove('hidden');
      this.timerId = setInterval(() => {
        const durationMs = 15000;
        const elapsed2 = Date.now() - this.startTimeMs;
        const pct = Math.min(100, (elapsed2 / durationMs) * 100);
        this.progressBar.style.width = pct + '%';
        const secsLeft = Math.max(0, Math.ceil((durationMs - elapsed2) / 1000));
        if (this.timerVal) this.timerVal.textContent = String(secsLeft);
        if (elapsed2 >= durationMs) {
          this.#stopTimer();
          this.puzzleSection.classList.add('hidden');
          this.resultSection.classList.remove('hidden');
          this.resultMessage.innerHTML = `⏳ <span class="incorrect">Time's up.</span>`;
          this.explanation.innerText = 'Try again tomorrow!';
          this.nextButton.innerText = 'Back to Reddit';
        }
      }, 100);
    }, 3000);
  }

  #useReveal() {
    if (this.mode !== 'arcade' || !this.puzzle || !this.puzzle.answer) return;
    // fill one correct letter in the first empty slot
    const answer = this.puzzle.answer;
    for (let i = 0; i < this.answerSlots.children.length; i++) {
      const slot = this.answerSlots.children[i];
      if (!slot.textContent) {
        const ch = answer[i];
        slot.textContent = ch;
        // hide one matching tile from bank if available
        for (let j = 0; j < this.letterBank.children.length; j++) {
          const t = this.letterBank.children[j];
          if (t.textContent === ch && t.style.visibility !== 'hidden') {
            t.style.visibility = 'hidden';
            break;
          }
        }
        slot.classList.add('slot-pulse');
        setTimeout(() => slot.classList.remove('slot-pulse'), 240);
        this.#toast('✨ Revealed a letter');
        break;
      }
    }
  }

  #useShuffle() {
    if (!this.letterBank) return;
    const letters = [];
    for (let i = 0; i < this.letterBank.children.length; i++) {
      const t = this.letterBank.children[i];
      if (t.style.visibility !== 'hidden') letters.push(t.textContent);
    }
    // shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // re-render bank for visible tiles
    let k = 0;
    for (let i = 0; i < this.letterBank.children.length; i++) {
      const t = this.letterBank.children[i];
      if (t.style.visibility !== 'hidden') t.textContent = letters[k++];
    }
    this.#toast('🔀 Shuffled');
    this.#playUi('click');
  }

  #showLeaderboard() {
    if (this.leaderboardOverlay) {
      this.leaderboardOverlay.classList.remove('hidden');
      this.leaderboardOverlay.classList.add('visible');
      postWebViewMessage({ type: 'getLeaderboard' });
    }
  }

  #hideLeaderboard() {
    if (this.leaderboardOverlay) {
      this.leaderboardOverlay.classList.remove('visible');
      this.leaderboardOverlay.classList.add('hidden');
    }
  }

  #switchLeaderboardTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.leaderboard-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`#leaderboard-${tabName}`).classList.add('active');
  }

  #renderLeaderboardData(daily, arcade, streaks) {
    this.#renderLeaderboardList('daily-list', daily, 'score', '⭐');
    this.#renderLeaderboardList('arcade-list', arcade, 'best', '🎯');
    this.#renderLeaderboardList('streaks-list', streaks, 'streak', '🔥');
  }

  #renderLeaderboardList(containerId, data, valueKey, icon) {
    const container = document.querySelector(`#${containerId}`);
    if (!container) return;
    
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #ccc; padding: 2rem;">No data yet</div>';
      return;
    }
    
    data.slice(0, 10).forEach((entry, index) => {
      const div = document.createElement('div');
      div.className = 'leaderboard-entry';
      if (entry.username === this.username) {
        div.classList.add('current-user');
      }
      div.innerHTML = `
        <div>
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-username">u/${entry.username}</span>
        </div>
        <div class="leaderboard-value">${icon} ${entry[valueKey]}</div>
      `;
      container.appendChild(div);
    });
  }

  /** Timer / progress bar (15s) */
  #startTimer() {
    this.#stopTimer();
    if (!this.progress || !this.progressBar) return;
    const durationMs = 15000;
    const start = Date.now();
    this.startTimeMs = start;
    this.progressBar.style.width = '0%';
    this.progress.classList.remove('hidden');
    this.timerId = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      this.progressBar.style.width = pct + '%';
      const secsLeft = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      if (this.timerVal) this.timerVal.textContent = String(secsLeft);
      if (elapsed >= durationMs) {
        this.#stopTimer();
        // Time up: show result as incorrect without guessing
        this.puzzleSection.classList.add('hidden');
        this.resultSection.classList.remove('hidden');
        this.resultMessage.innerHTML = `⏳ <span class="incorrect">Time's up.</span>`;
        this.explanation.innerText = 'Try again tomorrow!';
        this.nextButton.innerText = 'Back to Reddit';
      }
    }, 100);
  }

  #stopTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
    if (this.progress) this.progress.classList.add('hidden');
  }

  #begin() {
    console.log('Begin called, puzzle:', this.
    if (!this.puzzle || !this.puzzle.letters) {
      this.#toast('Loading puzzle...');
      // try again shortly
      setTimeout(() => this.#begin(), 400);
      return;
    }
    
    // Hide start overlay
    if (this.startOverlay) {
      this.startOverlay.classList.remove('visible');
      this.startOverlay.classList.add('hidden');
    }
    
    this.#countdown(() => {
      this.#toast('Go!');
      this.#startTimer();
    });
  }

  #toast(text) {
    if (!this.toast) return;
    this.toast.textContent = text;
    this.toast.classList.remove('hidden');
    clearTimeout(this.toast._t);
    this.toast._t = setTimeout(() => this.toast.classList.add('hidden'), 1200);
  }

  #countdown(done) {
    if (!this.countdownOverlay || !this.countVal) return done();
    let n = 3;
    this.countVal.textContent = String(n);
    this.countdownOverlay.classList.remove('hidden');
    this.countdownOverlay.classList.add('visible');
    const tick = () => {
      this.#playUi('beep');
      if (n === 0) {
        this.countdownOverlay.classList.remove('visible');
        this.countdownOverlay.classList.add('hidden');
        done();
        return;
      }
      this.countVal.textContent = n === 0 ? 'Go' : String(n);
      this.countVal.classList.remove('count-num');
      void this.countVal.offsetWidth; // reflow to retrigger animation
      this.countVal.classList.add('count-num');
      n -= 1;
      setTimeout(tick, 600);
    };
    setTimeout(tick, 100);
  }

  #playUi(kind) {
    if (this.muted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      let freq = 440;
      if (kind === 'beep') freq = 660;
      if (kind === 'hint') freq = 300;
      if (kind === 'click') freq = 520;
      if (kind === 'win') freq = 880;
      if (kind === 'lose') freq = 200;
      o.frequency.value = freq;
      o.type = 'sine';
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.start();
      o.stop(ctx.currentTime + 0.22);
    } catch {}
  }

  /**
   * Simple confetti effect
   */
  #confetti() {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = ['#ff4500', '#46a758', '#0079d3', '#e54d2e'][i % 4];
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 2200);
    }
  }

  #renderLeaderboard(entries) {
    if (!this.leaderboard) return;
    this.leaderboard.innerHTML = '';
    entries.slice(0, 5).forEach((e, i) => {
      const row = document.createElement('div');
      row.className = 'entry';
      row.innerHTML = `<span>${i + 1}. u/${e.username}</span><span>${e.score} pts</span>`;
      this.leaderboard.appendChild(row);
    });
    this.leaderboard.classList.remove('hidden');
  }

  #playSound(type) {
    if (this.muted) return;
    const freq = type === 'correct' ? 880 : 220;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start();
      o.stop(ctx.currentTime + 0.27);
    } catch (e) {
      // ignore audio errors
    }
  }

  #milestone(n) {
    // extra confetti burst and message
    for (let i = 0; i < 2; i++) this.#confetti();
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.top = '20px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.background = 'rgba(0,0,0,0.8)';
    msg.style.color = 'white';
    msg.style.padding = '8px 12px';
    msg.style.borderRadius = '999px';
    msg.style.zIndex = '9999';
    msg.textContent = `🔥 ${n}-day streak!`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1600);
  }

  #shareImage() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 418;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // title
      ctx.fillStyle = '#ff4500';
      ctx.font = 'bold 42px Segoe UI, Arial';
      ctx.fillText('UpPaws — Daily Animal Puzzle', 40, 80);
      // username + score + streak
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Segoe UI, Arial';
      ctx.fillText(`u/${this.username}`, 40, 140);
      ctx.fillText(`Score: ${this.userScore}  |  Streak: ${this.userStreakVal ? this.userStreakVal.textContent : '0'} 🔥`, 40, 176);
      // puzzle emoji row
      const emojis = ['🐯','🦊','🦁','🐼','🦉','🦓','🦒','🐠'];
      ctx.font = '64px Segoe UI Emoji';
      for (let i = 0; i < 6; i++) {
        ctx.fillText(emojis[i % emojis.length], 40 + i * 120, 300);
      }

      // Prefer Web Share API if available (mobile)
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) return this.#fallbackDownload(canvas);
          try {
            const file = new File([blob], 'UpPaws-win.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: 'UpPaws', text: 'I solved today\'s UpPaws puzzle!' });
              this.#toast('Shared!');
            } else {
              this.#fallbackDownload(canvas);
            }
          } catch (e) {
            this.#fallbackDownload(canvas);
          }
        }, 'image/png');
      } else {
        // Fallback: download
        this.#fallbackDownload(canvas);
      }
    } catch (e) {
      this.#toast('Share failed');
    }
  }

  #fallbackDownload(canvas) {
    const a = document.createElement('a');
    a.download = 'UpPaws-win.png';
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.#toast('Image saved');
  }
}

/**
 * Sends a message to the Devvit app.
 * @arg {WebViewMessage} msg
 * @return {void}
 */
function postWebViewMessage(msg) {
  try {
    console.log('Posting message to parent:', msg);
    // Make sure the message has a type property and is serializable
    const safeMsg = {
      type: msg.type,
      data: msg.data || {}
    };
    window.parent.postMessage(safeMsg, '*');
  } catch (e) {
    console.error('Failed to post message:', e);
  }
}

// Initialize the app
new AnimalQuestApp();
// Bat
tle System Integration
class BattleManager {
  constructor(app) {
    this.app = app;
    this.currentBattle = null;
    this.battleInterface = null;
    this.isInBattle = false;
  }

  /**
   * Start a battle
   */
  startBattle(battleData) {
    this.currentBattle = battleData;
    this.isInBattle = true;
    
    // Hide main game UI
    document.getElementById('puzzle-section')?.classList.add('hidden');
    document.getElementById('result-section')?.classList.add('hidden');
    
    // Create battle interface
    this.createBattleInterface();
    
    // Initialize battle display
    this.updateBattleDisplay();
  }

  /**
   * Create the battle interface HTML
   */
  createBattleInterface() {
    const gameRoot = document.getElementById('gameRoot');
    if (!gameRoot) return;

    const battleContainer = document.createElement('div');
    battleContainer.id = 'battle-container';
    battleContainer.className = 'battle-screen';
    
    battleContainer.innerHTML = `
      <!-- Battle Header -->
      <div class="battle-header">
        <div class="trainer-info opponent">
          <div class="trainer-name" id="battle-opponent-name">Wild Animal</div>
          <div class="trainer-level" id="battle-opponent-level">Lv. 5</div>
        </div>
        <div class="battle-timer" id="battle-timer">30</div>
        <div class="trainer-info player">
          <div class="trainer-name" id="battle-player-name">Player</div>
          <div class="trainer-level" id="battle-player-level">Lv. 1</div>
        </div>
      </div>

      <!-- Battle Field -->
      <div class="battle-field">
        <!-- Opponent Animal -->
        <div class="animal-container opponent" id="battle-opponent-animal">
          <div class="animal-sprite" id="battle-opponent-sprite">🦁</div>
          <div class="health-bar-container">
            <div class="animal-name" id="battle-opponent-animal-name">Lion</div>
            <div class="health-bar">
              <div class="health-fill" id="battle-opponent-health" style="width: 100%"></div>
              <div class="health-text" id="battle-opponent-health-text">100/100</div>
            </div>
            <div class="status-effects" id="battle-opponent-status"></div>
          </div>
        </div>

        <!-- Player Animal -->
        <div class="animal-container player" id="battle-player-animal">
          <div class="animal-sprite" id="battle-player-sprite">🐺</div>
          <div class="health-bar-container">
            <div class="animal-name" id="battle-player-animal-name">Wolf</div>
            <div class="health-bar">
              <div class="health-fill" id="battle-player-health" style="width: 100%"></div>
              <div class="health-text" id="battle-player-health-text">100/100</div>
            </div>
            <div class="status-effects" id="battle-player-status"></div>
          </div>
        </div>

        <!-- Battle Effects -->
        <div class="battle-effects" id="battle-effects"></div>
      </div>

      <!-- Battle Controls -->
      <div class="battle-controls" id="battle-controls">
        <!-- Main Menu -->
        <div class="control-panel main-menu" id="battle-main-menu">
          <button class="battle-button attack-btn" id="battle-attack-btn">
            ⚔️ Attack
          </button>
          <button class="battle-button switch-btn" id="battle-switch-btn">
            🔄 Switch
          </button>
          <button class="battle-button item-btn" id="battle-item-btn">
            🎒 Items
          </button>
          <button class="battle-button forfeit-btn" id="battle-forfeit-btn">
            🏃 Forfeit
          </button>
        </div>

        <!-- Move Selection -->
        <div class="control-panel move-menu hidden" id="battle-move-menu">
          <div class="moves-grid" id="battle-moves-grid">
            <!-- Moves will be populated dynamically -->
          </div>
          <button class="battle-button back-btn" id="battle-move-back-btn">← Back</button>
        </div>
      </div>

      <!-- Battle Log -->
      <div class="battle-log" id="battle-log">
        <div class="log-content" id="battle-log-content">
          <div class="log-message">Battle begins!</div>
        </div>
      </div>
    `;

    gameRoot.appendChild(battleContainer);
    this.attachBattleEventListeners();
  }

  /**
   * Attach event listeners for battle interface
   */
  attachBattleEventListeners() {
    // Main menu buttons
    document.getElementById('battle-attack-btn')?.addEventListener('click', () => this.showMoveMenu());
    document.getElementById('battle-forfeit-btn')?.addEventListener('click', () => this.forfeitBattle());

    // Back buttons
    document.getElementById('battle-move-back-btn')?.addEventListener('click', () => this.showMainMenu());
  }

  /**
   * Update battle display with current battle state
   */
  updateBattleDisplay() {
    if (!this.currentBattle) return;

    const playerAnimal = this.currentBattle.playerTeam[0];
    const opponentAnimal = this.currentBattle.opponentTeam[0];

    // Update player animal display
    this.updateAnimalDisplay('player', playerAnimal);
    
    // Update opponent animal display
    this.updateAnimalDisplay('opponent', opponentAnimal);

    // Update trainer info
    document.getElementById('battle-player-name').textContent = this.currentBattle.playerName || 'Player';
    document.getElementById('battle-opponent-name').textContent = this.currentBattle.opponentName || 'Wild Animal';
  }

  /**
   * Update animal display (health, name, sprite, status effects)
   */
  updateAnimalDisplay(side, animal) {
    const nameEl = document.getElementById(`battle-${side}-animal-name`);
    const spriteEl = document.getElementById(`battle-${side}-sprite`);
    const healthFillEl = document.getElementById(`battle-${side}-health`);
    const healthTextEl = document.getElementById(`battle-${side}-health-text`);

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
  }

  /**
   * Get emoji representation for an animal
   */
  getAnimalEmoji(animal) {
    const emojiMap = {
      'lion': '🦁',
      'wolf': '🐺',
      'bear': '🐻',
      'eagle': '🦅',
      'shark': '🦈',
      'elephant': '🐘',
      'tiger': '🐯',
      'fox': '🦊',
      'hippo': '🦛',
      'giraffe': '🦒',
      'panda': '🐼',
      'crocodile': '🐊'
    };
    
    return emojiMap[animal.name.toLowerCase()] || '🐾';
  }

  /**
   * Get CSS class for health bar based on health percentage
   */
  getHealthBarClass(healthPercent) {
    if (healthPercent > 50) return 'health-high';
    if (healthPercent > 25) return 'health-medium';
    return 'health-low';
  }

  /**
   * Show the main battle menu
   */
  showMainMenu() {
    this.hideAllBattleMenus();
    document.getElementById('battle-main-menu')?.classList.remove('hidden');
  }

  /**
   * Show the move selection menu
   */
  showMoveMenu() {
    if (!this.currentBattle) return;
    
    const playerAnimal = this.currentBattle.playerTeam[0];
    this.populateMoveMenu(playerAnimal.moves);
    
    this.hideAllBattleMenus();
    document.getElementById('battle-move-menu')?.classList.remove('hidden');
  }

  /**
   * Hide all battle menu panels
   */
  hideAllBattleMenus() {
    document.querySelectorAll('#battle-container .control-panel').forEach(panel => {
      panel.classList.add('hidden');
    });
  }

  /**
   * Populate the move selection menu
   */
  populateMoveMenu(moves) {
    const movesGrid = document.getElementById('battle-moves-grid');
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
   * Handle move selection
   */
  selectMove(move, moveIndex) {
    this.addBattleLogMessage(`${this.currentBattle.playerTeam[0].name} used ${move.name}!`);
    
    // Send battle action to backend
    postWebViewMessage({
      type: 'battleAction',
      data: {
        action: 'attack',
        moveIndex: moveIndex,
        targetIndex: 0
      }
    });
    
    this.showMainMenu();
  }

  /**
   * Handle forfeit battle
   */
  forfeitBattle() {
    this.addBattleLogMessage('You forfeited the battle!');
    
    // Send forfeit action to backend
    postWebViewMessage({
      type: 'battleAction',
      data: {
        action: 'forfeit'
      }
    });
    
    // End battle after a delay
    setTimeout(() => {
      this.endBattle({ winner: 'opponent', experienceGained: 0 });
    }, 2000);
  }

  /**
   * Add a message to the battle log
   */
  addBattleLogMessage(message) {
    const logContent = document.getElementById('battle-log-content');
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
  async playBattleAnimation(animation) {
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
        default:
          resolve();
      }
    });
  }

  /**
   * Animate an attack
   */
  animateAttack(animation, callback) {
    const attackerEl = document.getElementById(
      animation.source === 'player' ? 'battle-player-sprite' : 'battle-opponent-sprite'
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
  animateDamage(animation, callback) {
    const targetEl = document.getElementById(
      animation.target === 'player' ? 'battle-player-animal' : 'battle-opponent-animal'
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
   * End the battle and show results
   */
  endBattle(result) {
    this.isInBattle = false;
    
    // Remove battle interface
    const battleContainer = document.getElementById('battle-container');
    if (battleContainer) {
      battleContainer.remove();
    }
    
    // Show victory/defeat screen
    this.showBattleResult(result);
    
    // Show main game UI
    document.getElementById('puzzle-section')?.classList.remove('hidden');
  }

  /**
   * Show battle result screen
   */
  showBattleResult(result) {
    const victoryScreen = document.createElement('div');
    victoryScreen.className = 'victory-screen';
    victoryScreen.innerHTML = `
      <div class="victory-content">
        <h2 class="victory-title">${result.winner === 'player' ? '🎉 Victory!' : '💔 Defeat'}</h2>
        <div class="victory-stats">
          <div class="exp-gained">Experience Gained: +${result.experienceGained}</div>
        </div>
        <button class="victory-button" id="victory-continue">Continue</button>
      </div>
    `;
    
    document.getElementById('gameRoot').appendChild(victoryScreen);
    
    document.getElementById('victory-continue')?.addEventListener('click', () => {
      victoryScreen.remove();
    });
  }

  /**
   * Process battle update from backend
   */
  processBattleUpdate(updateData) {
    if (!this.isInBattle) return;

    switch (updateData.type) {
      case 'battleState':
        this.currentBattle = updateData.battle;
        this.updateBattleDisplay();
        break;
        
      case 'battleMessage':
        this.addBattleLogMessage(updateData.message);
        break;
        
      case 'battleAnimation':
        this.playBattleAnimation(updateData.animation);
        break;
        
      case 'battleEnd':
        this.endBattle(updateData.result);
        break;
    }
  }
}

// Add battle manager to the main app
if (typeof AnimalQuestApp !== 'undefined') {
  AnimalQuestApp.prototype.initBattleSystem = function() {
    this.battleManager = new BattleManager(this);
  };

  // Add battle message handling to the main message handler
  const originalOnMessage = AnimalQuestApp.prototype._onMessage;
  AnimalQuestApp.prototype._onMessage = function(ev) {
    // Call original message handler
    originalOnMessage.call(this, ev);
    
    // Handle battle-specific messages
    if (ev.data.type === 'devvit-message') {
      const { message } = ev.data.data;
      
      switch (message.type) {
        case 'startBattle':
          if (this.battleManager) {
            this.battleManager.startBattle(message.data);
          }
          break;
          
        case 'battleUpdate':
          if (this.battleManager) {
            this.battleManager.processBattleUpdate(message.data);
          }
          break;
      }
    }
  };

  // Initialize battle system when app is created
  const originalConstructor = AnimalQuestApp;
  AnimalQuestApp = function() {
    originalConstructor.call(this);
    this.initBattleSystem();
  };
  
  // Copy prototype
  AnimalQuestApp.prototype = originalConstructor.prototype;
}  // Economy
 methods
  #updateCurrency(currency) {
    if (!currency) return;
    if (this.pawCoinsLabel) this.pawCoinsLabel.innerText = currency.pawCoins.toString();
    if (this.researchPointsLabel) this.researchPointsLabel.innerText = currency.researchPoints.toString();
    if (this.battleTokensLabel) this.battleTokensLabel.innerText = currency.battleTokens.toString();
  }

  #updateInventory(inventory) {
    if (!inventory) return;
    // Update inventory display if needed
    console.log('Inventory updated:', inventory);
  }

  #showShop() {
    if (this.shopOverlay) {
      this.shopOverlay.classList.remove('hidden');
      this.#setupShopEventListeners();
    }
  }

  #hideShop() {
    if (this.shopOverlay) {
      this.shopOverlay.classList.add('hidden');
    }
  }

  #switchShopTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.querySelector(`#shop-${tabName}`);
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedBtn) selectedBtn.classList.add('active');
  }

  #setupShopEventListeners() {
    // Item purchase buttons
    document.querySelectorAll('.shop-item .btn-buy').forEach(btn => {
      btn.onclick = (e) => {
        const shopItem = e.target.closest('.shop-item');
        const itemId = shopItem.dataset.item;
        this.#purchaseItem(itemId);
      };
    });

    // Premium purchase buttons
    document.querySelectorAll('.premium-tier .btn-buy-premium').forEach(btn => {
      btn.onclick = (e) => {
        const premiumTier = e.target.closest('.premium-tier');
        const tier = premiumTier.dataset.tier;
        this.#purchasePremium(tier);
      };
    });
  }

  #purchaseItem(itemId) {
    postWebViewMessage({
      type: 'purchaseItem',
      data: {
        itemId: itemId,
        quantity: 1,
        sessionId: this.sessionId
      }
    });
  }

  #purchasePremium(tier) {
    postWebViewMessage({
      type: 'purchasePremium',
      data: {
        tier: tier,
        duration: 30, // 30 days
        sessionId: this.sessionId
      }
    });
  }

  #purchaseCosmetic(cosmeticId) {
    postWebViewMessage({
      type: 'purchaseCosmetic',
      data: {
        cosmeticId: cosmeticId,
        sessionId: this.sessionId
      }
    });
  }

  #renderCosmeticStore() {
    const cosmeticsGrid = document.querySelector('#cosmetics-grid');
    if (!cosmeticsGrid || !this.cosmeticStore) return;

    cosmeticsGrid.innerHTML = '';
    
    this.cosmeticStore.forEach(cosmetic => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'shop-item';
      itemDiv.innerHTML = `
        <div class="item-icon">${this.#getCosmeticIcon(cosmetic.category)}</div>
        <div class="item-name">${cosmetic.name}</div>
        <div class="item-description">${cosmetic.description}</div>
        <div class="item-price">${this.#formatPrice(cosmetic.price)}</div>
        <button class="btn-buy" ${cosmetic.premiumOnly ? 'data-premium="true"' : ''}>
          ${cosmetic.premiumOnly ? 'Premium Only' : 'Buy'}
        </button>
      `;
      
      const buyBtn = itemDiv.querySelector('.btn-buy');
      buyBtn.onclick = () => this.#purchaseCosmetic(cosmetic.id);
      
      cosmeticsGrid.appendChild(itemDiv);
    });
  }

  #getCosmeticIcon(category) {
    const icons = {
      'trainer_outfit': '👕',
      'animal_accessory': '👑',
      'habitat_theme': '🎨',
      'battle_effect': '⚡',
      'ui_theme': '🖼️'
    };
    return icons[category] || '🎁';
  }

  #formatPrice(price) {
    const parts = [];
    if (price.pawCoins > 0) parts.push(`🪙 ${price.pawCoins}`);
    if (price.researchPoints > 0) parts.push(`🔬 ${price.researchPoints}`);
    if (price.battleTokens > 0) parts.push(`⚔️ ${price.battleTokens}`);
    return parts.join(' ');
  }

  #showDailyReward(reward) {
    if (!this.dailyRewardOverlay) return;
    
    // Update reward display
    const rewardDay = document.querySelector('#rewardDay');
    const rewardPawCoins = document.querySelector('#rewardPawCoins');
    const rewardResearchPoints = document.querySelector('#rewardResearchPoints');
    const rewardBattleTokens = document.querySelector('#rewardBattleTokens');
    const rewardItemsList = document.querySelector('#rewardItemsList');
    
    if (rewardDay) rewardDay.textContent = reward.day.toString();
    if (rewardPawCoins) rewardPawCoins.textContent = reward.currency.pawCoins.toString();
    if (rewardResearchPoints) rewardResearchPoints.textContent = reward.currency.researchPoints.toString();
    if (rewardBattleTokens) rewardBattleTokens.textContent = reward.currency.battleTokens.toString();
    
    if (rewardItemsList && reward.items && reward.items.length > 0) {
      rewardItemsList.innerHTML = reward.items.map(item => 
        `<div class="bonus-item">${item.name} x${item.quantity}</div>`
      ).join('');
    }
    
    this.dailyRewardOverlay.classList.remove('hidden');
  }

  #claimDailyReward() {
    if (this.dailyRewardOverlay) {
      this.dailyRewardOverlay.classList.add('hidden');
      this.#toast('Daily reward claimed!');
    }
  }

  #toast(message, type = 'success') {
    if (!this.toast) return;
    
    this.toast.textContent = message;
    this.toast.className = `toast ${type}`;
    this.toast.classList.remove('hidden');
    
    setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 3000);
  }
}  // Educati
onal Partnership Methods
  #showEducationOverlay() {
    if (this.educationOverlay) {
      this.educationOverlay.classList.remove('hidden');
      // Load initial data
      postWebViewMessage({ type: 'getEducationalPartners' });
      postWebViewMessage({ type: 'getSponsoredContent' });
      postWebViewMessage({ type: 'getConservationImpact' });
      postWebViewMessage({ type: 'getExpertAMAs' });
      postWebViewMessage({ type: 'getCitizenScienceProjects' });
      postWebViewMessage({ type: 'getTrainerContributions' });
    }
  }

  #hideEducationOverlay() {
    if (this.educationOverlay) {
      this.educationOverlay.classList.add('hidden');
    }
  }

  #switchEducationTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.education-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.education-tabs .tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.querySelector(`#education-${tabName}`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // Add active class to selected button
    const selectedBtn = document.querySelector(`.education-tabs .tab-btn[data-tab="${tabName}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
  }

  #renderEducationalPartners(organizations) {
    const partnersGrid = document.querySelector('#partners-grid');
    if (!partnersGrid) return;

    partnersGrid.innerHTML = '';
    
    organizations.forEach(org => {
      const partnerCard = document.createElement('div');
      partnerCard.className = 'partner-card';
      partnerCard.innerHTML = `
        <div class="partner-header">
          <div class="partner-logo">🌍</div>
          <div>
            <div class="partner-name">${org.name}</div>
            <div class="partner-level ${org.partnershipLevel}">${org.partnershipLevel}</div>
          </div>
        </div>
        <div class="partner-description">${org.description}</div>
        <div class="partner-focus-areas">
          ${org.focusAreas.map(area => `<span class="focus-area-tag">${area.replace('_', ' ')}</span>`).join('')}
        </div>
      `;
      
      partnerCard.addEventListener('click', () => {
        window.open(org.website, '_blank');
      });
      
      partnersGrid.appendChild(partnerCard);
    });
  }

  #renderSponsoredContent(content) {
    const contentList = document.querySelector('#sponsored-content-list');
    if (!contentList) return;

    contentList.innerHTML = '';
    
    content.forEach(item => {
      const contentItem = document.createElement('div');
      contentItem.className = 'content-item';
      contentItem.innerHTML = `
        <div class="content-header">
          <div>
            <div class="content-title">${item.title}</div>
            <div class="content-type ${item.contentType}">${item.contentType.replace('_', ' ')}</div>
          </div>
        </div>
        <div class="content-description">${item.description}</div>
        <div class="content-rewards">
          ${item.rewards.map(reward => `<span class="reward-badge">${reward.description}</span>`).join('')}
        </div>
      `;
      
      contentItem.addEventListener('click', () => {
        this.#showContentDetail(item);
      });
      
      contentList.appendChild(contentItem);
    });
  }

  #showContentDetail(content) {
    const overlay = this.contentDetailOverlay;
    const title = document.querySelector('#content-detail-title');
    const body = document.querySelector('#content-detail-body');
    
    if (!overlay || !title || !body) return;

    title.textContent = content.title;
    body.innerHTML = `
      <div class="content-detail-info">
        <h3>Description</h3>
        <p>${content.description}</p>
        
        <h3>Educational Material</h3>
        <div class="educational-facts">
          <h4>Key Facts:</h4>
          <ul>
            ${content.educationalMaterial.facts.map(fact => `<li>${fact}</li>`).join('')}
          </ul>
        </div>
        
        <h3>Rewards</h3>
        <div class="content-rewards">
          ${content.rewards.map(reward => `<div class="reward-item">${reward.description}: ${reward.value}</div>`).join('')}
        </div>
      </div>
    `;
    
    // Set up completion button
    const completeBtn = document.querySelector('#btn-complete-content');
    if (completeBtn) {
      completeBtn.onclick = () => {
        postWebViewMessage({ 
          type: 'completeSponsoredContent', 
          data: { 
            contentId: content.id,
            completionData: { qualityScore: 0.9 } // Simulate high quality completion
          }
        });
        this.#hideContentDetailOverlay();
      };
      completeBtn.classList.remove('hidden');
    }
    
    overlay.classList.remove('hidden');
  }

  #hideContentDetailOverlay() {
    if (this.contentDetailOverlay) {
      this.contentDetailOverlay.classList.add('hidden');
    }
  }

  #renderConservationImpact(personalImpact, globalImpact) {
    const personalContainer = document.querySelector('#personal-impact');
    const globalContainer = document.querySelector('#global-impact');
    
    if (personalContainer) {
      personalContainer.innerHTML = '';
      personalImpact.forEach(impact => {
        const statDiv = document.createElement('div');
        statDiv.className = 'impact-stat';
        statDiv.innerHTML = `
          <div class="impact-stat-value">${impact.impactScore}</div>
          <div class="impact-stat-label">Impact Score</div>
        `;
        personalContainer.appendChild(statDiv);
      });
    }
    
    if (globalContainer) {
      globalContainer.innerHTML = `
        <div class="impact-stat">
          <div class="impact-stat-value">$${globalImpact.totalDonations.toFixed(2)}</div>
          <div class="impact-stat-label">Total Donations</div>
        </div>
        <div class="impact-stat">
          <div class="impact-stat-value">${globalImpact.totalActivities}</div>
          <div class="impact-stat-label">Activities Completed</div>
        </div>
        <div class="impact-stat">
          <div class="impact-stat-value">${globalImpact.totalResearchContributions}</div>
          <div class="impact-stat-label">Research Contributions</div>
        </div>
        <div class="impact-stat">
          <div class="impact-stat-value">${globalImpact.totalImpactScore}</div>
          <div class="impact-stat-label">Global Impact Score</div>
        </div>
      `;
    }
  }

  #renderExpertAMAs(amas) {
    const amasList = document.querySelector('#amas-list');
    if (!amasList) return;

    amasList.innerHTML = '';
    
    amas.forEach(ama => {
      const amaItem = document.createElement('div');
      amaItem.className = 'ama-item';
      amaItem.innerHTML = `
        <div class="ama-expert">${ama.expertName}</div>
        <div class="ama-title">${ama.expertTitle}</div>
        <div class="ama-topic">${ama.topic}</div>
        <div class="ama-description">${ama.description}</div>
        <div class="ama-details">
          <span>📅 ${new Date(ama.scheduledDate).toLocaleDateString()}</span>
          <span>👥 ${ama.currentParticipants}/${ama.maxParticipants}</span>
          <span>⏱️ ${Math.floor(ama.duration / 60)} min</span>
        </div>
        <div class="ama-actions">
          <button class="btn btn-primary ask-question-btn" data-ama-id="${ama.id}">Ask Question</button>
        </div>
      `;
      
      const askBtn = amaItem.querySelector('.ask-question-btn');
      askBtn.addEventListener('click', () => {
        this.currentAmaId = ama.id;
        this.#showAmaQuestionOverlay();
      });
      
      amasList.appendChild(amaItem);
    });
  }

  #showAmaQuestionOverlay() {
    if (this.amaQuestionOverlay) {
      this.amaQuestionOverlay.classList.remove('hidden');
      // Clear previous question
      const textarea = document.querySelector('#ama-question-text');
      if (textarea) textarea.value = '';
    }
  }

  #hideAmaQuestionOverlay() {
    if (this.amaQuestionOverlay) {
      this.amaQuestionOverlay.classList.add('hidden');
    }
  }

  #submitAmaQuestion() {
    const textarea = document.querySelector('#ama-question-text');
    if (!textarea || !this.currentAmaId) return;

    const question = textarea.value.trim();
    if (!question) {
      this.#toast('Please enter a question', 'error');
      return;
    }

    postWebViewMessage({
      type: 'submitAMAQuestion',
      data: {
        amaId: this.currentAmaId,
        question: question
      }
    });
  }

  #renderCitizenScienceProjects(projects) {
    const projectsList = document.querySelector('#citizen-science-projects');
    if (!projectsList) return;

    projectsList.innerHTML = '';
    
    projects.forEach(project => {
      const projectItem = document.createElement('div');
      projectItem.className = 'project-item';
      projectItem.innerHTML = `
        <div class="project-title">${project.title}</div>
        <div class="project-description">${project.description}</div>
        <div class="project-objectives">
          <h4>Objectives:</h4>
          <ul>
            ${project.objectives.map(obj => `<li>${obj}</li>`).join('')}
          </ul>
        </div>
        <div class="project-stats">
          <span>👥 ${project.participantCount} participants</span>
          <span>📊 ${project.dataPointsCollected} data points</span>
        </div>
        <div class="project-actions">
          <button class="btn btn-primary contribute-btn" data-project-id="${project.id}">Contribute Data</button>
        </div>
      `;
      
      const contributeBtn = projectItem.querySelector('.contribute-btn');
      contributeBtn.addEventListener('click', () => {
        this.currentProjectId = project.id;
        this.#showDataContributionOverlay();
      });
      
      projectsList.appendChild(projectItem);
    });
  }

  #showDataContributionOverlay() {
    if (this.dataContributionOverlay) {
      this.dataContributionOverlay.classList.remove('hidden');
      // Clear previous data
      document.querySelector('#data-location').value = '';
      document.querySelector('#data-details').value = '';
    }
  }

  #hideDataContributionOverlay() {
    if (this.dataContributionOverlay) {
      this.dataContributionOverlay.classList.add('hidden');
    }
  }

  #submitDataContribution() {
    if (!this.currentProjectId) return;

    const dataType = document.querySelector('#data-type').value;
    const location = document.querySelector('#data-location').value;
    const details = document.querySelector('#data-details').value.trim();

    if (!details) {
      this.#toast('Please provide details about your observation', 'error');
      return;
    }

    postWebViewMessage({
      type: 'submitDataContribution',
      data: {
        projectId: this.currentProjectId,
        dataType: dataType,
        data: { details: details },
        location: location || undefined
      }
    });
  }

  #renderTrainerContributions(contributions) {
    const contributionsList = document.querySelector('#trainer-contributions');
    if (!contributionsList) return;

    contributionsList.innerHTML = '';
    
    if (contributions.length === 0) {
      contributionsList.innerHTML = '<p>No contributions yet. Start contributing to citizen science projects!</p>';
      return;
    }
    
    contributions.forEach(contribution => {
      const contributionItem = document.createElement('div');
      contributionItem.className = 'contribution-item';
      contributionItem.innerHTML = `
        <div class="contribution-header">
          <div class="contribution-type">${contribution.dataType.replace('_', ' ')}</div>
          <div class="contribution-date">${new Date(contribution.timestamp).toLocaleDateString()}</div>
        </div>
        <div class="contribution-details">${contribution.data.details || 'Data contribution'}</div>
        ${contribution.location ? `<div class="contribution-location">📍 ${contribution.location}</div>` : ''}
      `;
      
      contributionsList.appendChild(contributionItem);
    });
  }

  #showContentRewards(rewards) {
    // Simple reward display - could be enhanced with a modal
    const rewardText = rewards.map(r => r.description).join(', ');
    this.#toast(`Rewards earned: ${rewardText}`, 'success');
  }
}