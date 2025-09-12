/** Message from Devvit to the web view. */
export type DevvitMessage =
  | {
      type: 'initialData';
      data: {
        username: string;
        challenge: {
          title: string;
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        };
        userScore: number;
        userStreak?: number;
        leaderboard?: Array<{ username: string; score: number }>;
      };
    }
  | { type: 'updateScore'; data: { newScore: number } }
  | { type: 'updateStreak'; data: { newStreak: number } }
  | {
      type: 'answerResult';
      data: { isCorrect: boolean; explanation: string; correctIndex: number };
    }
  | {
      type: 'nextChallenge';
      data: {
        challenge: {
          title: string;
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        };
      };
    };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'submitAnswer'; data: { selectedIndex: number } }
  | { type: 'getNextChallenge' }
  | { type: 'close' };

/**
 * Web view MessageEvent listener data type. The Devvit API wraps all messages
 * from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};