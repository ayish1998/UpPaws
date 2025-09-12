/** Message from Devvit to the web view. */
export type DevvitMessage =
  | {
      type: 'initialData';
      data: {
        username: string;
        puzzle: {
          emoji: string;
          hint: string;
          answerLength: number;
          letters: string[];
          fact: string;
          answer: string;
        };
        userScore: number;
        userStreak?: number;
        leaderboard?: Array<{ username: string; score: number }>;
        arcadeBest?: number;
        arcadeLeaderboard?: Array<{ username: string; best: number }>;
        streakLeaderboard?: Array<{ username: string; streak: number }>;
      };
    }
  | { type: 'updateScore'; data: { newScore: number } }
  | { type: 'updateStreak'; data: { newStreak: number } }
  | {
      type: 'guessResult';
      data: { isCorrect: boolean; fact: string; answer: string };
    }
  | {
      type: 'nextArcadePuzzle';
      data: {
        puzzle: {
          emoji: string;
          hint: string;
          answerLength: number;
          letters: string[];
          fact: string;
          answer: string;
        };
      };
    }
  | { type: 'updateArcadeBest'; data: { best: number } }
  | {
      type: 'leaderboardData';
      data: {
        daily: Array<{ username: string; score: number }>;
        arcade: Array<{ username: string; best: number }>;
        streaks: Array<{ username: string; streak: number }>;
      };
    };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'submitGuess'; data: { guess: string; secondsTaken: number; usedHint: boolean } }
  | { type: 'close' }
  | { type: 'getArcadePuzzle'; data?: { difficulty?: number } }
  | { type: 'arcadeGameOver'; data: { finalScore: number } }
  | { type: 'getLeaderboard' };

/**
 * Web view MessageEvent listener data type. The Devvit API wraps all messages
 * from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};