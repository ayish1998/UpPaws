import "./createPost.js";

import { Devvit, useState, useWebView } from "@devvit/public-api";

import type { DevvitMessage, WebViewMessage } from "./message.js";
import { EconomyIntegrationService } from "./core/economy-integration.js";
import {
  TrainerProfile,
  createDefaultTrainerProfile,
} from "./types/trainer.js";
import { EventType } from "./core/analytics.js";
import { HabitatExplorationService } from "./core/habitat-exploration.js";
import { WorldMapService } from "./core/world-map.js";
import { DailyExpeditionService } from "./core/daily-expeditions.js";
import { WeatherSystem } from "./core/weather-system.js";
import { EducationalPartnershipService } from "./core/educational-partnerships.js";
import { ContentCreationManager } from "./core/content-creation.js";
import { AutoRedditPostGenerator } from "./core/reddit-post-generator.js";
import { CommunityRewardsManager } from "./core/community-rewards.js";
import { TournamentManager } from "./core/tournament-system.js";
import { CompetitiveRankingSystem } from "./core/ranking-system.js";
import { SpectatorManager } from "./core/spectator-system.js";
import { GuildManager } from "./core/guild-system.js";
import { MentorshipManager } from "./core/mentorship-system.js";
import { SupportSystem } from "./core/support-system.js";
import { ModerationSystem } from "./core/moderation-system.js";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Initialize services
const economyService = new EconomyIntegrationService();
const habitatService = HabitatExplorationService.getInstance();
const worldMapService = WorldMapService.getInstance();
const expeditionService = DailyExpeditionService.getInstance();
const weatherSystem = WeatherSystem.getInstance();
const educationalPartnershipService =
  EducationalPartnershipService.getInstance();
const contentCreationService = ContentCreationManager.getInstance();
const redditPostGenerator = AutoRedditPostGenerator.getInstance();
const communityRewardsService = CommunityRewardsManager.getInstance();
const tournamentService = TournamentManager.getInstance();
const rankingService = CompetitiveRankingSystem.getInstance();
const spectatorService = SpectatorManager.getInstance();
const guildService = GuildManager.getInstance();
const mentorshipService = MentorshipManager.getInstance();
const supportSystem = SupportSystem.getInstance();
const moderationSystem = ModerationSystem.getInstance();

// Daily Animal Puzzle bank (emoji hint + answer + fun fact)
const animals = [
  {
    answer: "HIPPOPOTAMUS",
    emoji: "🦛",
    fact: "A hippo’s bite can exceed 1,800 PSI — among land’s strongest.",
  },
  {
    answer: "FALCON",
    emoji: "🦅",
    fact: "Peregrine falcons dive over 200 mph, fastest in the animal kingdom.",
  },
  {
    answer: "GIRAFFE",
    emoji: "🦒",
    fact: "Giraffes sleep less than 2 hours a day, often in short naps.",
  },
  {
    answer: "OCTOPUS",
    emoji: "🐙",
    fact: "Octopuses have three hearts and blue copper-based blood.",
  },
  {
    answer: "PANDA",
    emoji: "🐼",
    fact: "Giant pandas spend 10–16 hours a day eating bamboo.",
  },
  {
    answer: "TIGER",
    emoji: "🐯",
    fact: "A tiger’s stripes are unique like human fingerprints.",
  },
  {
    answer: "CROCODILE",
    emoji: "🐊",
    fact: "Crocodiles can go through 4,000 teeth in a lifetime.",
  },
];

// Daily challenge helpers
function getDateKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
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
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const index = hash % animals.length;
  const base = animals[index];
  const letters = shuffle(base.answer.split(""));
  return {
    emoji: base.emoji,
    hint: "Guess the animal from the emoji and letters.",
    answerLength: base.answer.length,
    letters,
    fact: base.fact,
    answer: base.answer,
  };
}

// Helper functions for battle system
function generateWildAnimal() {
  const wildAnimals = [
    {
      id: "wild_wolf",
      name: "Wild Wolf",
      level: Math.floor(Math.random() * 10) + 5,
      stats: {
        health: 60 + Math.floor(Math.random() * 20),
        maxHealth: 60 + Math.floor(Math.random() * 20),
        attack: 55 + Math.floor(Math.random() * 15),
        defense: 45 + Math.floor(Math.random() * 15),
        speed: 50 + Math.floor(Math.random() * 20),
        intelligence: 40 + Math.floor(Math.random() * 10),
        stamina: 55 + Math.floor(Math.random() * 15),
      },
      moves: [
        { id: "bite", name: "Bite", type: "forest", power: 50, accuracy: 95 },
        { id: "howl", name: "Howl", type: "forest", power: 0, accuracy: 100 },
      ],
    },
    {
      id: "wild_bear",
      name: "Wild Bear",
      level: Math.floor(Math.random() * 8) + 7,
      stats: {
        health: 80 + Math.floor(Math.random() * 25),
        maxHealth: 80 + Math.floor(Math.random() * 25),
        attack: 70 + Math.floor(Math.random() * 20),
        defense: 60 + Math.floor(Math.random() * 20),
        speed: 35 + Math.floor(Math.random() * 15),
        intelligence: 45 + Math.floor(Math.random() * 10),
        stamina: 70 + Math.floor(Math.random() * 20),
      },
      moves: [
        { id: "claw", name: "Claw", type: "forest", power: 60, accuracy: 90 },
        { id: "roar", name: "Roar", type: "forest", power: 0, accuracy: 100 },
      ],
    },
  ];

  return wildAnimals[Math.floor(Math.random() * wildAnimals.length)];
}

function generatePlayerAnimal() {
  return {
    id: "player_wolf",
    name: "Wolf",
    level: 8,
    stats: {
      health: 75,
      maxHealth: 75,
      attack: 65,
      defense: 55,
      speed: 60,
      intelligence: 50,
      stamina: 65,
    },
    moves: [
      { id: "bite", name: "Bite", type: "forest", power: 60, accuracy: 100 },
      { id: "howl", name: "Howl", type: "forest", power: 0, accuracy: 100 },
    ],
  };
}

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: "AnimalQuest Puzzle",
  height: "tall",
  render: (context) => {
    // Load username with useAsync hook
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? "anon";
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
        const leaderboardData = await context.redis.get("leaderboard");
        let leaderboard = [];
        if (leaderboardData) {
          leaderboard = JSON.parse(leaderboardData);
        }

        const userIndex = leaderboard.findIndex(
          (entry: any) => entry.username === username
        );
        if (userIndex >= 0) {
          leaderboard[userIndex].score = newScore;
        } else {
          leaderboard.push({ username, score: newScore });
        }

        // Sort by score (descending)
        leaderboard.sort((a: any, b: any) => b.score - a.score);

        // Save updated leaderboard
        await context.redis.set("leaderboard", JSON.stringify(leaderboard));
      }
    }

    async function updateStreakOnFirstDailyCorrect(): Promise<number | null> {
      if (!username) return null;
      const dateKey = getDateKey();
      const awardedKey = `user_scored_${username}_${dateKey}`;
      const alreadyAwarded = await context.redis.get(awardedKey);
      if (alreadyAwarded) return null;

      const lastPlayed =
        (await context.redis.get(`user_last_play_${username}`)) ?? "";
      const currentStreakRaw = await context.redis.get(
        `user_streak_${username}`
      );
      let currentStreak = Number(currentStreakRaw ?? 0);
      const today = getDateKey();
      const y = new Date();
      y.setUTCDate(y.getUTCDate() - 1);
      const yKey = `${y.getUTCFullYear()}-${String(
        y.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(y.getUTCDate()).padStart(2, "0")}`;
      if (lastPlayed === yKey) currentStreak += 1;
      else if (lastPlayed !== today) currentStreak = 1;
      await context.redis.set(`user_streak_${username}`, String(currentStreak));
      await context.redis.set(`user_last_play_${username}`, today);
      return currentStreak;
    }

    // Helper functions for battle system
    function generateWildAnimal() {
      const wildAnimals = [
        {
          name: "Lion",
          emoji: "🦁",
          type: ["grassland"],
          level: Math.floor(Math.random() * 3) + 4, // Level 4-6
          baseStats: {
            health: 85,
            attack: 75,
            defense: 60,
            speed: 70,
            intelligence: 50,
            stamina: 65,
          },
        },
        {
          name: "Wolf",
          emoji: "🐺",
          type: ["forest"],
          level: Math.floor(Math.random() * 3) + 3, // Level 3-5
          baseStats: {
            health: 70,
            attack: 70,
            defense: 55,
            speed: 80,
            intelligence: 60,
            stamina: 70,
          },
        },
        {
          name: "Bear",
          emoji: "🐻",
          type: ["forest"],
          level: Math.floor(Math.random() * 4) + 5, // Level 5-8
          baseStats: {
            health: 100,
            attack: 80,
            defense: 75,
            speed: 45,
            intelligence: 55,
            stamina: 80,
          },
        },
        {
          name: "Eagle",
          emoji: "🦅",
          type: ["mountain"],
          level: Math.floor(Math.random() * 3) + 4, // Level 4-6
          baseStats: {
            health: 65,
            attack: 65,
            defense: 50,
            speed: 95,
            intelligence: 75,
            stamina: 60,
          },
        },
        {
          name: "Shark",
          emoji: "🦈",
          type: ["ocean"],
          level: Math.floor(Math.random() * 4) + 6, // Level 6-9
          baseStats: {
            health: 90,
            attack: 85,
            defense: 70,
            speed: 75,
            intelligence: 45,
            stamina: 75,
          },
        },
      ];

      const randomAnimal =
        wildAnimals[Math.floor(Math.random() * wildAnimals.length)];
      const level = randomAnimal.level;

      // Calculate stats based on level
      const calculateStat = (base: number, level: number) => {
        return Math.floor(base * (1 + (level - 1) * 0.1));
      };

      const stats = {
        health: calculateStat(randomAnimal.baseStats.health, level),
        maxHealth: calculateStat(randomAnimal.baseStats.health, level),
        attack: calculateStat(randomAnimal.baseStats.attack, level),
        defense: calculateStat(randomAnimal.baseStats.defense, level),
        speed: calculateStat(randomAnimal.baseStats.speed, level),
        intelligence: calculateStat(randomAnimal.baseStats.intelligence, level),
        stamina: calculateStat(randomAnimal.baseStats.stamina, level),
      };

      // Generate moves based on animal type and level
      const moves = generateMovesForAnimal(
        randomAnimal.name,
        randomAnimal.type,
        level
      );

      return {
        id: "wild_" + Date.now(),
        name: randomAnimal.name,
        emoji: randomAnimal.emoji,
        level: level,
        type: randomAnimal.type,
        stats: stats,
        moves: moves,
      };
    }

    function generateMovesForAnimal(
      name: string,
      types: string[],
      level: number
    ) {
      const movesByType: Record<string, any[]> = {
        grassland: [
          {
            id: "bite",
            name: "Bite",
            description: "A powerful bite attack.",
            type: "grassland",
            power: 60,
            accuracy: 100,
            energyCost: 10,
          },
          {
            id: "charge",
            name: "Charge",
            description: "Rush forward with tremendous force.",
            type: "grassland",
            power: 90,
            accuracy: 85,
            energyCost: 20,
          },
          {
            id: "roar",
            name: "Roar",
            description: "Let out a terrifying roar.",
            type: "grassland",
            power: 0,
            accuracy: 100,
            energyCost: 8,
          },
        ],
        forest: [
          {
            id: "claw",
            name: "Claw",
            description: "Slash with sharp claws.",
            type: "forest",
            power: 40,
            accuracy: 100,
            energyCost: 8,
          },
          {
            id: "bite",
            name: "Bite",
            description: "A powerful bite attack.",
            type: "forest",
            power: 60,
            accuracy: 100,
            energyCost: 10,
          },
          {
            id: "howl",
            name: "Howl",
            description: "Howl to boost attack power.",
            type: "forest",
            power: 0,
            accuracy: 100,
            energyCost: 8,
          },
        ],
        mountain: [
          {
            id: "wing_attack",
            name: "Wing Attack",
            description: "Strike with powerful wings.",
            type: "mountain",
            power: 60,
            accuracy: 100,
            energyCost: 12,
          },
          {
            id: "air_slash",
            name: "Air Slash",
            description: "Cut through the air with razor-sharp wind.",
            type: "mountain",
            power: 75,
            accuracy: 95,
            energyCost: 18,
          },
          {
            id: "dive_bomb",
            name: "Dive Bomb",
            description: "Dive from great height.",
            type: "mountain",
            power: 100,
            accuracy: 95,
            energyCost: 20,
          },
        ],
        ocean: [
          {
            id: "water_gun",
            name: "Water Gun",
            description: "Spray a powerful jet of water.",
            type: "ocean",
            power: 40,
            accuracy: 100,
            energyCost: 10,
          },
          {
            id: "bite",
            name: "Bite",
            description: "A powerful bite attack.",
            type: "ocean",
            power: 60,
            accuracy: 100,
            energyCost: 10,
          },
          {
            id: "tidal_wave",
            name: "Tidal Wave",
            description: "Summon a massive wave.",
            type: "ocean",
            power: 110,
            accuracy: 80,
            energyCost: 25,
          },
        ],
      };

      const availableMoves = [];

      // Add moves from animal's types
      types.forEach((type) => {
        if (movesByType[type]) {
          availableMoves.push(...movesByType[type]);
        }
      });

      // Filter moves by level and select up to 4
      const learnableMoves = availableMoves.filter((move) => {
        const learnLevel = move.power > 80 ? 8 : move.power > 60 ? 5 : 1;
        return level >= learnLevel;
      });

      // Shuffle and take up to 4 moves
      const shuffled = learnableMoves.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4);
    }

    function generatePlayerAnimal() {
      return {
        id: "player_starter",
        name: "Wolf",
        nickname: "Buddy",
        emoji: "🐺",
        level: 5,
        type: ["forest"],
        stats: {
          health: 75,
          maxHealth: 75,
          attack: 65,
          defense: 55,
          speed: 60,
          intelligence: 50,
          stamina: 65,
        },
        moves: [
          {
            id: "bite",
            name: "Bite",
            description: "A powerful bite attack.",
            type: "forest",
            power: 60,
            accuracy: 100,
            energyCost: 10,
          },
          {
            id: "howl",
            name: "Howl",
            description: "Howl to boost attack power.",
            type: "forest",
            power: 0,
            accuracy: 100,
            energyCost: 8,
          },
        ],
      };
    }

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      // URL of your web view content
      url: "page.html",

      // Handle messages sent from the web view
      async onMessage(message, webView) {
        // Check if message is valid and has a type
        if (!message || typeof message !== "object") {
          console.error("Invalid message received", message);
          return;
        }

        // Get and validate message type
        const messageType = message.type;
        if (!messageType || typeof messageType !== "string") {
          console.error("Message missing valid type property", message);
          return;
        }

        try {
          switch (messageType) {
            case "webViewReady":
              // Load or create trainer profile
              let trainerProfile: TrainerProfile;
              const profileData = username
                ? await context.redis.get(`trainer_profile_${username}`)
                : null;
              if (profileData) {
                trainerProfile = JSON.parse(profileData);
              } else if (username) {
                trainerProfile = createDefaultTrainerProfile(
                  username,
                  `trainer_${username}_${Date.now()}`
                );
                await context.redis.set(
                  `trainer_profile_${username}`,
                  JSON.stringify(trainerProfile)
                );
              } else {
                trainerProfile = createDefaultTrainerProfile(
                  "anonymous",
                  "trainer_anon"
                );
              }

              // Process daily rewards
              const sessionId = `session_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              const dailyReward = username
                ? await economyService.processDailyRewardsWithTracking(
                    trainerProfile,
                    sessionId
                  )
                : null;

              // Save updated profile
              if (username) {
                await context.redis.set(
                  `trainer_profile_${username}`,
                  JSON.stringify(trainerProfile)
                );
              }

              // Send initial data to the web view
              const leaderboardData = await context.redis.get("leaderboard");
              const leaderboard = leaderboardData
                ? JSON.parse(leaderboardData)
                : [];
              // Arcade best
              const arcadeBestRaw = username
                ? await context.redis.get(`arcade_best_${username}`)
                : null;
              const arcadeBest = arcadeBestRaw ? Number(arcadeBestRaw) : 0;
              // Arcade leaderboard
              const arcadeLeaderboardData = await context.redis.get(
                "arcade_leaderboard"
              );
              const arcadeLeaderboard = arcadeLeaderboardData
                ? JSON.parse(arcadeLeaderboardData)
                : [];
              // Streak leaderboard
              const streakLeaderboardData = await context.redis.get(
                "streak_leaderboard"
              );
              const streakLeaderboard = streakLeaderboardData
                ? JSON.parse(streakLeaderboardData)
                : [];

              // Get world map and habitat data
              const worldMapData = worldMapService.getWorldMap(trainerProfile);
              const availableHabitats =
                habitatService.getAvailableHabitats(trainerProfile);
              const dailyExpeditions =
                await expeditionService.generateDailyExpeditions(
                  trainerProfile
                );

              webView.postMessage({
                type: "initialData",
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
                  streakLeaderboard,
                  trainerProfile: {
                    level: trainerProfile.level,
                    experience: trainerProfile.experience,
                    currency: trainerProfile.currency,
                    inventory: trainerProfile.inventory,
                    premiumTier: economyService
                      .getPremiumManager()
                      .getPremiumTier(trainerProfile),
                  },
                  dailyReward: dailyReward,
                  sessionId: sessionId,
                  worldMap: worldMapData,
                  availableHabitats: availableHabitats,
                  dailyExpeditions: dailyExpeditions,
                },
              });
              break;
            case "getArcadePuzzle": {
              // For arcade: generate a fresh puzzle (not tied to date) and optionally scale difficulty
              // Basic scaling: longer answers at higher difficulty
              const pool = animals
                .slice()
                .sort((a, b) => a.answer.length - b.answer.length);
              const difficulty = Math.max(
                1,
                Math.min(5, Number(message.data?.difficulty ?? 1))
              );
              const minLen = Math.min(12, 3 + difficulty * 2);
              const candidates = pool.filter((a) => a.answer.length >= minLen);
              const base = (candidates.length ? candidates : pool)[
                Math.floor(
                  Math.random() *
                    (candidates.length ? candidates.length : pool.length)
                )
              ];
              const letters = base.answer
                .split("")
                .sort(() => Math.random() - 0.5);
              webView.postMessage({
                type: "nextArcadePuzzle",
                data: {
                  puzzle: {
                    emoji: base.emoji,
                    hint: "Arcade: beat the clock!",
                    answerLength: base.answer.length,
                    letters,
                    fact: base.fact,
                    answer: base.answer,
                  },
                },
              });
              break;
            }
            case "arcadeGameOver": {
              const finalScore = Number(message.data?.finalScore ?? 0);
              if (username) {
                const bestRaw = await context.redis.get(
                  `arcade_best_${username}`
                );
                const best = bestRaw ? Number(bestRaw) : 0;
                if (finalScore > best) {
                  await context.redis.set(
                    `arcade_best_${username}`,
                    String(finalScore)
                  );
                  webView.postMessage({
                    type: "updateArcadeBest",
                    data: { best: finalScore },
                  });

                  // Update arcade leaderboard
                  const arcadeLeaderboardData = await context.redis.get(
                    "arcade_leaderboard"
                  );
                  let arcadeLeaderboard = arcadeLeaderboardData
                    ? JSON.parse(arcadeLeaderboardData)
                    : [];
                  const userIndex = arcadeLeaderboard.findIndex(
                    (entry: any) => entry.username === username
                  );
                  if (userIndex >= 0) {
                    arcadeLeaderboard[userIndex].best = finalScore;
                  } else {
                    arcadeLeaderboard.push({ username, best: finalScore });
                  }
                  arcadeLeaderboard.sort((a: any, b: any) => b.best - a.best);
                  await context.redis.set(
                    "arcade_leaderboard",
                    JSON.stringify(arcadeLeaderboard)
                  );
                }
              }
              break;
            }

            case "submitGuess":
              if (!message.data || typeof message.data.guess !== "string") {
                console.error("submitGuess missing guess", message);
                return;
              }
              {
                const userGuess = (message.data.guess || "")
                  .toUpperCase()
                  .trim();
                const secondsTaken = Number(message.data.secondsTaken ?? 0);
                const usedHint = Boolean(message.data.usedHint);
                const todayPuzzleRaw = await context.redis.get(
                  `puzzle_${context.postId}`
                );
                const todayPuzzle = todayPuzzleRaw
                  ? JSON.parse(todayPuzzleRaw)
                  : getDailyPuzzle();
                const isCorrect = userGuess === todayPuzzle.answer;

                let fact = todayPuzzle.fact;
                // scoring: base 5 for first correct of the day, + time bonus up to +5, -2 if used hint
                if (isCorrect && username) {
                  const dateKey = getDateKey();
                  const awardedKey = `user_scored_${username}_${dateKey}`;
                  const alreadyAwarded = await context.redis.get(awardedKey);
                  if (!alreadyAwarded) {
                    const timeBonus = Math.max(
                      0,
                      Math.min(
                        5,
                        Math.ceil((15 - Math.min(15, secondsTaken)) / 3)
                      )
                    );
                    const hintPenalty = usedHint ? 2 : 0;
                    const gained = Math.max(1, 5 + timeBonus - hintPenalty);
                    const newScore = score + gained;
                    await updateScore(newScore);
                    await context.redis.set(awardedKey, "1");
                    const newStreak = await updateStreakOnFirstDailyCorrect();
                    webView.postMessage({
                      type: "updateScore",
                      data: { newScore },
                    });
                    if (newStreak !== null) {
                      webView.postMessage({
                        type: "updateStreak",
                        data: { newStreak },
                      });

                      // Update streak leaderboard
                      const streakLeaderboardData = await context.redis.get(
                        "streak_leaderboard"
                      );
                      let streakLeaderboard = streakLeaderboardData
                        ? JSON.parse(streakLeaderboardData)
                        : [];
                      const userIndex = streakLeaderboard.findIndex(
                        (entry: any) => entry.username === username
                      );
                      if (userIndex >= 0) {
                        streakLeaderboard[userIndex].streak = newStreak;
                      } else {
                        streakLeaderboard.push({ username, streak: newStreak });
                      }
                      streakLeaderboard.sort(
                        (a: any, b: any) => b.streak - a.streak
                      );
                      await context.redis.set(
                        "streak_leaderboard",
                        JSON.stringify(streakLeaderboard)
                      );
                    }
                    fact = `${fact} You earned ${gained} pts${
                      usedHint ? " (hint -2)" : ""
                    }${timeBonus ? ` (+${timeBonus} time bonus)` : ""}.`;
                  } else {
                    fact = `${fact} You've already earned today's points. Come back tomorrow!`;
                  }
                }

                webView.postMessage({
                  type: "guessResult",
                  data: { isCorrect, fact, answer: todayPuzzle.answer },
                });
              }
              break;
            case "startBattle": {
              // Start a battle with a wild animal
              const wildAnimal = generateWildAnimal();
              const playerAnimal = generatePlayerAnimal();

              const battleData = {
                playerName: username,
                opponentName: "Wild Animal",
                playerTeam: [playerAnimal],
                opponentTeam: [wildAnimal],
                battleType: "wild",
              };

              webView.postMessage({
                type: "startBattle",
                data: battleData,
              });
              break;
            }
            case "battleAction": {
              // Process battle action
              const { action, moveIndex, targetIndex } = message.data;

              // Simple battle resolution for demo
              let battleResult = null;

              if (action === "attack") {
                // Simulate battle outcome
                const playerWins = Math.random() > 0.5;
                const experienceGained = playerWins ? 50 : 10;

                battleResult = {
                  winner: playerWins ? "player" : "opponent",
                  experienceGained,
                };

                // Send battle messages
                webView.postMessage({
                  type: "battleUpdate",
                  data: {
                    type: "battleMessage",
                    message: playerWins
                      ? "Wild animal fainted!"
                      : "Your animal fainted!",
                  },
                });

                // End battle after delay
                setTimeout(() => {
                  webView.postMessage({
                    type: "battleUpdate",
                    data: {
                      type: "battleEnd",
                      result: battleResult,
                    },
                  });
                }, 1500);
              } else if (action === "forfeit") {
                battleResult = {
                  winner: "opponent",
                  experienceGained: 0,
                };

                webView.postMessage({
                  type: "battleUpdate",
                  data: {
                    type: "battleEnd",
                    result: battleResult,
                  },
                });
              }
              break;
            }
            case "puzzleComplete": {
              // Handle puzzle completion with real-time scoring
              if (!username || !message.data) {
                break;
              }

              const {
                correct,
                answer,
                userAnswer,
                score: gameScore,
              } = message.data;

              if (correct) {
                // Award points for correct answer
                const basePoints = 100;
                const bonusPoints = Math.floor(Math.random() * 50); // Random bonus
                const totalPoints = basePoints + bonusPoints;

                // Update user score in Redis
                const currentScoreRaw = await context.redis.get(
                  `user_score_${username}`
                );
                const currentScore = Number(currentScoreRaw || 0);
                const newScore = currentScore + totalPoints;
                await context.redis.set(
                  `user_score_${username}`,
                  newScore.toString()
                );

                // Update streak
                const currentStreakRaw = await context.redis.get(
                  `user_streak_${username}`
                );
                const currentStreak = Number(currentStreakRaw || 0);
                const newStreak = currentStreak + 1;
                await context.redis.set(
                  `user_streak_${username}`,
                  newStreak.toString()
                );

                // Update leaderboard
                const leaderboardData = await context.redis.get("leaderboard");
                let leaderboard = leaderboardData
                  ? JSON.parse(leaderboardData)
                  : [];

                const userIndex = leaderboard.findIndex(
                  (entry: any) => entry.username === username
                );
                if (userIndex >= 0) {
                  leaderboard[userIndex].score = newScore;
                } else {
                  leaderboard.push({ username, score: newScore });
                }

                // Sort by score (descending) and keep top 100
                leaderboard.sort((a: any, b: any) => b.score - a.score);
                leaderboard = leaderboard.slice(0, 100);
                await context.redis.set(
                  "leaderboard",
                  JSON.stringify(leaderboard)
                );

                // Update streak leaderboard
                const streakLeaderboardData = await context.redis.get(
                  "streak_leaderboard"
                );
                let streakLeaderboard = streakLeaderboardData
                  ? JSON.parse(streakLeaderboardData)
                  : [];

                const streakUserIndex = streakLeaderboard.findIndex(
                  (entry: any) => entry.username === username
                );
                if (streakUserIndex >= 0) {
                  streakLeaderboard[streakUserIndex].streak = newStreak;
                } else {
                  streakLeaderboard.push({ username, streak: newStreak });
                }

                streakLeaderboard.sort((a: any, b: any) => b.streak - a.streak);
                streakLeaderboard = streakLeaderboard.slice(0, 100);
                await context.redis.set(
                  "streak_leaderboard",
                  JSON.stringify(streakLeaderboard)
                );

                // Send updated data back to game
                webView.postMessage({
                  type: "scoreUpdate",
                  data: {
                    score: newScore,
                    streak: newStreak,
                    pointsEarned: totalPoints,
                    leaderboard: leaderboard.slice(0, 10), // Top 10 for display
                  },
                });

                // Log achievement
                console.log(
                  `${username} solved puzzle: ${answer} (+${totalPoints} points, streak: ${newStreak})`
                );
              } else {
                // Reset streak on incorrect answer
                await context.redis.set(`user_streak_${username}`, "0");

                webView.postMessage({
                  type: "scoreUpdate",
                  data: {
                    streak: 0,
                    streakBroken: true,
                  },
                });

                console.log(
                  `${username} failed puzzle: ${answer} (guessed: ${userAnswer})`
                );
              }
              break;
            }
            case "getLeaderboard": {
              // Send real-time leaderboard data
              const leaderboardData = await context.redis.get("leaderboard");
              const leaderboard = leaderboardData
                ? JSON.parse(leaderboardData)
                : [];

              const streakLeaderboardData = await context.redis.get(
                "streak_leaderboard"
              );
              const streakLeaderboard = streakLeaderboardData
                ? JSON.parse(streakLeaderboardData)
                : [];

              webView.postMessage({
                type: "leaderboardData",
                data: {
                  scoreLeaderboard: leaderboard.slice(0, 10),
                  streakLeaderboard: streakLeaderboard.slice(0, 10),
                },
              });
              break;
            }
            case "purchaseItem": {
              if (!username || !message.data?.itemId) {
                webView.postMessage({
                  type: "purchaseResult",
                  data: { success: false, error: "Invalid request" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "purchaseResult",
                  data: { success: false, error: "Profile not found" },
                });
                break;
              }

              const trainerProfile: TrainerProfile = JSON.parse(profileData);
              const success = await economyService.purchaseItemWithTracking(
                trainerProfile,
                message.data.itemId,
                message.data.quantity || 1,
                message.data.sessionId || sessionId
              );

              if (success) {
                await context.redis.set(
                  `trainer_profile_${username}`,
                  JSON.stringify(trainerProfile)
                );
              }

              webView.postMessage({
                type: "purchaseResult",
                data: {
                  success,
                  currency: trainerProfile.currency,
                  inventory: trainerProfile.inventory,
                },
              });
              break;
            }
            case "purchasePremium": {
              if (!username || !message.data?.tier) {
                webView.postMessage({
                  type: "premiumResult",
                  data: { success: false, error: "Invalid request" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "premiumResult",
                  data: { success: false, error: "Profile not found" },
                });
                break;
              }

              const trainerProfile: TrainerProfile = JSON.parse(profileData);
              const success = await economyService.purchasePremiumWithTracking(
                trainerProfile,
                message.data.tier,
                message.data.duration || 30,
                message.data.sessionId || sessionId
              );

              if (success) {
                await context.redis.set(
                  `trainer_profile_${username}`,
                  JSON.stringify(trainerProfile)
                );
              }

              webView.postMessage({
                type: "premiumResult",
                data: {
                  success,
                  premiumTier: economyService
                    .getPremiumManager()
                    .getPremiumTier(trainerProfile),
                  currency: trainerProfile.currency,
                },
              });
              break;
            }
            case "purchaseCosmetic": {
              if (!username || !message.data?.cosmeticId) {
                webView.postMessage({
                  type: "cosmeticResult",
                  data: { success: false, error: "Invalid request" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "cosmeticResult",
                  data: { success: false, error: "Profile not found" },
                });
                break;
              }

              const trainerProfile: TrainerProfile = JSON.parse(profileData);
              const success = await economyService.purchaseCosmeticWithTracking(
                trainerProfile,
                message.data.cosmeticId,
                message.data.sessionId || sessionId
              );

              if (success) {
                await context.redis.set(
                  `trainer_profile_${username}`,
                  JSON.stringify(trainerProfile)
                );
              }

              webView.postMessage({
                type: "cosmeticResult",
                data: {
                  success,
                  unlockedCosmetics: trainerProfile.unlockedCosmetics || [],
                  currency: trainerProfile.currency,
                },
              });
              break;
            }
            case "getCosmeticStore": {
              const store = economyService
                .getPremiumManager()
                .getCosmeticStore();
              webView.postMessage({
                type: "cosmeticStore",
                data: { items: store },
              });
              break;
            }
            case "useItem": {
              if (!username || !message.data?.itemId) {
                webView.postMessage({
                  type: "useItemResult",
                  data: { success: false, error: "Invalid request" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "useItemResult",
                  data: { success: false, error: "Profile not found" },
                });
                break;
              }

              const trainerProfile: TrainerProfile = JSON.parse(profileData);
              const success = await economyService.useItemWithTracking(
                trainerProfile,
                message.data.itemId,
                message.data.quantity || 1,
                message.data.context || "general",
                message.data.sessionId || sessionId
              );

              if (success) {
                await context.redis.set(
                  `trainer_profile_${username}`,
                  JSON.stringify(trainerProfile)
                );
              }

              webView.postMessage({
                type: "useItemResult",
                data: {
                  success,
                  inventory: trainerProfile.inventory,
                },
              });
              break;
            }
            case "getWorldMap": {
              if (!username) {
                webView.postMessage({
                  type: "worldMapError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "worldMapError",
                  data: { error: "Profile not found" },
                });
                break;
              }

              const trainerProfile: TrainerProfile = JSON.parse(profileData);
              const worldMapData = worldMapService.getWorldMap(trainerProfile);

              webView.postMessage({
                type: "worldMapData",
                data: worldMapData,
              });
              break;
            }
            case "getHabitatInfo": {
              const habitatId = message.data?.habitatId;
              if (!habitatId) {
                webView.postMessage({
                  type: "habitatInfoError",
                  data: { error: "Habitat ID required" },
                });
                break;
              }

              const habitat = habitatService.getHabitat(habitatId);
              if (!habitat) {
                webView.postMessage({
                  type: "habitatInfoError",
                  data: { error: "Habitat not found" },
                });
                break;
              }

              const weather = weatherSystem.getCurrentWeather(habitatId);
              const forecast = weatherSystem.getWeatherForecast(habitatId);

              webView.postMessage({
                type: "habitatInfo",
                data: {
                  habitat,
                  weather,
                  forecast,
                },
              });
              break;
            }
            case "exploreHabitat": {
              if (!username || !message.data?.habitatId) {
                webView.postMessage({
                  type: "explorationError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "explorationError",
                  data: { error: "Profile not found" },
                });
                break;
              }

              try {
                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const expeditionType = message.data.expeditionType || "normal";

                const result = await habitatService.exploreHabitat(
                  message.data.habitatId,
                  trainerProfile,
                  expeditionType
                );

                // Deduct exploration cost
                const habitat = habitatService.getHabitat(
                  message.data.habitatId
                );
                if (habitat) {
                  const cost =
                    expeditionType === "extended"
                      ? habitat.explorationCost * 2
                      : habitat.explorationCost;
                  trainerProfile.currency.pawCoins -= cost;
                  await context.redis.set(
                    `trainer_profile_${username}`,
                    JSON.stringify(trainerProfile)
                  );
                }

                webView.postMessage({
                  type: "explorationResult",
                  data: {
                    result,
                    updatedCurrency: trainerProfile.currency,
                  },
                });
              } catch (error) {
                webView.postMessage({
                  type: "explorationError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Exploration failed",
                  },
                });
              }
              break;
            }
            case "getDailyExpeditions": {
              if (!username) {
                webView.postMessage({
                  type: "expeditionsError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "expeditionsError",
                  data: { error: "Profile not found" },
                });
                break;
              }

              try {
                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const expeditions =
                  await expeditionService.generateDailyExpeditions(
                    trainerProfile
                  );

                webView.postMessage({
                  type: "dailyExpeditions",
                  data: { expeditions },
                });
              } catch (error) {
                webView.postMessage({
                  type: "expeditionsError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get expeditions",
                  },
                });
              }
              break;
            }
            case "startExpedition": {
              if (!username || !message.data?.expeditionId) {
                webView.postMessage({
                  type: "expeditionError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const result = await expeditionService.startExpedition(
                  message.data.expeditionId,
                  username
                );

                webView.postMessage({
                  type: "expeditionResult",
                  data: result,
                });
              } catch (error) {
                webView.postMessage({
                  type: "expeditionError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Expedition failed",
                  },
                });
              }
              break;
            }
            case "getWeatherForecast": {
              const habitatId = message.data?.habitatId;
              if (!habitatId) {
                webView.postMessage({
                  type: "weatherError",
                  data: { error: "Habitat ID required" },
                });
                break;
              }

              try {
                const forecast = weatherSystem.getWeatherForecast(habitatId);
                const currentWeather =
                  weatherSystem.getCurrentWeather(habitatId);

                webView.postMessage({
                  type: "weatherForecast",
                  data: {
                    forecast,
                    currentWeather,
                  },
                });
              } catch (error) {
                webView.postMessage({
                  type: "weatherError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Weather data unavailable",
                  },
                });
              }
              break;
            }
            case "discoverHiddenArea": {
              if (!username || !message.data?.areaId) {
                webView.postMessage({
                  type: "discoveryError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const result = await worldMapService.discoverHiddenArea(
                  message.data.areaId,
                  username
                );

                webView.postMessage({
                  type: "discoveryResult",
                  data: result,
                });
              } catch (error) {
                webView.postMessage({
                  type: "discoveryError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Discovery failed",
                  },
                });
              }
              break;
            }
            case "getEducationalPartners": {
              // Get active wildlife organizations
              const organizations =
                educationalPartnershipService.getActiveOrganizations();
              webView.postMessage({
                type: "educationalPartners",
                data: { organizations },
              });
              break;
            }
            case "getSponsoredContent": {
              if (!username) {
                webView.postMessage({
                  type: "sponsoredContentError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              const profileData = await context.redis.get(
                `trainer_profile_${username}`
              );
              if (!profileData) {
                webView.postMessage({
                  type: "sponsoredContentError",
                  data: { error: "Profile not found" },
                });
                break;
              }

              const trainerProfile: TrainerProfile = JSON.parse(profileData);
              const sponsoredContent =
                educationalPartnershipService.getSponsoredContent(
                  trainerProfile
                );

              webView.postMessage({
                type: "sponsoredContent",
                data: { content: sponsoredContent },
              });
              break;
            }
            case "completeSponsoredContent": {
              if (!username || !message.data?.contentId) {
                webView.postMessage({
                  type: "contentCompletionError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              const result =
                await educationalPartnershipService.completeSponsoredContent(
                  username,
                  message.data.contentId,
                  message.data.completionData || {}
                );

              webView.postMessage({
                type: "contentCompletionResult",
                data: result,
              });
              break;
            }
            case "getConservationImpact": {
              if (!username) {
                webView.postMessage({
                  type: "conservationImpactError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              const impact =
                educationalPartnershipService.getConservationImpact(username);
              const totalImpact =
                educationalPartnershipService.getTotalConservationImpact();

              webView.postMessage({
                type: "conservationImpact",
                data: {
                  personalImpact: impact,
                  globalImpact: totalImpact,
                },
              });
              break;
            }
            case "getExpertAMAs": {
              const activeAMAs = educationalPartnershipService.getActiveAMAs();
              webView.postMessage({
                type: "expertAMAs",
                data: { amas: activeAMAs },
              });
              break;
            }
            case "submitAMAQuestion": {
              if (
                !username ||
                !message.data?.amaId ||
                !message.data?.question
              ) {
                webView.postMessage({
                  type: "amaQuestionError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              const success = educationalPartnershipService.submitAMAQuestion(
                message.data.amaId,
                username,
                message.data.question
              );

              webView.postMessage({
                type: "amaQuestionResult",
                data: { success },
              });
              break;
            }
            case "getCitizenScienceProjects": {
              const projects =
                educationalPartnershipService.getActiveCitizenScienceProjects();
              webView.postMessage({
                type: "citizenScienceProjects",
                data: { projects },
              });
              break;
            }
            case "submitDataContribution": {
              if (
                !username ||
                !message.data?.projectId ||
                !message.data?.dataType ||
                !message.data?.data
              ) {
                webView.postMessage({
                  type: "dataContributionError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              const success =
                educationalPartnershipService.submitDataContribution(
                  message.data.projectId,
                  username,
                  message.data.dataType,
                  message.data.data,
                  message.data.location
                );

              webView.postMessage({
                type: "dataContributionResult",
                data: { success },
              });
              break;
            }
            case "getTrainerContributions": {
              if (!username) {
                webView.postMessage({
                  type: "contributionsError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              const contributions =
                educationalPartnershipService.getTrainerContributions(username);
              webView.postMessage({
                type: "trainerContributions",
                data: { contributions },
              });
              break;
            }
            case "createBattleReplay": {
              if (!username || !message.data?.battleId) {
                webView.postMessage({
                  type: "replayError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "replayError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const replay = await contentCreationService.createBattleReplay(
                  message.data.battleId,
                  trainerProfile.trainerId
                );
                const redditPost =
                  await redditPostGenerator.generateBattleReplayPost(
                    replay,
                    trainerProfile
                  );

                webView.postMessage({
                  type: "battleReplayCreated",
                  data: { replay, redditPost },
                });
              } catch (error) {
                webView.postMessage({
                  type: "replayError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create replay",
                  },
                });
              }
              break;
            }
            case "createCollectionShowcase": {
              if (
                !username ||
                !message.data?.category ||
                !message.data?.animals
              ) {
                webView.postMessage({
                  type: "showcaseError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "showcaseError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const showcase =
                  await contentCreationService.createCollectionShowcase(
                    trainerProfile.trainerId,
                    message.data.category,
                    message.data.animals
                  );
                const redditPost =
                  await redditPostGenerator.generateCollectionShowcasePost(
                    showcase,
                    trainerProfile
                  );

                webView.postMessage({
                  type: "collectionShowcaseCreated",
                  data: { showcase, redditPost },
                });
              } catch (error) {
                webView.postMessage({
                  type: "showcaseError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create showcase",
                  },
                });
              }
              break;
            }
            case "createStrategyGuide": {
              if (!username || !message.data?.content) {
                webView.postMessage({
                  type: "strategyGuideError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "strategyGuideError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const guide =
                  await contentCreationService.generateStrategyGuide(
                    trainerProfile.trainerId,
                    message.data.content
                  );

                // Award rewards for creating content
                await communityRewardsService.awardContentCreatorRewards(
                  trainerProfile.trainerId,
                  "strategy_guide" as any,
                  "good" as any
                );

                webView.postMessage({
                  type: "strategyGuideCreated",
                  data: { guide },
                });
              } catch (error) {
                webView.postMessage({
                  type: "strategyGuideError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create strategy guide",
                  },
                });
              }
              break;
            }
            case "submitFanArt": {
              if (!username || !message.data?.artwork) {
                webView.postMessage({
                  type: "fanArtError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "fanArtError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const fanArt = await contentCreationService.submitFanArt(
                  trainerProfile.trainerId,
                  message.data.artwork
                );

                // Award rewards for creating content
                await communityRewardsService.awardContentCreatorRewards(
                  trainerProfile.trainerId,
                  "fan_art" as any,
                  "good" as any
                );

                webView.postMessage({
                  type: "fanArtSubmitted",
                  data: { fanArt },
                });
              } catch (error) {
                webView.postMessage({
                  type: "fanArtError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to submit fan art",
                  },
                });
              }
              break;
            }
            case "getStrategyGuides": {
              const guides = contentCreationService.getAllStrategyGuides();
              const featuredContent =
                contentCreationService.getFeaturedContent();

              webView.postMessage({
                type: "strategyGuides",
                data: {
                  guides: guides.slice(0, 20), // Limit to 20 most recent
                  featured: featuredContent.guides,
                },
              });
              break;
            }
            case "getFanArtGallery": {
              const fanArt = contentCreationService.getAllFanArt();
              const featuredContent =
                contentCreationService.getFeaturedContent();

              webView.postMessage({
                type: "fanArtGallery",
                data: {
                  fanArt: fanArt.slice(0, 20), // Limit to 20 most recent
                  featured: featuredContent.fanArt,
                },
              });
              break;
            }
            case "getCommunityContribution": {
              if (!username) {
                webView.postMessage({
                  type: "contributionError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "contributionError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const contribution =
                  await communityRewardsService.calculateCommunityContribution(
                    trainerProfile.trainerId
                  );
                const topContributors =
                  communityRewardsService.getTopContributors(10);
                const communityStats =
                  communityRewardsService.getCommunityStats();

                webView.postMessage({
                  type: "communityContribution",
                  data: {
                    personalContribution: contribution,
                    topContributors,
                    communityStats,
                  },
                });
              } catch (error) {
                webView.postMessage({
                  type: "contributionError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get contribution data",
                  },
                });
              }
              break;
            }
            case "generateInfographic": {
              if (!message.data?.infographicData) {
                webView.postMessage({
                  type: "infographicError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const infographicUrl =
                  await redditPostGenerator.generateInfographic(
                    message.data.infographicData
                  );

                webView.postMessage({
                  type: "infographicGenerated",
                  data: { url: infographicUrl },
                });
              } catch (error) {
                webView.postMessage({
                  type: "infographicError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to generate infographic",
                  },
                });
              }
              break;
            }
            case "createTournament": {
              if (!username || !message.data?.config) {
                webView.postMessage({
                  type: "tournamentError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "tournamentError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const config = {
                  ...message.data.config,
                  createdBy: trainerProfile.trainerId,
                };
                const tournament = await tournamentService.createTournament(
                  config
                );

                webView.postMessage({
                  type: "tournamentCreated",
                  data: { tournament },
                });
              } catch (error) {
                webView.postMessage({
                  type: "tournamentError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create tournament",
                  },
                });
              }
              break;
            }
            case "registerForTournament": {
              if (!username || !message.data?.tournamentId) {
                webView.postMessage({
                  type: "registrationError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "registrationError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const success = await tournamentService.registerParticipant(
                  message.data.tournamentId,
                  trainerProfile.trainerId
                );

                webView.postMessage({
                  type: "registrationResult",
                  data: { success, tournamentId: message.data.tournamentId },
                });
              } catch (error) {
                webView.postMessage({
                  type: "registrationError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to register for tournament",
                  },
                });
              }
              break;
            }
            case "getTournaments": {
              const activeTournaments =
                tournamentService.getActiveTournaments();
              const upcomingTournaments =
                tournamentService.getUpcomingTournaments();

              webView.postMessage({
                type: "tournaments",
                data: {
                  active: activeTournaments,
                  upcoming: upcomingTournaments,
                },
              });
              break;
            }
            case "getTournamentStandings": {
              if (!message.data?.tournamentId) {
                webView.postMessage({
                  type: "standingsError",
                  data: { error: "Tournament ID required" },
                });
                break;
              }

              try {
                const standings =
                  await tournamentService.getTournamentStandings(
                    message.data.tournamentId
                  );

                webView.postMessage({
                  type: "tournamentStandings",
                  data: { standings, tournamentId: message.data.tournamentId },
                });
              } catch (error) {
                webView.postMessage({
                  type: "standingsError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get standings",
                  },
                });
              }
              break;
            }
            case "getWeeklyTournament": {
              try {
                const weeklyTournament =
                  await tournamentService.createWeeklyTournament();

                webView.postMessage({
                  type: "weeklyTournament",
                  data: { tournament: weeklyTournament },
                });
              } catch (error) {
                webView.postMessage({
                  type: "weeklyTournamentError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get weekly tournament",
                  },
                });
              }
              break;
            }
            case "getPlayerRank": {
              if (!username) {
                webView.postMessage({
                  type: "rankError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "rankError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const playerRank = await rankingService.calculatePlayerRank(
                  trainerProfile.trainerId
                );

                webView.postMessage({
                  type: "playerRank",
                  data: { rank: playerRank },
                });
              } catch (error) {
                webView.postMessage({
                  type: "rankError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get player rank",
                  },
                });
              }
              break;
            }
            case "getRankingLeaderboard": {
              const category = message.data?.category || "overall";
              const timeframe = message.data?.timeframe || "all_time";

              try {
                const leaderboard = await rankingService.getLeaderboard(
                  category,
                  timeframe
                );

                webView.postMessage({
                  type: "rankingLeaderboard",
                  data: { leaderboard, category, timeframe },
                });
              } catch (error) {
                webView.postMessage({
                  type: "leaderboardError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get leaderboard",
                  },
                });
              }
              break;
            }
            case "findMatchmakingOpponent": {
              if (!username) {
                webView.postMessage({
                  type: "matchmakingError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "matchmakingError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const preferences = message.data?.preferences || {
                  gameMode: "ranked",
                  maxWaitTime: 60,
                  ratingRange: 100,
                  allowCrossRegion: true,
                };

                const opponentId = await rankingService.findMatchmakingOpponent(
                  trainerProfile.trainerId,
                  preferences
                );

                webView.postMessage({
                  type: "matchmakingResult",
                  data: { opponentId, preferences },
                });
              } catch (error) {
                webView.postMessage({
                  type: "matchmakingError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to find opponent",
                  },
                });
              }
              break;
            }
            case "createSpectatorSession": {
              if (!message.data?.matchId) {
                webView.postMessage({
                  type: "spectatorError",
                  data: { error: "Match ID required" },
                });
                break;
              }

              try {
                const session = await spectatorService.createSpectatorSession(
                  message.data.matchId
                );

                webView.postMessage({
                  type: "spectatorSessionCreated",
                  data: { session },
                });
              } catch (error) {
                webView.postMessage({
                  type: "spectatorError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create spectator session",
                  },
                });
              }
              break;
            }
            case "joinSpectatorSession": {
              if (!username || !message.data?.sessionId) {
                webView.postMessage({
                  type: "spectatorError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "spectatorError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const success = await spectatorService.joinSpectatorSession(
                  message.data.sessionId,
                  trainerProfile.trainerId
                );

                webView.postMessage({
                  type: "spectatorJoinResult",
                  data: { success, sessionId: message.data.sessionId },
                });
              } catch (error) {
                webView.postMessage({
                  type: "spectatorError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to join spectator session",
                  },
                });
              }
              break;
            }
            case "getActiveSpectatorSessions": {
              const activeSessions =
                spectatorService.getActiveSpectatorSessions();
              const globalStats = spectatorService.getGlobalSpectatorStats();

              webView.postMessage({
                type: "activeSpectatorSessions",
                data: { sessions: activeSessions, stats: globalStats },
              });
              break;
            }
            case "sendSpectatorChat": {
              if (
                !username ||
                !message.data?.sessionId ||
                !message.data?.message
              ) {
                webView.postMessage({
                  type: "chatError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "chatError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const success = await spectatorService.sendChatMessage(
                  message.data.sessionId,
                  trainerProfile.trainerId,
                  message.data.message,
                  message.data.type || "normal"
                );

                webView.postMessage({
                  type: "chatSendResult",
                  data: { success },
                });
              } catch (error) {
                webView.postMessage({
                  type: "chatError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to send chat message",
                  },
                });
              }
              break;
            }
            case "updateMatchAfterBattle": {
              if (
                !username ||
                !message.data?.opponentId ||
                !message.data?.result
              ) {
                break; // Silently ignore invalid requests for battle updates
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) break;

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const isWinner = message.data.result.winner === "player";

                if (isWinner) {
                  await rankingService.updateRankAfterMatch(
                    trainerProfile.trainerId,
                    message.data.opponentId,
                    message.data.matchType || "casual"
                  );
                } else {
                  await rankingService.updateRankAfterMatch(
                    message.data.opponentId,
                    trainerProfile.trainerId,
                    message.data.matchType || "casual"
                  );
                }

                // Get updated rank
                const updatedRank = await rankingService.calculatePlayerRank(
                  trainerProfile.trainerId
                );

                webView.postMessage({
                  type: "rankUpdated",
                  data: { rank: updatedRank },
                });
              } catch (error) {
                // Silently handle errors for battle updates
                console.error("Failed to update rank after battle:", error);
              }
              break;
            }
            case "createGuild": {
              if (!username || !message.data?.config) {
                webView.postMessage({
                  type: "guildError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "guildError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const guild = await guildService.createGuild(
                  trainerProfile.trainerId,
                  message.data.config
                );

                webView.postMessage({
                  type: "guildCreated",
                  data: { guild },
                });
              } catch (error) {
                webView.postMessage({
                  type: "guildError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create guild",
                  },
                });
              }
              break;
            }
            case "joinGuild": {
              if (!username || !message.data?.guildId) {
                webView.postMessage({
                  type: "guildJoinError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "guildJoinError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const success = await guildService.joinGuild(
                  message.data.guildId,
                  trainerProfile.trainerId
                );

                webView.postMessage({
                  type: "guildJoinResult",
                  data: { success, guildId: message.data.guildId },
                });
              } catch (error) {
                webView.postMessage({
                  type: "guildJoinError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to join guild",
                  },
                });
              }
              break;
            }
            case "getGuildsBySubreddit": {
              const subredditId = message.data?.subredditId || "default";
              const guilds = guildService.getGuildsBySubreddit(subredditId);
              const guildStats = guildService.getGuildStats();

              webView.postMessage({
                type: "guildsBySubreddit",
                data: { guilds, stats: guildStats },
              });
              break;
            }
            case "getPlayerGuild": {
              if (!username) {
                webView.postMessage({
                  type: "playerGuildError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "playerGuildError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const guild = guildService.getGuildByTrainer(
                  trainerProfile.trainerId
                );

                webView.postMessage({
                  type: "playerGuild",
                  data: { guild },
                });
              } catch (error) {
                webView.postMessage({
                  type: "playerGuildError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get player guild",
                  },
                });
              }
              break;
            }
            case "startGuildRaid": {
              if (
                !username ||
                !message.data?.guildId ||
                !message.data?.raidConfig
              ) {
                webView.postMessage({
                  type: "raidError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const raid = await guildService.startGuildRaid(
                  message.data.guildId,
                  message.data.raidConfig
                );

                webView.postMessage({
                  type: "guildRaidStarted",
                  data: { raid },
                });
              } catch (error) {
                webView.postMessage({
                  type: "raidError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to start guild raid",
                  },
                });
              }
              break;
            }
            case "createMentorProfile": {
              if (!username || !message.data?.expertise) {
                webView.postMessage({
                  type: "mentorError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "mentorError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const mentorProfile =
                  await mentorshipService.createMentorProfile(
                    trainerProfile.trainerId,
                    message.data.expertise
                  );

                webView.postMessage({
                  type: "mentorProfileCreated",
                  data: { mentorProfile },
                });
              } catch (error) {
                webView.postMessage({
                  type: "mentorError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create mentor profile",
                  },
                });
              }
              break;
            }
            case "requestMentorship": {
              if (
                !username ||
                !message.data?.mentorId ||
                !message.data?.focus
              ) {
                webView.postMessage({
                  type: "mentorshipRequestError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "mentorshipRequestError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const request = await mentorshipService.requestMentorship(
                  trainerProfile.trainerId,
                  message.data.mentorId,
                  message.data.focus
                );

                webView.postMessage({
                  type: "mentorshipRequestSent",
                  data: { request },
                });
              } catch (error) {
                webView.postMessage({
                  type: "mentorshipRequestError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to request mentorship",
                  },
                });
              }
              break;
            }
            case "getMentorRecommendations": {
              if (!username) {
                webView.postMessage({
                  type: "mentorRecommendationsError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "mentorRecommendationsError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const recommendations =
                  await mentorshipService.getMentorRecommendations(
                    trainerProfile.trainerId
                  );

                webView.postMessage({
                  type: "mentorRecommendations",
                  data: { recommendations },
                });
              } catch (error) {
                webView.postMessage({
                  type: "mentorRecommendationsError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get mentor recommendations",
                  },
                });
              }
              break;
            }
            case "getMentorshipStats": {
              const mentorshipStats = mentorshipService.getMentorshipStats();
              const guildStats = guildService.getGuildStats();

              webView.postMessage({
                type: "communityStats",
                data: {
                  mentorship: mentorshipStats,
                  guilds: guildStats,
                },
              });
              break;
            }
            case "createCommunityVote": {
              if (!username || !message.data?.proposal) {
                webView.postMessage({
                  type: "voteError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const vote = await mentorshipService.createCommunityVote(
                  message.data.proposal
                );

                webView.postMessage({
                  type: "communityVoteCreated",
                  data: { vote },
                });
              } catch (error) {
                webView.postMessage({
                  type: "voteError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create community vote",
                  },
                });
              }
              break;
            }
            case "castCommunityVote": {
              if (!username || !message.data?.voteId || !message.data?.choice) {
                webView.postMessage({
                  type: "castVoteError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const profileData = await context.redis.get(
                  `trainer_profile_${username}`
                );
                if (!profileData) {
                  webView.postMessage({
                    type: "castVoteError",
                    data: { error: "Profile not found" },
                  });
                  break;
                }

                const trainerProfile: TrainerProfile = JSON.parse(profileData);
                const success = await mentorshipService.castVote(
                  message.data.voteId,
                  trainerProfile.trainerId,
                  message.data.choice
                );

                webView.postMessage({
                  type: "voteCast",
                  data: { success, voteId: message.data.voteId },
                });
              } catch (error) {
                webView.postMessage({
                  type: "castVoteError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to cast vote",
                  },
                });
              }
              break;
            }
            case "getActiveVotes": {
              const activeVotes = mentorshipService.getActiveVotes();
              const completedVotes = mentorshipService.getCompletedVotes();

              webView.postMessage({
                type: "communityVotes",
                data: { active: activeVotes, completed: completedVotes },
              });
              break;
            }
            case "close":
              // Close the web view when explicitly requested
              webView.unmount();
              break;
            case "createSupportTicket": {
              if (
                !username ||
                !message.data?.subject ||
                !message.data?.description
              ) {
                webView.postMessage({
                  type: "supportTicketError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const ticket = await supportSystem.createTicket({
                  userId: username,
                  username: username,
                  subject: message.data.subject,
                  description: message.data.description,
                  category: message.data.category || "other",
                  tags: message.data.tags || [],
                  metadata: {
                    userAgent: message.data.userAgent,
                    gameVersion: "1.0.0",
                    platform: message.data.platform,
                    sessionId: message.data.sessionId,
                  },
                });

                webView.postMessage({
                  type: "supportTicketCreated",
                  data: { ticket },
                });
              } catch (error) {
                webView.postMessage({
                  type: "supportTicketError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to create ticket",
                  },
                });
              }
              break;
            }
            case "getSupportTickets": {
              if (!username) {
                webView.postMessage({
                  type: "supportTicketsError",
                  data: { error: "User not authenticated" },
                });
                break;
              }

              try {
                const tickets = supportSystem.getUserTickets(username);
                webView.postMessage({
                  type: "supportTickets",
                  data: { tickets },
                });
              } catch (error) {
                webView.postMessage({
                  type: "supportTicketsError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get tickets",
                  },
                });
              }
              break;
            }
            case "getSupportTicket": {
              if (!message.data?.ticketId) {
                webView.postMessage({
                  type: "supportTicketError",
                  data: { error: "Ticket ID required" },
                });
                break;
              }

              try {
                const ticket = supportSystem.getTicket(message.data.ticketId);
                if (!ticket) {
                  webView.postMessage({
                    type: "supportTicketError",
                    data: { error: "Ticket not found" },
                  });
                  break;
                }

                webView.postMessage({
                  type: "supportTicket",
                  data: { ticket },
                });
              } catch (error) {
                webView.postMessage({
                  type: "supportTicketError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get ticket",
                  },
                });
              }
              break;
            }
            case "addSupportResponse": {
              if (
                !username ||
                !message.data?.ticketId ||
                !message.data?.content
              ) {
                webView.postMessage({
                  type: "supportResponseError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const success = await supportSystem.addResponse(
                  message.data.ticketId,
                  {
                    authorId: username,
                    authorType: "user",
                    content: message.data.content,
                    attachments: message.data.attachments || [],
                  }
                );

                if (success) {
                  const ticket = supportSystem.getTicket(message.data.ticketId);
                  webView.postMessage({
                    type: "supportResponseAdded",
                    data: { ticket },
                  });
                } else {
                  webView.postMessage({
                    type: "supportResponseError",
                    data: { error: "Failed to add response" },
                  });
                }
              } catch (error) {
                webView.postMessage({
                  type: "supportResponseError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to add response",
                  },
                });
              }
              break;
            }
            case "searchFAQs": {
              const query = message.data?.query || "";
              const category = message.data?.category;

              try {
                const faqs = query
                  ? supportSystem.searchFAQs(query)
                  : supportSystem.getFAQs(category);

                webView.postMessage({
                  type: "faqResults",
                  data: { faqs, query, category },
                });
              } catch (error) {
                webView.postMessage({
                  type: "faqError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to search FAQs",
                  },
                });
              }
              break;
            }
            case "rateFAQ": {
              if (!message.data?.faqId || message.data?.helpful === undefined) {
                webView.postMessage({
                  type: "faqRatingError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const success = supportSystem.rateFAQ(
                  message.data.faqId,
                  message.data.helpful
                );
                webView.postMessage({
                  type: "faqRated",
                  data: { success },
                });
              } catch (error) {
                webView.postMessage({
                  type: "faqRatingError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to rate FAQ",
                  },
                });
              }
              break;
            }
            case "submitUserReport": {
              if (
                !username ||
                !message.data?.targetUserId ||
                !message.data?.category
              ) {
                webView.postMessage({
                  type: "reportError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const report = await moderationSystem.submitReport({
                  reporterId: username,
                  reporterUsername: username,
                  targetUserId: message.data.targetUserId,
                  targetUsername: message.data.targetUsername || "Unknown User",
                  category: message.data.category,
                  description: message.data.description || "",
                  evidence: message.data.evidence || {},
                });

                webView.postMessage({
                  type: "reportSubmitted",
                  data: { report },
                });
              } catch (error) {
                webView.postMessage({
                  type: "reportError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to submit report",
                  },
                });
              }
              break;
            }
            case "moderateContent": {
              if (!message.data?.content || !message.data?.userId) {
                webView.postMessage({
                  type: "moderationError",
                  data: { error: "Invalid request" },
                });
                break;
              }

              try {
                const result = await moderationSystem.moderateContent(
                  message.data.content,
                  message.data.userId,
                  message.data.contentType || "chat"
                );

                webView.postMessage({
                  type: "moderationResult",
                  data: result,
                });
              } catch (error) {
                webView.postMessage({
                  type: "moderationError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to moderate content",
                  },
                });
              }
              break;
            }
            case "getUserRestrictions": {
              if (!message.data?.userId) {
                webView.postMessage({
                  type: "restrictionsError",
                  data: { error: "User ID required" },
                });
                break;
              }

              try {
                const restrictions = moderationSystem.getUserRestrictions(
                  message.data.userId
                );
                webView.postMessage({
                  type: "userRestrictions",
                  data: restrictions,
                });
              } catch (error) {
                webView.postMessage({
                  type: "restrictionsError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get restrictions",
                  },
                });
              }
              break;
            }
            case "getSupportStats": {
              // Only allow moderators/admins to access this
              if (!username) {
                webView.postMessage({
                  type: "supportStatsError",
                  data: { error: "Unauthorized" },
                });
                break;
              }

              try {
                const supportStats = supportSystem.getSupportStats();
                const moderationStats = moderationSystem.getModerationStats();

                webView.postMessage({
                  type: "supportStats",
                  data: {
                    support: supportStats,
                    moderation: moderationStats,
                  },
                });
              } catch (error) {
                webView.postMessage({
                  type: "supportStatsError",
                  data: {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Failed to get stats",
                  },
                });
              }
              break;
            }
            default:
              console.error(`Unknown message type: ${messageType}`, message);
          }
        } catch (error) {
          console.error("Error processing message:", error, message);
        }
      },
      onUnmount() {
        context.ui.showToast("Web view closed!");
      },
    });

    // Render the custom post type with game interface
    return (
      <vstack grow padding="none">
        <vstack grow padding="large" gap="large" alignment="top center">
          {/* Game Header */}
          <vstack
            alignment="middle center"
            padding="medium"
            gap="small"
            backgroundColor="#FF6B35"
            cornerRadius="large"
          >
            <text size="xlarge" weight="bold" color="white">
              🐾{" "}
              {puzzle
                ? `${puzzle.emoji} UpPaws Animal Trainer`
                : "UpPaws Animal Trainer"}
            </text>
            <text size="medium" color="rgba(255,255,255,0.9)">
              Professional Animal Training RPG
            </text>
          </vstack>

          {/* Player Stats HUD */}
          <hstack gap="small" alignment="center middle">
            <hstack
              borderRadius="full"
              padding="small"
              backgroundColor="#FF6B35"
              gap="xsmall"
              alignment="center middle"
            >
              <image
                url="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png"
                size="xsmall"
              />
              <text size="small" weight="bold" color="white">
                u/{username ?? "anonymous"}
              </text>
            </hstack>
            <hstack
              borderRadius="full"
              padding="small"
              backgroundColor="#FFD700"
              gap="xsmall"
              alignment="center middle"
            >
              <text size="small" weight="bold" color="#1A202C">
                ⭐ {score ?? "0"}
              </text>
            </hstack>
            <hstack
              borderRadius="full"
              padding="small"
              backgroundColor="#4ECDC4"
              gap="xsmall"
              alignment="center middle"
            >
              <text size="small" weight="bold" color="white">
                🔥 {streak ?? "0"}
              </text>
            </hstack>
          </hstack>

          {/* Game Interface */}
          <vstack
            borderRadius="large"
            padding="large"
            gap="large"
            backgroundColor="rgba(255,255,255,0.95)"
            width="full"
            alignment="middle center"
          >
            <vstack alignment="middle center" gap="medium">
              <text weight="bold" size="xlarge" color="#2D3748">
                {puzzle
                  ? `${puzzle.emoji} Daily Animal Challenge`
                  : "🎮 Loading Game..."}
              </text>
              <text size="medium" alignment="center" color="#4A5568">
                {puzzle
                  ? "Solve the puzzle to capture this amazing animal!"
                  : "Preparing your gaming experience..."}
              </text>
            </vstack>

            {/* Game Action */}
            <vstack alignment="middle center" gap="medium">
              <button
                appearance="primary"
                size="large"
                onPress={() => webView.mount()}
              >
                🎮 Play Now
              </button>
              <text size="small" alignment="center" color="#718096">
                Click to start the full game experience
              </text>
            </vstack>
          </vstack>

          {/* Footer */}
          <text size="xsmall" alignment="center" color="#718096">
            Built for Reddit Hackathon — UpPaws Animal Trainer RPG
          </text>
        </vstack>
      </vstack>
    );
  },
});
export default Devvit;
