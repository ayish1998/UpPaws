/** @typedef {import('./message.js').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('./message.js').WebViewMessage} WebViewMessage */

class AnimalQuestApp {
  constructor() {
    // Get references to HTML elements
    this.usernameLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#username'));
    this.userScoreLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#userScore'));
    this.userStreakWrap = /** @type {HTMLHeadingElement} */ (document.querySelector('#userStreak'));
    this.userStreakVal = /** @type {HTMLSpanElement} */ (document.querySelector('#streakVal'));
    this.leaderboard = /** @type {HTMLDivElement} */ (document.querySelector('#leaderboard'));
    this.challengeTitle = /** @type {HTMLHeadingElement} */ (document.querySelector('#challengeTitle'));
    this.challengeScenario = /** @type {HTMLParagraphElement} */ (document.querySelector('#challengeScenario'));
    
    this.answerSection = /** @type {HTMLDivElement} */ (document.querySelector('#answer-section'));
    this.resultSection = /** @type {HTMLDivElement} */ (document.querySelector('#result-section'));
    this.resultMessage = /** @type {HTMLDivElement} */ (document.querySelector('#result-message'));
    this.explanation = /** @type {HTMLParagraphElement} */ (document.querySelector('#explanation'));
    this.shareRow = /** @type {HTMLDivElement} */ (document.querySelector('#shareRow'));
    this.shareButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-share'));
    this.progress = /** @type {HTMLDivElement} */ (document.querySelector('#progress'));
    this.progressBar = /** @type {HTMLDivElement} */ (document.querySelector('#progressBar'));
    
    this.optionsContainer = /** @type {HTMLDivElement} */ (document.querySelector('#options'));
    this.nextButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-next'));
    this.muteToggle = /** @type {HTMLButtonElement} */ (document.querySelector('#muteToggle'));
    
    // Initialize data
    this.username = 'User';
    this.userScore = 0;
    this.challenge = null;
    this.lastAnswerCorrect = false;
    this.timerId = null;
    this.muted = false;
    
    // Add event listeners
    window.addEventListener('message', this.#onMessage);
    window.addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });
    });

    // Fix the "Next Challenge" / "Back to Reddit" button
    this.nextButton.addEventListener('click', () => {
      try {
        // Check if we had a correct answer - if so, get next challenge
        if (this.lastAnswerCorrect === true) {
          console.log('Requesting next challenge');
          postWebViewMessage({ type: 'getNextChallenge' });
          
          // Reset the UI for the new challenge
          this.answerSection.classList.remove('hidden');
          this.resultSection.classList.add('hidden');
          this.#startTimer();
        } else {
          // Close the webview if it wasn't a correct answer
          console.log('Closing WebView');
          postWebViewMessage({ type: 'close' });
        }
      } catch (e) {
        console.error('Failed to process next button click:', e);
      }
    });

    if (this.muteToggle) {
      this.muteToggle.addEventListener('click', () => {
        this.muted = !this.muted;
        this.muteToggle.textContent = this.muted ? '🔇 Muted' : '🔊 Sound';
      });
    }

    if (this.shareButton) {
      this.shareButton.addEventListener('click', () => this.#shareImage());
    }
  }
  
  /**
   * Handle answer selection
   * @param {string} answer
   */
  #handleAnswer(selectedIndex) {
    console.log('Submitting answer index:', selectedIndex);
    // Send answer to Devvit
    postWebViewMessage({ 
      type: 'submitAnswer', 
      data: { selectedIndex } 
    });
    
    // Update button text based on this being the first answer
    this.nextButton.innerText = "Back to Reddit";
    this.#stopTimer();
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
          // Load initial data
          const { username, challenge, userScore, userStreak, leaderboard } = message.data;
          this.username = username;
          this.userScore = userScore;
          this.challenge = challenge;
          
          // Update UI
          this.usernameLabel.innerText = username;
          this.userScoreLabel.innerText = userScore.toString();
          this.challengeTitle.innerText = challenge.title;
          this.challengeScenario.innerText = challenge.question;
          this.#renderOptions(challenge.options);
          this.#startTimer();
          // Streak
          if (typeof userStreak === 'number') {
            this.userStreakVal.innerText = String(userStreak);
            this.userStreakWrap.classList.remove('hidden');
          }
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
          // could display streak in UI in future
          const { newStreak } = message.data;
          this.userStreakVal.innerText = String(newStreak);
          this.userStreakWrap.classList.remove('hidden');
          // Milestone celebrations
          if (newStreak === 3 || newStreak === 7) {
            this.#milestone(newStreak);
          }
          break;
        }
        case 'answerResult': {
          const { isCorrect, explanation, correctIndex } = message.data;
          
          // Show result section and hide answer section
          this.answerSection.classList.add('hidden');
          this.resultSection.classList.remove('hidden');
          
          // Store if the answer was correct
          this.lastAnswerCorrect = isCorrect;
          
          if (isCorrect) {
            this.resultMessage.innerHTML = '✅ <span class="correct">Correct!</span>';
            // Change the button text for next challenge option
            this.nextButton.innerText = "Next Challenge";
            this.#confetti();
            this.#playSound('correct');
            if (this.shareRow) this.shareRow.classList.remove('hidden');
          } else {
            const letters = ['A', 'B', 'C', 'D'];
            this.resultMessage.innerHTML = `❌ <span class="incorrect">Not quite.</span> The correct answer was "${letters[correctIndex]}".`;
            this.#playSound('incorrect');
            if (this.shareRow) this.shareRow.classList.add('hidden');
          }
          
          this.explanation.innerText = explanation;
          break;
        }
        case 'nextChallenge': {
          // Load the new challenge
          const { challenge } = message.data;
          this.challenge = challenge;
          
          // Update UI with new challenge
          this.challengeTitle.innerText = challenge.title;
          this.challengeScenario.innerText = challenge.question;
          this.#renderOptions(challenge.options);
          
          // Reset this flag for the new challenge
          this.lastAnswerCorrect = false;
          this.#startTimer();
          
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
  
  /**
   * Render multiple choice options A-D
   * @param {string[]} options
   */
  #renderOptions(options) {
    this.optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.textContent = `${letters[idx]}. ${opt}`;
      btn.addEventListener('click', () => this.#handleAnswer(idx));
      this.optionsContainer.appendChild(btn);
    });
  }

  /** Timer / progress bar (15s) */
  #startTimer() {
    this.#stopTimer();
    if (!this.progress || !this.progressBar) return;
    const durationMs = 15000;
    const start = Date.now();
    this.progressBar.style.width = '0%';
    this.progress.classList.remove('hidden');
    this.timerId = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      this.progressBar.style.width = pct + '%';
      if (elapsed >= durationMs) {
        this.#stopTimer();
        // Auto-reveal as incorrect to keep flow moving (no score change)
        this.answerSection.classList.add('hidden');
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
    // basic canvas render share image
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
    ctx.fillText('UpPaws — I got today\'s trivia!', 40, 80);
    // username + score + streak
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Segoe UI, Arial';
    ctx.fillText(`u/${this.username}`, 40, 140);
    ctx.fillText(`Score: ${this.userScore}  |  Streak: ${this.userStreakVal ? this.userStreakVal.textContent : '0'} 🔥`, 40, 176);
    // fun emoji
    const emojis = ['🐯','🦊','🦁','🐼','🦉','🦓','🦒','🐠'];
    ctx.font = '64px Segoe UI Emoji';
    for (let i = 0; i < 6; i++) {
      ctx.fillText(emojis[i % emojis.length], 40 + i * 120, 300);
    }
    // download
    const a = document.createElement('a');
    a.download = 'UpPaws-win.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
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