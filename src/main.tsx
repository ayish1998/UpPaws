import './createPost.js';

import { Devvit, useState, useWebView } from '@devvit/public-api';

import type { DevvitMessage, WebViewMessage } from './message.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Daily Animal Puzzle bank (emoji hint + answer + fun fact)
const animals = [
  { answer: 'HIPPOPOTAMUS', emoji: '🦛', fact: 'A hippo’s bite can exceed 1,800 PSI — among land’s strongest.' },
  { answer: 'FALCON', emoji: '🦅', fact: 'Peregrine falcons dive over 200 mph, fastest in the animal kingdom.' },
  { answer: 'GIRAFFE', emoji: '🦒', fact: 'Giraffes sleep less than 2 hours a day, often in short naps.' },
  { answer: 'OCTOPUS', emoji: '🐙', fact: 'Octopuses have three hearts and blue copper-based blood.' },
  { answer: 'PANDA', emoji: '🐼', fact: 'Giant pandas spend 10–16 hours a day eating bamboo.' },
  { answer: 'TIGER', emoji: '🐯', fact: 'A tiger’s stripes are unique like human fingerprints.' },
  { answer: 'CROCODILE', emoji: '🐊', fact: 'Crocodiles can go through 4,000 teeth in a lifetime.' },
];

// Daily challenge helpers
function getDateKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDailyPuzzle() {
  const key = getDateKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const index = hash % animals.length;
  const base = animals[index];
  const letters = shuffle(base.answer.split(''));
  return {
    emoji: base.emoji,
    hint: 'Guess the animal from the emoji and letters.',
    answerLength: base.answer.length,
    letters,
    fact: base.fact,
    answer: base.answer,
  };
}

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'AnimalQuest Puzzle',
  height: 'tall',
  render: (context) => {
    // Load username with useAsync hook
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? 'anon';
    });

    // Load user score from redis
    const [score] = useState(async () => {
      if (!username) return 0;
      const userScore = await context.redis.get(`user_score_${username}`);
      return Number(userScore ?? 0);
    });

    // Load user streak from redis
    const [streak] = useState(async () => {
      if (!username) return 0;
      const s = await context.redis.get(`user_streak_${username}`);
      return Number(s ?? 0);
    });

    // Get current puzzle for this post (daily)
    const [puzzle] = useState(async () => {
      const existing = await context.redis.get(`puzzle_${context.postId}`);
      if (existing) return JSON.parse(existing);
      const p = getDailyPuzzle();
      await context.redis.set(`puzzle_${context.postId}`, JSON.stringify(p));
      return p;
    });

    // Function to update score
    async function updateScore(newScore: number) {
      if (username) {
        await context.redis.set(`user_score_${username}`, newScore.toString());
        
        // Update leaderboard
        const leaderboardData = await context.redis.get('leaderboard');
        let leaderboard = [];
        if (leaderboardData) {
          leaderboard = JSON.parse(leaderboardData);
        }
        
        const userIndex = leaderboard.findIndex((entry: any) => entry.username === username);
        if (userIndex >= 0) {
          leaderboard[userIndex].score = newScore;
        } else {
          leaderboard.push({ username, score: newScore });
        }
        
        // Sort by score (descending)
        leaderboard.sort((a: any, b: any) => b.score - a.score);
        
        // Save updated leaderboard
        await context.redis.set('leaderboard', JSON.stringify(leaderboard));
      }
    }

    async function updateStreakOnFirstDailyCorrect(): Promise<number | null> {
      if (!username) return null;
      const dateKey = getDateKey();
      const awardedKey = `user_scored_${username}_${dateKey}`;
      const alreadyAwarded = await context.redis.get(awardedKey);
      if (alreadyAwarded) return null;

      const lastPlayed = (await context.redis.get(`user_last_play_${username}`)) ?? '';
      const currentStreakRaw = await context.redis.get(`user_streak_${username}`);
      let currentStreak = Number(currentStreakRaw ?? 0);
      const today = getDateKey();
      const y = new Date();
      y.setUTCDate(y.getUTCDate() - 1);
      const yKey = `${y.getUTCFullYear()}-${String(y.getUTCMonth() + 1).padStart(2, '0')}-${String(y.getUTCDate()).padStart(2, '0')}`;
      if (lastPlayed === yKey) currentStreak += 1;
      else if (lastPlayed !== today) currentStreak = 1;
      await context.redis.set(`user_streak_${username}`, String(currentStreak));
      await context.redis.set(`user_last_play_${username}`, today);
      return currentStreak;
    }

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      // URL of your web view content
      url: 'page.html',

      // Handle messages sent from the web view
      async onMessage(message, webView) {
        // Check if message is valid and has a type
        if (!message || typeof message !== 'object') {
          console.error('Invalid message received', message);
          return;
        }

        // Get and validate message type
        const messageType = message.type;
        if (!messageType || typeof messageType !== 'string') {
          console.error('Message missing valid type property', message);
          return;
        }

        try {
          switch (messageType) {
            case 'webViewReady':
              // Send initial data to the web view
              const leaderboardData = await context.redis.get('leaderboard');
              const leaderboard = leaderboardData ? JSON.parse(leaderboardData) : [];
              // Arcade best
              const arcadeBestRaw = username ? await context.redis.get(`arcade_best_${username}`) : null;
              const arcadeBest = arcadeBestRaw ? Number(arcadeBestRaw) : 0;
              // Arcade leaderboard
              const arcadeLeaderboardData = await context.redis.get('arcade_leaderboard');
              const arcadeLeaderboard = arcadeLeaderboardData ? JSON.parse(arcadeLeaderboardData) : [];
              // Streak leaderboard
              const streakLeaderboardData = await context.redis.get('streak_leaderboard');
              const streakLeaderboard = streakLeaderboardData ? JSON.parse(streakLeaderboardData) : [];
              webView.postMessage({
                type: 'initialData',
                data: {
                  username: username,
                  puzzle: {
                    emoji: puzzle.emoji,
                    hint: puzzle.hint,
                    answerLength: puzzle.answerLength,
                    letters: puzzle.letters,
                    fact: puzzle.fact,
                    answer: puzzle.answer,
                  },
                  userScore: score,
                  userStreak: streak,
                  leaderboard,
                  arcadeBest,
                  arcadeLeaderboard,
                  streakLeaderboard
                },
              });
              break;
            case 'getArcadePuzzle': {
              // For arcade: generate a fresh puzzle (not tied to date) and optionally scale difficulty
              // Basic scaling: longer answers at higher difficulty
              const pool = animals.slice().sort((a, b) => a.answer.length - b.answer.length);
              const difficulty = Math.max(1, Math.min(5, Number(message.data?.difficulty ?? 1)));
              const minLen = Math.min(12, 3 + difficulty * 2);
              const candidates = pool.filter(a => a.answer.length >= minLen);
              const base = (candidates.length ? candidates : pool)[Math.floor(Math.random() * (candidates.length ? candidates.length : pool.length))];
              const letters = base.answer.split('').sort(() => Math.random() - 0.5);
              webView.postMessage({
                type: 'nextArcadePuzzle',
                data: { puzzle: { emoji: base.emoji, hint: 'Arcade: beat the clock!', answerLength: base.answer.length, letters, fact: base.fact, answer: base.answer } }
              });
              break;
            }
            case 'arcadeGameOver': {
              const finalScore = Number(message.data?.finalScore ?? 0);
              if (username) {
                const bestRaw = await context.redis.get(`arcade_best_${username}`);
                const best = bestRaw ? Number(bestRaw) : 0;
                if (finalScore > best) {
                  await context.redis.set(`arcade_best_${username}`, String(finalScore));
                  webView.postMessage({ type: 'updateArcadeBest', data: { best: finalScore } });
                  
                  // Update arcade leaderboard
                  const arcadeLeaderboardData = await context.redis.get('arcade_leaderboard');
                  let arcadeLeaderboard = arcadeLeaderboardData ? JSON.parse(arcadeLeaderboardData) : [];
                  const userIndex = arcadeLeaderboard.findIndex((entry: any) => entry.username === username);
                  if (userIndex >= 0) {
                    arcadeLeaderboard[userIndex].best = finalScore;
                  } else {
                    arcadeLeaderboard.push({ username, best: finalScore });
                  }
                  arcadeLeaderboard.sort((a: any, b: any) => b.best - a.best);
                  await context.redis.set('arcade_leaderboard', JSON.stringify(arcadeLeaderboard));
                }
              }
              break;
            }
            case 'getLeaderboard': {
              // Send fresh leaderboard data
              const dailyData = await context.redis.get('leaderboard');
              const daily = dailyData ? JSON.parse(dailyData) : [];
              const arcadeData = await context.redis.get('arcade_leaderboard');
              const arcade = arcadeData ? JSON.parse(arcadeData) : [];
              const streakData = await context.redis.get('streak_leaderboard');
              const streaks = streakData ? JSON.parse(streakData) : [];
              webView.postMessage({
                type: 'leaderboardData',
                data: { daily, arcade, streaks }
              });
              break;
            }
            case 'submitGuess':
              if (!message.data || typeof message.data.guess !== 'string') {
                console.error('submitGuess missing guess', message);
                return;
              }
              {
                const userGuess = (message.data.guess || '').toUpperCase().trim();
                const secondsTaken = Number(message.data.secondsTaken ?? 0);
                const usedHint = Boolean(message.data.usedHint);
                const todayPuzzleRaw = await context.redis.get(`puzzle_${context.postId}`);
                const todayPuzzle = todayPuzzleRaw ? JSON.parse(todayPuzzleRaw) : getDailyPuzzle();
                const isCorrect = userGuess === todayPuzzle.answer;

                let fact = todayPuzzle.fact;
                // scoring: base 5 for first correct of the day, + time bonus up to +5, -2 if used hint
                if (isCorrect && username) {
                  const dateKey = getDateKey();
                  const awardedKey = `user_scored_${username}_${dateKey}`;
                  const alreadyAwarded = await context.redis.get(awardedKey);
                  if (!alreadyAwarded) {
                    const timeBonus = Math.max(0, Math.min(5, Math.ceil((15 - Math.min(15, secondsTaken)) / 3)));
                    const hintPenalty = usedHint ? 2 : 0;
                    const gained = Math.max(1, 5 + timeBonus - hintPenalty);
                    const newScore = score + gained;
                    await updateScore(newScore);
                    await context.redis.set(awardedKey, '1');
                    const newStreak = await updateStreakOnFirstDailyCorrect();
                    webView.postMessage({ type: 'updateScore', data: { newScore } });
                    if (newStreak !== null) {
                      webView.postMessage({ type: 'updateStreak', data: { newStreak } });
                      
                      // Update streak leaderboard
                      const streakLeaderboardData = await context.redis.get('streak_leaderboard');
                      let streakLeaderboard = streakLeaderboardData ? JSON.parse(streakLeaderboardData) : [];
                      const userIndex = streakLeaderboard.findIndex((entry: any) => entry.username === username);
                      if (userIndex >= 0) {
                        streakLeaderboard[userIndex].streak = newStreak;
                      } else {
                        streakLeaderboard.push({ username, streak: newStreak });
                      }
                      streakLeaderboard.sort((a: any, b: any) => b.streak - a.streak);
                      await context.redis.set('streak_leaderboard', JSON.stringify(streakLeaderboard));
                    }
                    fact = `${fact} You earned ${gained} pts${usedHint ? ' (hint -2)' : ''}${timeBonus ? ` (+${timeBonus} time bonus)` : ''}.`;
                  } else {
                    fact = `${fact} You've already earned today's points. Come back tomorrow!`;
                  }
                }

                webView.postMessage({
                  type: 'guessResult',
                  data: { isCorrect, fact, answer: todayPuzzle.answer },
                });
              }
              break;
            case 'close':
              // Close the web view when explicitly requested
              webView.unmount();
              break;
            default:
              console.error(`Unknown message type: ${messageType}`, message);
          }
        } catch (error) {
          console.error('Error processing message:', error, message);
        }
      },
      onUnmount() {
        context.ui.showToast('Web view closed!');
      },
    });

    // Render the custom post type
    return (
      <vstack grow padding="none">
        <vstack grow padding="large" gap="large" alignment="top center">
          {/* Hero Header */}
          <vstack alignment="middle center" padding="medium" gap="small">
            <text size="xlarge" weight="bold" color="#FF6B35">{puzzle ? `${puzzle.emoji} AnimalQuest` : 'AnimalQuest'}</text>
            <text size="medium" color="#4A5568">Guess the animal from emoji + letters</text>
          </vstack>
          
          {/* Stats Row */}
          <hstack gap="small" alignment="center middle">
            <hstack borderRadius="full" padding="small" backgroundColor="#FF6B35" gap="xsmall" alignment="center middle">
              <image url="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png" size="xsmall" />
              <text size="small" weight="bold" color="white">u/{username ?? 'anonymous'}</text>
            </hstack>
            <hstack borderRadius="full" padding="small" backgroundColor="#FFD700" gap="xsmall" alignment="center middle">
              <text size="small" weight="bold" color="#1A202C">⭐ {score ?? '0'}</text>
            </hstack>
            <hstack borderRadius="full" padding="small" backgroundColor="#FF4444" gap="xsmall" alignment="center middle">
              <text size="small" weight="bold" color="white">🔥 {streak ?? '0'}</text>
            </hstack>
          </hstack>
          
          {/* Game Card */}
          <vstack borderRadius="large" padding="large" gap="large" backgroundColor="#F7FAFC" width="full">
            <vstack alignment="middle center" gap="medium">
              <text weight="bold" size="xlarge" color="#2D3748">{puzzle ? `${puzzle.emoji} Daily Animal` : 'Loading Puzzle...'}</text>
              <text size="medium" alignment="center" color="#4A5568">{puzzle ? 'Tap Play to start the daily puzzle.' : 'Please wait while we load your animal puzzle.'}</text>
            </vstack>
            <vstack alignment="middle center">
              <button appearance="primary" size="large" onPress={() => webView.mount()}>
                🎮 Play Puzzle
              </button>
            </vstack>
          </vstack>
          
          {/* Footer */}
          <text size="xsmall" alignment="center" color="#718096">Built for Reddit — UpPaws</text>
        </vstack>
      </vstack>
    );
  },
});
export default Devvit;