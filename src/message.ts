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
        trainerProfile?: {
          level: number;
          experience: number;
          currency: {
            pawCoins: number;
            researchPoints: number;
            battleTokens: number;
          };
          inventory: Array<{
            id: string;
            name: string;
            quantity: number;
            type: string;
            rarity: string;
          }>;
          premiumTier: string;
        };
        dailyReward?: {
          day: number;
          currency: {
            pawCoins: number;
            researchPoints: number;
            battleTokens: number;
          };
          items: Array<any>;
          bonusMultiplier: number;
        };
        sessionId?: string;
        worldMap?: {
          regions: Array<any>;
          hiddenAreas: Array<any>;
          trainerLocation: { x: number; y: number; width: number; height: number };
          weatherConditions: Array<any>;
          activeEvents: Array<any>;
        };
        availableHabitats?: Array<any>;
        dailyExpeditions?: Array<any>;
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
    }
  | {
      type: 'purchaseResult';
      data: {
        success: boolean;
        error?: string;
        currency?: {
          pawCoins: number;
          researchPoints: number;
          battleTokens: number;
        };
        inventory?: Array<any>;
      };
    }
  | {
      type: 'premiumResult';
      data: {
        success: boolean;
        error?: string;
        premiumTier?: string;
        currency?: {
          pawCoins: number;
          researchPoints: number;
          battleTokens: number;
        };
      };
    }
  | {
      type: 'cosmeticResult';
      data: {
        success: boolean;
        error?: string;
        unlockedCosmetics?: string[];
        currency?: {
          pawCoins: number;
          researchPoints: number;
          battleTokens: number;
        };
      };
    }
  | {
      type: 'cosmeticStore';
      data: {
        items: Array<{
          id: string;
          name: string;
          description: string;
          category: string;
          rarity: string;
          price: {
            pawCoins: number;
            researchPoints: number;
            battleTokens: number;
          };
          premiumOnly: boolean;
        }>;
      };
    }
  | {
      type: 'useItemResult';
      data: {
        success: boolean;
        error?: string;
        inventory?: Array<any>;
      };
    }
  | {
      type: 'worldMapData';
      data: {
        regions: Array<any>;
        hiddenAreas: Array<any>;
        trainerLocation: { x: number; y: number; width: number; height: number };
        weatherConditions: Array<any>;
        activeEvents: Array<any>;
      };
    }
  | {
      type: 'worldMapError';
      data: { error: string };
    }
  | {
      type: 'habitatInfo';
      data: {
        habitat: any;
        weather: any;
        forecast: any;
      };
    }
  | {
      type: 'habitatInfoError';
      data: { error: string };
    }
  | {
      type: 'explorationResult';
      data: {
        result: any;
        updatedCurrency: {
          pawCoins: number;
          researchPoints: number;
          battleTokens: number;
        };
      };
    }
  | {
      type: 'explorationError';
      data: { error: string };
    }
  | {
      type: 'dailyExpeditions';
      data: { expeditions: Array<any> };
    }
  | {
      type: 'expeditionsError';
      data: { error: string };
    }
  | {
      type: 'expeditionResult';
      data: any;
    }
  | {
      type: 'expeditionError';
      data: { error: string };
    }
  | {
      type: 'weatherForecast';
      data: {
        forecast: any;
        currentWeather: any;
      };
    }
  | {
      type: 'weatherError';
      data: { error: string };
    }
  | {
      type: 'discoveryResult';
      data: any;
    }
  | {
      type: 'discoveryError';
      data: { error: string };
    }
  | {
      type: 'educationalPartners';
      data: { organizations: Array<any> };
    }
  | {
      type: 'sponsoredContent';
      data: { content: Array<any> };
    }
  | {
      type: 'sponsoredContentError';
      data: { error: string };
    }
  | {
      type: 'contentCompletionResult';
      data: {
        success: boolean;
        rewards: Array<any>;
        impactPoints: number;
      };
    }
  | {
      type: 'contentCompletionError';
      data: { error: string };
    }
  | {
      type: 'conservationImpact';
      data: {
        personalImpact: Array<any>;
        globalImpact: {
          totalDonations: number;
          totalActivities: number;
          totalResearchContributions: number;
          totalImpactScore: number;
        };
      };
    }
  | {
      type: 'conservationImpactError';
      data: { error: string };
    }
  | {
      type: 'expertAMAs';
      data: { amas: Array<any> };
    }
  | {
      type: 'amaQuestionResult';
      data: { success: boolean };
    }
  | {
      type: 'amaQuestionError';
      data: { error: string };
    }
  | {
      type: 'citizenScienceProjects';
      data: { projects: Array<any> };
    }
  | {
      type: 'dataContributionResult';
      data: { success: boolean };
    }
  | {
      type: 'dataContributionError';
      data: { error: string };
    }
  | {
      type: 'trainerContributions';
      data: { contributions: Array<any> };
    }
  | {
      type: 'contributionsError';
      data: { error: string };
    };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'submitGuess'; data: { guess: string; secondsTaken: number; usedHint: boolean } }
  | { type: 'close' }
  | { type: 'getArcadePuzzle'; data?: { difficulty?: number } }
  | { type: 'arcadeGameOver'; data: { finalScore: number } }
  | { type: 'getLeaderboard' }
  | { type: 'purchaseItem'; data: { itemId: string; quantity?: number; sessionId?: string } }
  | { type: 'purchasePremium'; data: { tier: string; duration?: number; sessionId?: string } }
  | { type: 'purchaseCosmetic'; data: { cosmeticId: string; sessionId?: string } }
  | { type: 'getCosmeticStore' }
  | { type: 'useItem'; data: { itemId: string; quantity?: number; context?: string; sessionId?: string } }
  | { type: 'getWorldMap' }
  | { type: 'getHabitatInfo'; data: { habitatId: string } }
  | { type: 'exploreHabitat'; data: { habitatId: string; expeditionType?: 'normal' | 'extended' } }
  | { type: 'getDailyExpeditions' }
  | { type: 'startExpedition'; data: { expeditionId: string } }
  | { type: 'getWeatherForecast'; data: { habitatId: string } }
  | { type: 'discoverHiddenArea'; data: { areaId: string } }
  | { type: 'getEducationalPartners' }
  | { type: 'getSponsoredContent' }
  | { type: 'completeSponsoredContent'; data: { contentId: string; completionData?: any } }
  | { type: 'getConservationImpact' }
  | { type: 'getExpertAMAs' }
  | { type: 'submitAMAQuestion'; data: { amaId: string; question: string } }
  | { type: 'getCitizenScienceProjects' }
  | { type: 'submitDataContribution'; data: { projectId: string; dataType: string; data: any; location?: string } }
  | { type: 'getTrainerContributions' };

/**
 * Web view MessageEvent listener data type. The Devvit API wraps all messages
 * from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};