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
          const { username, puzzle, userScore, userStreak, leaderboard } = message.data;
          this.username = username;
          this.userScore = userScore;
          this.puzzle = puzzle;
          
          // Update UI
          this.usernameLabel.innerText = username;
          this.userScoreLabel.innerText = userScore.toString();
          this.challengeTitle.innerText = 'Daily Animal Puzzle';
          this.challengeScenario.innerText = 'Arrange the letters to name the animal.';
          this.emoji.textContent = puzzle.emoji;
          this.hintLabel.textContent = 'Guess the animal';
          this.#buildBoard(puzzle.letters, puzzle.answerLength);
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
    // Ensure puzzle is ready before starting
    if (!this.puzzle || !this.puzzle.letters) {
      this.#toast('Loading puzzle...');
      // try again shortly
      setTimeout(() => this.#begin(), 400);
      return;
    }
    if (this.startOverlay) this.startOverlay.classList.remove('visible');
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