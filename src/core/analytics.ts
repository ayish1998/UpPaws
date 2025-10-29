import { TrainerProfile } from '../types/trainer.js';
import { Currency } from '../types/common.js';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: EventType;
  timestamp: Date;
  properties: Record<string, any>;
  sessionId: string;
}

export enum EventType {
  // User engagement
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  
  // Game actions
  PUZZLE_STARTED = 'puzzle_started',
  PUZZLE_COMPLETED = 'puzzle_completed',
  PUZZLE_FAILED = 'puzzle_failed',
  ANIMAL_CAPTURED = 'animal_captured',
  BATTLE_STARTED = 'battle_started',
  BATTLE_COMPLETED = 'battle_completed',
  
  // Economy
  CURRENCY_EARNED = 'currency_earned',
  CURRENCY_SPENT = 'currency_spent',
  ITEM_PURCHASED = 'item_purchased',
  ITEM_USED = 'item_used',
  ITEM_CRAFTED = 'item_crafted',
  
  // Premium features
  PREMIUM_PURCHASED = 'premium_purchased',
  PREMIUM_CANCELLED = 'premium_cancelled',
  COSMETIC_PURCHASED = 'cosmetic_purchased',
  TOURNAMENT_PASS_PURCHASED = 'tournament_pass_purchased',
  
  // Social features
  FRIEND_ADDED = 'friend_added',
  TRADE_INITIATED = 'trade_initiated',
  TRADE_COMPLETED = 'trade_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  
  // A/B Testing
  AB_TEST_ASSIGNED = 'ab_test_assigned',
  AB_TEST_CONVERTED = 'ab_test_converted'
}

export interface UserMetrics {
  userId: string;
  totalSessions: number;
  totalPlayTime: number;
  lastActiveDate: Date;
  retentionDay1: boolean;
  retentionDay7: boolean;
  retentionDay30: boolean;
  lifetimeValue: number;
  conversionEvents: string[];
  engagementScore: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  premiumSubscriptions: number;
  cosmeticPurchases: number;
  tournamentPasses: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  churnRate: number;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionLength: number;
  averageSessionsPerUser: number;
  puzzleCompletionRate: number;
  battleParticipationRate: number;
}

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate: Date;
  targetMetric: string;
  isActive: boolean;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

export interface ABTestAssignment {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
}

export class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private userMetrics: Map<string, UserMetrics> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private abAssignments: Map<string, ABTestAssignment[]> = new Map();

  // Event tracking
  trackEvent(
    userId: string,
    eventType: EventType,
    properties: Record<string, any> = {},
    sessionId: string
  ): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      userId,
      eventType,
      timestamp: new Date(),
      properties,
      sessionId
    };

    this.events.push(event);
    this.updateUserMetrics(userId, event);
  }

  // User engagement tracking
  trackUserLogin(userId: string, sessionId: string): void {
    this.trackEvent(userId, EventType.USER_LOGIN, {
      loginMethod: 'reddit',
      deviceType: this.getDeviceType()
    }, sessionId);
  }

  trackPuzzleCompletion(
    userId: string,
    sessionId: string,
    puzzleType: string,
    timeToComplete: number,
    hintsUsed: number,
    success: boolean
  ): void {
    this.trackEvent(userId, success ? EventType.PUZZLE_COMPLETED : EventType.PUZZLE_FAILED, {
      puzzleType,
      timeToComplete,
      hintsUsed,
      difficulty: this.calculatePuzzleDifficulty(puzzleType, timeToComplete)
    }, sessionId);
  }

  trackCurrencyTransaction(
    userId: string,
    sessionId: string,
    transactionType: 'earned' | 'spent',
    currency: Currency,
    source: string
  ): void {
    this.trackEvent(userId, transactionType === 'earned' ? EventType.CURRENCY_EARNED : EventType.CURRENCY_SPENT, {
      pawCoins: currency.pawCoins,
      researchPoints: currency.researchPoints,
      battleTokens: currency.battleTokens,
      source,
      totalValue: this.calculateCurrencyValue(currency)
    }, sessionId);
  }

  trackPremiumPurchase(
    userId: string,
    sessionId: string,
    tier: string,
    duration: number,
    price: Currency
  ): void {
    this.trackEvent(userId, EventType.PREMIUM_PURCHASED, {
      tier,
      duration,
      price,
      revenue: this.calculateCurrencyValue(price)
    }, sessionId);

    // Update user LTV
    const metrics = this.getUserMetrics(userId);
    metrics.lifetimeValue += this.calculateCurrencyValue(price);
    metrics.conversionEvents.push('premium_purchase');
  }

  // Retention analysis
  calculateRetentionMetrics(userId: string): { day1: boolean; day7: boolean; day30: boolean } {
    const userEvents = this.events.filter(e => e.userId === userId);
    if (userEvents.length === 0) {
      return { day1: false, day7: false, day30: false };
    }

    const firstLogin = userEvents.find(e => e.eventType === EventType.USER_LOGIN);
    if (!firstLogin) {
      return { day1: false, day7: false, day30: false };
    }

    const firstLoginDate = firstLogin.timestamp;
    const day1 = new Date(firstLoginDate);
    day1.setDate(day1.getDate() + 1);
    const day7 = new Date(firstLoginDate);
    day7.setDate(day7.getDate() + 7);
    const day30 = new Date(firstLoginDate);
    day30.setDate(day30.getDate() + 30);

    const hasDay1Activity = userEvents.some(e => 
      e.timestamp >= day1 && e.timestamp < new Date(day1.getTime() + 24 * 60 * 60 * 1000)
    );
    const hasDay7Activity = userEvents.some(e => 
      e.timestamp >= day7 && e.timestamp < new Date(day7.getTime() + 24 * 60 * 60 * 1000)
    );
    const hasDay30Activity = userEvents.some(e => 
      e.timestamp >= day30 && e.timestamp < new Date(day30.getTime() + 24 * 60 * 60 * 1000)
    );

    return {
      day1: hasDay1Activity,
      day7: hasDay7Activity,
      day30: hasDay30Activity
    };
  }

  // Revenue analytics
  calculateRevenueMetrics(startDate: Date, endDate: Date): RevenueMetrics {
    const revenueEvents = this.events.filter(e => 
      e.timestamp >= startDate && 
      e.timestamp <= endDate &&
      [EventType.PREMIUM_PURCHASED, EventType.COSMETIC_PURCHASED, EventType.TOURNAMENT_PASS_PURCHASED].includes(e.eventType)
    );

    const totalRevenue = revenueEvents.reduce((sum, event) => {
      return sum + (event.properties.revenue || 0);
    }, 0);

    const premiumSubscriptions = revenueEvents.filter(e => e.eventType === EventType.PREMIUM_PURCHASED).length;
    const cosmeticPurchases = revenueEvents.filter(e => e.eventType === EventType.COSMETIC_PURCHASED).length;
    const tournamentPasses = revenueEvents.filter(e => e.eventType === EventType.TOURNAMENT_PASS_PURCHASED).length;

    const uniqueUsers = new Set(revenueEvents.map(e => e.userId)).size;
    const totalUsers = new Set(this.events.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    ).map(e => e.userId)).size;

    return {
      totalRevenue,
      premiumSubscriptions,
      cosmeticPurchases,
      tournamentPasses,
      averageRevenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
      conversionRate: totalUsers > 0 ? uniqueUsers / totalUsers : 0,
      churnRate: this.calculateChurnRate(startDate, endDate)
    };
  }

  // Engagement analytics
  calculateEngagementMetrics(date: Date): EngagementMetrics {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(date);
    monthStart.setDate(monthStart.getDate() - 30);

    const dailyUsers = new Set(this.events.filter(e => 
      e.timestamp >= dayStart && e.timestamp <= dayEnd
    ).map(e => e.userId)).size;

    const weeklyUsers = new Set(this.events.filter(e => 
      e.timestamp >= weekStart && e.timestamp <= dayEnd
    ).map(e => e.userId)).size;

    const monthlyUsers = new Set(this.events.filter(e => 
      e.timestamp >= monthStart && e.timestamp <= dayEnd
    ).map(e => e.userId)).size;

    const sessions = this.calculateSessionMetrics(dayStart, dayEnd);
    const puzzleMetrics = this.calculatePuzzleMetrics(dayStart, dayEnd);
    const battleMetrics = this.calculateBattleMetrics(dayStart, dayEnd);

    return {
      dailyActiveUsers: dailyUsers,
      weeklyActiveUsers: weeklyUsers,
      monthlyActiveUsers: monthlyUsers,
      averageSessionLength: sessions.averageLength,
      averageSessionsPerUser: sessions.averagePerUser,
      puzzleCompletionRate: puzzleMetrics.completionRate,
      battleParticipationRate: battleMetrics.participationRate
    };
  }

  // A/B Testing framework
  createABTest(config: ABTestConfig): void {
    this.abTests.set(config.testId, config);
  }

  assignUserToABTest(userId: string, testId: string): string | null {
    const test = this.abTests.get(testId);
    if (!test || !test.isActive || new Date() > test.endDate) {
      return null;
    }

    // Check if user is already assigned
    const userAssignments = this.abAssignments.get(userId) || [];
    const existingAssignment = userAssignments.find(a => a.testId === testId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Assign user to variant based on weights
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        const assignment: ABTestAssignment = {
          userId,
          testId,
          variantId: variant.id,
          assignedAt: new Date()
        };

        if (!this.abAssignments.has(userId)) {
          this.abAssignments.set(userId, []);
        }
        this.abAssignments.get(userId)!.push(assignment);

        this.trackEvent(userId, EventType.AB_TEST_ASSIGNED, {
          testId,
          variantId: variant.id
        }, this.generateSessionId());

        return variant.id;
      }
    }

    return null;
  }

  trackABTestConversion(userId: string, testId: string, conversionValue?: number): void {
    const userAssignments = this.abAssignments.get(userId) || [];
    const assignment = userAssignments.find(a => a.testId === testId);
    
    if (assignment) {
      this.trackEvent(userId, EventType.AB_TEST_CONVERTED, {
        testId,
        variantId: assignment.variantId,
        conversionValue: conversionValue || 1
      }, this.generateSessionId());
    }
  }

  getABTestResults(testId: string): ABTestResults | null {
    const test = this.abTests.get(testId);
    if (!test) {
      return null;
    }

    const assignments = Array.from(this.abAssignments.values())
      .flat()
      .filter(a => a.testId === testId);

    const conversions = this.events.filter(e => 
      e.eventType === EventType.AB_TEST_CONVERTED && 
      e.properties.testId === testId
    );

    const results: ABTestResults = {
      testId,
      variants: test.variants.map(variant => {
        const variantAssignments = assignments.filter(a => a.variantId === variant.id);
        const variantConversions = conversions.filter(e => e.properties.variantId === variant.id);
        
        return {
          variantId: variant.id,
          name: variant.name,
          assignments: variantAssignments.length,
          conversions: variantConversions.length,
          conversionRate: variantAssignments.length > 0 ? variantConversions.length / variantAssignments.length : 0,
          averageValue: variantConversions.reduce((sum, e) => sum + (e.properties.conversionValue || 0), 0) / variantConversions.length || 0
        };
      }),
      totalAssignments: assignments.length,
      totalConversions: conversions.length,
      overallConversionRate: assignments.length > 0 ? conversions.length / assignments.length : 0
    };

    return results;
  }

  // Helper methods
  private updateUserMetrics(userId: string, event: AnalyticsEvent): void {
    let metrics = this.userMetrics.get(userId);
    if (!metrics) {
      metrics = {
        userId,
        totalSessions: 0,
        totalPlayTime: 0,
        lastActiveDate: new Date(),
        retentionDay1: false,
        retentionDay7: false,
        retentionDay30: false,
        lifetimeValue: 0,
        conversionEvents: [],
        engagementScore: 0
      };
      this.userMetrics.set(userId, metrics);
    }

    metrics.lastActiveDate = event.timestamp;
    
    if (event.eventType === EventType.SESSION_START) {
      metrics.totalSessions++;
    }

    // Update engagement score based on event type
    const engagementPoints: Record<EventType, number> = {
      [EventType.USER_LOGIN]: 1,
      [EventType.PUZZLE_COMPLETED]: 3,
      [EventType.ANIMAL_CAPTURED]: 5,
      [EventType.BATTLE_COMPLETED]: 4,
      [EventType.PREMIUM_PURCHASED]: 10,
      [EventType.FRIEND_ADDED]: 2,
      [EventType.ACHIEVEMENT_UNLOCKED]: 3
    } as any;

    metrics.engagementScore += engagementPoints[event.eventType] || 0;
  }

  private calculateSessionMetrics(startDate: Date, endDate: Date): { averageLength: number; averagePerUser: number } {
    const sessionEvents = this.events.filter(e => 
      e.timestamp >= startDate && 
      e.timestamp <= endDate &&
      [EventType.SESSION_START, EventType.SESSION_END].includes(e.eventType)
    );

    // Group by session ID
    const sessions = new Map<string, { start?: Date; end?: Date }>();
    
    sessionEvents.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, {});
      }
      
      const session = sessions.get(event.sessionId)!;
      if (event.eventType === EventType.SESSION_START) {
        session.start = event.timestamp;
      } else if (event.eventType === EventType.SESSION_END) {
        session.end = event.timestamp;
      }
    });

    const completeSessions = Array.from(sessions.values()).filter(s => s.start && s.end);
    const totalDuration = completeSessions.reduce((sum, session) => {
      return sum + (session.end!.getTime() - session.start!.getTime());
    }, 0);

    const uniqueUsers = new Set(sessionEvents.map(e => e.userId)).size;

    return {
      averageLength: completeSessions.length > 0 ? totalDuration / completeSessions.length / 1000 : 0, // in seconds
      averagePerUser: uniqueUsers > 0 ? sessions.size / uniqueUsers : 0
    };
  }

  private calculatePuzzleMetrics(startDate: Date, endDate: Date): { completionRate: number } {
    const puzzleEvents = this.events.filter(e => 
      e.timestamp >= startDate && 
      e.timestamp <= endDate &&
      [EventType.PUZZLE_STARTED, EventType.PUZZLE_COMPLETED, EventType.PUZZLE_FAILED].includes(e.eventType)
    );

    const started = puzzleEvents.filter(e => e.eventType === EventType.PUZZLE_STARTED).length;
    const completed = puzzleEvents.filter(e => e.eventType === EventType.PUZZLE_COMPLETED).length;

    return {
      completionRate: started > 0 ? completed / started : 0
    };
  }

  private calculateBattleMetrics(startDate: Date, endDate: Date): { participationRate: number } {
    const allUsers = new Set(this.events.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    ).map(e => e.userId)).size;

    const battleUsers = new Set(this.events.filter(e => 
      e.timestamp >= startDate && 
      e.timestamp <= endDate &&
      e.eventType === EventType.BATTLE_STARTED
    ).map(e => e.userId)).size;

    return {
      participationRate: allUsers > 0 ? battleUsers / allUsers : 0
    };
  }

  private calculateChurnRate(startDate: Date, endDate: Date): number {
    // Simplified churn calculation - users who were active in previous period but not current
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDate.getDate() - startDate.getDate()));
    
    const previousUsers = new Set(this.events.filter(e => 
      e.timestamp >= previousPeriodStart && e.timestamp < startDate
    ).map(e => e.userId));

    const currentUsers = new Set(this.events.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    ).map(e => e.userId));

    const churnedUsers = Array.from(previousUsers).filter(userId => !currentUsers.has(userId));
    
    return previousUsers.size > 0 ? churnedUsers.length / previousUsers.size : 0;
  }

  private calculatePuzzleDifficulty(puzzleType: string, timeToComplete: number): string {
    if (timeToComplete < 30) return 'easy';
    if (timeToComplete < 60) return 'medium';
    if (timeToComplete < 120) return 'hard';
    return 'expert';
  }

  private calculateCurrencyValue(currency: Currency): number {
    // Convert all currency to a standard value (e.g., pawCoins equivalent)
    return currency.pawCoins + (currency.researchPoints * 5) + (currency.battleTokens * 10);
  }

  private getUserMetrics(userId: string): UserMetrics {
    let metrics = this.userMetrics.get(userId);
    if (!metrics) {
      metrics = {
        userId,
        totalSessions: 0,
        totalPlayTime: 0,
        lastActiveDate: new Date(),
        retentionDay1: false,
        retentionDay7: false,
        retentionDay30: false,
        lifetimeValue: 0,
        conversionEvents: [],
        engagementScore: 0
      };
      this.userMetrics.set(userId, metrics);
    }
    return metrics;
  }

  private getDeviceType(): string {
    // This would be determined from user agent or device info
    return 'mobile'; // Simplified for demo
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface ABTestResults {
  testId: string;
  variants: {
    variantId: string;
    name: string;
    assignments: number;
    conversions: number;
    conversionRate: number;
    averageValue: number;
  }[];
  totalAssignments: number;
  totalConversions: number;
  overallConversionRate: number;
}