/** Message from Devvit to the web view. */
export type DevvitMessage =
  | { 
      type: 'initialData'; 
      data: { 
        username: string; 
        challenge: { 
          title: string;
          scenario: string;
          correctAnswer: string;
          explanation: string;
        };
        userScore: number;
      } 
    }
  | { type: 'updateScore'; data: { newScore: number } }
  | { type: 'answerResult'; data: { isCorrect: boolean; explanation: string; correctAnswer: string } }
  | { 
      type: 'nextChallenge'; 
      data: { 
        challenge: {
          title: string;
          scenario: string;
          correctAnswer: string;
          explanation: string;
        }
      } 
    };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'submitAnswer'; data: { answer: string } }
  | { type: 'getNextChallenge' };

/**
 * Web view MessageEvent listener data type. The Devvit API wraps all messages
 * from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};