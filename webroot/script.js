/** @typedef {import('./message.js').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('./message.js').WebViewMessage} WebViewMessage */

class AnimalQuestApp {
  constructor() {
    // Get references to HTML elements
    this.usernameLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#username'));
    this.userScoreLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#userScore'));
    this.challengeTitle = /** @type {HTMLHeadingElement} */ (document.querySelector('#challengeTitle'));
    this.challengeScenario = /** @type {HTMLParagraphElement} */ (document.querySelector('#challengeScenario'));
    
    this.answerSection = /** @type {HTMLDivElement} */ (document.querySelector('#answer-section'));
    this.resultSection = /** @type {HTMLDivElement} */ (document.querySelector('#result-section'));
    this.resultMessage = /** @type {HTMLDivElement} */ (document.querySelector('#result-message'));
    this.explanation = /** @type {HTMLParagraphElement} */ (document.querySelector('#explanation'));
    
    this.optionsContainer = /** @type {HTMLDivElement} */ (document.querySelector('#options'));
    this.nextButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-next'));
    
    // Initialize data
    this.username = 'User';
    this.userScore = 0;
    this.challenge = null;
    this.lastAnswerCorrect = false;
    
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
        } else {
          // Close the webview if it wasn't a correct answer
          console.log('Closing WebView');
          postWebViewMessage({ type: 'close' });
        }
      } catch (e) {
        console.error('Failed to process next button click:', e);
      }
    });
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
          const { username, challenge, userScore } = message.data;
          this.username = username;
          this.userScore = userScore;
          this.challenge = challenge;
          
          // Update UI
          this.usernameLabel.innerText = username;
          this.userScoreLabel.innerText = userScore.toString();
          this.challengeTitle.innerText = challenge.title;
          this.challengeScenario.innerText = challenge.question;
          this.#renderOptions(challenge.options);
          break;
        }
        case 'updateScore': {
          const { newScore } = message.data;
          this.userScore = newScore;
          this.userScoreLabel.innerText = newScore.toString();
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
          } else {
            const letters = ['A', 'B', 'C', 'D'];
            this.resultMessage.innerHTML = `❌ <span class="incorrect">Not quite.</span> The correct answer was "${letters[correctIndex]}".`;
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