/** @typedef {import('./message.js').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('./message.js').WebViewMessage} WebViewMessage */

class CyberQuestApp {
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
    
    this.reportButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-report'));
    this.blockButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-block'));
    this.deleteButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-delete'));
    this.ignoreButton = /** @type {HTMLButtonElement} */ (document.querySelector('#btn-ignore'));
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
    
    this.reportButton.addEventListener('click', () => this.#handleAnswer('report'));
    this.blockButton.addEventListener('click', () => this.#handleAnswer('block'));
    this.deleteButton.addEventListener('click', () => this.#handleAnswer('delete'));
    this.ignoreButton.addEventListener('click', () => this.#handleAnswer('ignore'));
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
  #handleAnswer(answer) {
    console.log('Submitting answer:', answer);
    // Send answer to Devvit
    postWebViewMessage({ 
      type: 'submitAnswer', 
      data: { answer } 
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
          this.challengeScenario.innerText = challenge.scenario;
          break;
        }
        case 'updateScore': {
          const { newScore } = message.data;
          this.userScore = newScore;
          this.userScoreLabel.innerText = newScore.toString();
          break;
        }
        case 'answerResult': {
          const { isCorrect, explanation, correctAnswer } = message.data;
          
          // Show result section and hide answer section
          this.answerSection.classList.add('hidden');
          this.resultSection.classList.remove('hidden');
          
          // Store if the answer was correct
          this.lastAnswerCorrect = isCorrect;
          
          if (isCorrect) {
            this.resultMessage.innerHTML = '✅ <span class="correct">Correct!</span>';
            // Change the button text for next challenge option
            this.nextButton.innerText = "Next Challenge";
          } else {
            this.resultMessage.innerHTML = `❌ <span class="incorrect">Not quite.</span> The correct answer was "${this.#getActionDisplay(correctAnswer)}".`;
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
          this.challengeScenario.innerText = challenge.scenario;
          
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
   * Get display name for action
   * @param {string} action
   * @returns {string}
   */
  #getActionDisplay(action) {
    switch (action) {
      case 'report': return 'Report';
      case 'block': return 'Block';
      case 'delete': return 'Delete';
      case 'ignore': return 'Ignore';
      default: return action;
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
new CyberQuestApp();