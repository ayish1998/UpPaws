import { AnalyticsManager, EventType } from './analytics.js';
import { AnalyticsDashboard, DashboardMetrics } from './analytics-dashboard.js';
import { MonitoringSystem, MonitoringAlert, HealthCheck } from './monitoring-system.js';
import { EconomyIntegrationService } from './economy-integration.js';
import { TrainerProfile } from '../types/trainer.js';

export interface AnalyticsIntegrationConfig {
  enableRealTimeTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorReporting: boolean;
  dashboardRefreshInterval: number;
  retentionPeriod: number; // days
}

export interface GameMetrics {
  playerMetrics: PlayerMetrics;
  gameplayMetrics: GameplayMetrics;
  economyMetrics: EconomyMetrics;
  socialMetrics: SocialMetrics;
  technicalMetrics: TechnicalMetrics;
}

export interface PlayerMetrics {
  totalPlayers: number;
  activePlayersToday: number;
  newPlayersToday: number;
  averageSessionLength: number;
  playerRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  playerLevels: Record<string, number>;
  engagementScore: number;
}

export interface GameplayMetrics {
  puzzlesCompleted: number;
  puzzleCompletionRate: number;
  averagePuzzleTime: number;
  battlesStarted: number;
  battleCompletionRate: number;
  animalsDiscovered: number;
  tradingActivity: number;
  tournamentParticipation: number;
}

export interface EconomyMetrics {
  totalRevenue: number;
  premiumConversions: number;
  averageRevenuePerUser: number;
  itemPurchases: number;
  currencyCirculation: {
    pawCoins: number;
    researchPoints: number;
    battleTokens: number;
  };
  economicHealth: number;
}

export interface SocialMetrics {
  friendConnections: number;
  tradesCompleted: number;
  communityPosts: number;
  achievementsShared: number;
  guildActivity: number;
  mentorshipConnections: number;
}

export interface TechnicalMetrics {
  systemHealth: 'healthy' | 'warning' | 'critical';
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  activeAlerts: number;
  performanceScore: number;
}

export class AnalyticsIntegrationService {
  private analyticsManager: AnalyticsManager;
  private dashboard: AnalyticsDashboard;
  private monitoring: MonitoringSystem;
  private economyService: EconomyIntegrationService;
  private config: AnalyticsIntegrationConfig;
  private isInitialized: boolean = false;

  constructor(economyService: EconomyIntegrationService, config?: Partial<AnalyticsIntegrationConfig>) {
    this.economyService = economyService;
    this.analyticsManager = economyService.getAnalyticsManager();
    this.dashboard = new AnalyticsDashboard(this.analyticsManager);
    this.monitoring = new MonitoringSystem(this.dashboard, this.analyticsManager);
    
    this.config = {
      enableRealTimeTracking: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      dashboardRefreshInterval: 30000, // 30 seconds
      retentionPeriod: 90, // 90 days
      ...config
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Set up real-time tracking
    if (this.config.enableRealTimeTracking) {
      this.startRealTimeTracking();
    }

    // Set up performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.startPerformanceTracking();
    }

    // Set up error reporting
    if (this.config.enableErrorReporting) {
      this.setupErrorReporting();
    }

    this.isInitialized = true;
  }

  // Game event tracking methods
  trackPlayerLogin(userId: string, sessionId: string, deviceInfo?: Record<string, any>): void {
    this.analyticsManager.trackUserLogin(userId, sessionId);
    
    if (deviceInfo) {
      this.analyticsManager.trackEvent(userId, EventType.SESSION_START, {
        deviceType: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screenResolution: deviceInfo.screenResolution
      }, sessionId);
    }
  }

  trackPuzzleActivity(
    userId: string, 
    sessionId: string, 
    puzzleType: string, 
    result: 'completed' | 'failed' | 'abandoned',
    timeSpent: number,
    hintsUsed: number,
    difficulty?: string
  ): void {
    this.analyticsManager.trackPuzzleCompletion(
      userId,
      sessionId,
      puzzleType,
      timeSpent,
      hintsUsed,
      result === 'completed'
    );

    // Track additional puzzle metrics
    this.analyticsManager.trackEvent(userId, EventType.PUZZLE_STARTED, {
      puzzleType,
      difficulty: difficulty || 'normal',
      result,
      timeSpent,
      hintsUsed,
      completionRate: result === 'completed' ? 1 : 0
    }, sessionId);
  }

  trackBattleActivity(
    userId: string,
    sessionId: string,
    battleType: 'wild' | 'trainer' | 'tournament',
    result: 'won' | 'lost' | 'draw' | 'abandoned',
    duration: number,
    opponentId?: string
  ): void {
    this.analyticsManager.trackEvent(userId, EventType.BATTLE_STARTED, {
      battleType,
      opponentId,
      duration
    }, sessionId);

    this.analyticsManager.trackEvent(userId, EventType.BATTLE_COMPLETED, {
      battleType,
      result,
      duration,
      opponentId,
      winRate: result === 'won' ? 1 : 0
    }, sessionId);
  }

  trackAnimalCapture(
    userId: string,
    sessionId: string,
    animalId: string,
    captureMethod: string,
    attempts: number,
    success: boolean
  ): void {
    this.analyticsManager.trackEvent(userId, EventType.ANIMAL_CAPTURED, {
      animalId,
      captureMethod,
      attempts,
      success,
      captureRate: success ? 1 : 0
    }, sessionId);
  }

  trackSocialActivity(
    userId: string,
    sessionId: string,
    activityType: 'friend_add' | 'trade' | 'guild_join' | 'mentorship',
    targetUserId?: string,
    metadata?: Record<string, any>
  ): void {
    let eventType: EventType;
    
    switch (activityType) {
      case 'friend_add':
        eventType = EventType.FRIEND_ADDED;
        break;
      case 'trade':
        eventType = EventType.TRADE_INITIATED;
        break;
      default:
        eventType = EventType.ACHIEVEMENT_UNLOCKED; // Fallback
    }

    this.analyticsManager.trackEvent(userId, eventType, {
      activityType,
      targetUserId,
      ...metadata
    }, sessionId);
  }

  trackEconomyActivity(
    userId: string,
    sessionId: string,
    activityType: 'purchase' | 'earn' | 'spend',
    itemType: string,
    amount: number,
    currency: string
  ): void {
    const eventType = activityType === 'purchase' ? EventType.ITEM_PURCHASED :
                     activityType === 'earn' ? EventType.CURRENCY_EARNED :
                     EventType.CURRENCY_SPENT;

    this.analyticsManager.trackEvent(userId, eventType, {
      itemType,
      amount,
      currency,
      activityType
    }, sessionId);
  }

  // Dashboard and reporting methods
  async getDashboardData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<DashboardMetrics> {
    try {
      return await this.dashboard.getDashboardMetrics(timeRange);
    } catch (error) {
      this.monitoring.reportError(error as Error, { method: 'getDashboardData', timeRange });
      throw error;
    }
  }

  async getGameMetrics(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<GameMetrics> {
    try {
      const dashboardData = await this.getDashboardData(timeRange);
      
      return {
        playerMetrics: {
          totalPlayers: dashboardData.engagement.monthlyActiveUsers,
          activePlayersToday: dashboardData.engagement.dailyActiveUsers,
          newPlayersToday: dashboardData.userBehavior.newUsers,
          averageSessionLength: dashboardData.engagement.averageSessionLength,
          playerRetention: {
            day1: dashboardData.retention.day1Retention,
            day7: dashboardData.retention.day7Retention,
            day30: dashboardData.retention.day30Retention
          },
          playerLevels: this.calculatePlayerLevelDistribution(),
          engagementScore: this.calculateEngagementScore(dashboardData)
        },
        gameplayMetrics: {
          puzzlesCompleted: this.calculatePuzzlesCompleted(timeRange),
          puzzleCompletionRate: dashboardData.engagement.puzzleCompletionRate,
          averagePuzzleTime: this.calculateAveragePuzzleTime(timeRange),
          battlesStarted: this.calculateBattlesStarted(timeRange),
          battleCompletionRate: dashboardData.engagement.battleParticipationRate,
          animalsDiscovered: this.calculateAnimalsDiscovered(timeRange),
          tradingActivity: this.calculateTradingActivity(timeRange),
          tournamentParticipation: this.calculateTournamentParticipation(timeRange)
        },
        economyMetrics: {
          totalRevenue: dashboardData.revenue.totalRevenue,
          premiumConversions: dashboardData.revenue.premiumSubscriptions,
          averageRevenuePerUser: dashboardData.revenue.averageRevenuePerUser,
          itemPurchases: this.calculateItemPurchases(timeRange),
          currencyCirculation: this.calculateCurrencyCirculation(),
          economicHealth: this.calculateEconomicHealth(dashboardData.revenue)
        },
        socialMetrics: {
          friendConnections: this.calculateFriendConnections(timeRange),
          tradesCompleted: this.calculateTradesCompleted(timeRange),
          communityPosts: this.calculateCommunityPosts(timeRange),
          achievementsShared: this.calculateAchievementsShared(timeRange),
          guildActivity: this.calculateGuildActivity(timeRange),
          mentorshipConnections: this.calculateMentorshipConnections(timeRange)
        },
        technicalMetrics: {
          systemHealth: this.monitoring.getSystemStatus().overall,
          averageResponseTime: dashboardData.performance.averageLoadTime,
          errorRate: dashboardData.performance.errorRate,
          uptime: this.calculateUptime(),
          activeAlerts: this.monitoring.getActiveAlerts().length,
          performanceScore: this.calculatePerformanceScore(dashboardData.performance)
        }
      };
    } catch (error) {
      this.monitoring.reportError(error as Error, { method: 'getGameMetrics', timeRange });
      throw error;
    }
  }

  // System health and monitoring
  getSystemHealth(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: Record<string, HealthCheck>;
    alerts: MonitoringAlert[];
    uptime: number;
  } {
    const systemStatus = this.monitoring.getSystemStatus();
    const activeAlerts = this.monitoring.getActiveAlerts();
    
    return {
      overall: systemStatus.overall,
      components: systemStatus.components,
      alerts: activeAlerts,
      uptime: this.calculateUptime()
    };
  }

  // A/B testing integration
  assignUserToTest(userId: string, testId: string): string | null {
    return this.analyticsManager.assignUserToABTest(userId, testId);
  }

  trackTestConversion(userId: string, testId: string, conversionValue?: number): void {
    this.analyticsManager.trackABTestConversion(userId, testId, conversionValue);
  }

  getTestResults(testId: string) {
    return this.analyticsManager.getABTestResults(testId);
  }

  // Real-time tracking
  private startRealTimeTracking(): void {
    // Track real-time user activity
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, this.config.dashboardRefreshInterval);
  }

  private updateRealTimeMetrics(): void {
    // This would collect real-time metrics from various sources
    // For now, we'll simulate the data collection
    const metrics = {
      timestamp: new Date(),
      activeUsers: Math.floor(Math.random() * 1000) + 500,
      activeSessions: Math.floor(Math.random() * 800) + 400,
      currentRevenue: Math.floor(Math.random() * 10000) + 5000
    };

    // Store metrics for dashboard
    this.storeRealTimeMetrics(metrics);
  }

  private storeRealTimeMetrics(metrics: any): void {
    // In production, this would store metrics in a time-series database
    console.log('Real-time metrics:', metrics);
  }

  // Performance tracking
  private startPerformanceTracking(): void {
    // Monitor API response times
    this.monitorApiPerformance();
    
    // Monitor memory and CPU usage
    this.monitorResourceUsage();
  }

  private monitorApiPerformance(): void {
    // This would integrate with actual API monitoring
    setInterval(() => {
      const performanceData = {
        endpoint: '/api/puzzle',
        responseTime: Math.random() * 500 + 50,
        timestamp: new Date()
      };
      
      this.dashboard.logPerformanceMetric({
        averageLoadTime: performanceData.responseTime,
        apiResponseTimes: [],
        errorRate: Math.random() * 0.05,
        crashRate: 0,
        memoryUsage: Math.random() * 80 + 10,
        cpuUsage: Math.random() * 70 + 5
      });
    }, 60000); // Every minute
  }

  private monitorResourceUsage(): void {
    setInterval(() => {
      // Monitor system resources
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = this.getCpuUsage();
      
      if (memoryUsage > 85) {
        this.monitoring.reportError(
          new Error(`High memory usage: ${memoryUsage}%`),
          { type: 'performance', memoryUsage, cpuUsage }
        );
      }
    }, 30000); // Every 30 seconds
  }

  // Error reporting setup
  private setupErrorReporting(): void {
    // Global error handler is set up in MonitoringSystem
    // Additional game-specific error tracking can be added here
  }

  // Utility calculation methods
  private calculatePlayerLevelDistribution(): Record<string, number> {
    // Simulate player level distribution
    return {
      '1-10': 45,
      '11-20': 30,
      '21-30': 15,
      '31-40': 7,
      '41-50': 3
    };
  }

  private calculateEngagementScore(data: DashboardMetrics): number {
    // Calculate overall engagement score based on various metrics
    const sessionScore = Math.min(data.engagement.averageSessionLength / 600, 1) * 25; // Max 25 points for 10+ min sessions
    const retentionScore = data.retention.day7Retention * 25; // Max 25 points for 100% retention
    const activityScore = Math.min(data.engagement.puzzleCompletionRate * 25, 25); // Max 25 points
    const socialScore = Math.min(data.userBehavior.topFeatures.length / 5 * 25, 25); // Max 25 points
    
    return Math.round(sessionScore + retentionScore + activityScore + socialScore);
  }

  private calculatePuzzlesCompleted(timeRange: string): number {
    // This would query actual puzzle completion data
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 1000 * multiplier) + 500 * multiplier;
  }

  private calculateAveragePuzzleTime(timeRange: string): number {
    return Math.random() * 120 + 60; // 60-180 seconds
  }

  private calculateBattlesStarted(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 500 * multiplier) + 200 * multiplier;
  }

  private calculateAnimalsDiscovered(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 200 * multiplier) + 50 * multiplier;
  }

  private calculateTradingActivity(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 100 * multiplier) + 25 * multiplier;
  }

  private calculateTournamentParticipation(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 50 * multiplier) + 10 * multiplier;
  }

  private calculateItemPurchases(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 300 * multiplier) + 100 * multiplier;
  }

  private calculateCurrencyCirculation(): { pawCoins: number; researchPoints: number; battleTokens: number } {
    return {
      pawCoins: Math.floor(Math.random() * 1000000) + 500000,
      researchPoints: Math.floor(Math.random() * 500000) + 250000,
      battleTokens: Math.floor(Math.random() * 200000) + 100000
    };
  }

  private calculateEconomicHealth(revenue: any): number {
    // Calculate economic health score (0-100)
    const revenueScore = Math.min(revenue.totalRevenue / 10000, 1) * 40;
    const conversionScore = revenue.conversionRate * 30;
    const churnScore = (1 - revenue.churnRate) * 30;
    
    return Math.round(revenueScore + conversionScore + churnScore);
  }

  private calculateFriendConnections(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 150 * multiplier) + 50 * multiplier;
  }

  private calculateTradesCompleted(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 80 * multiplier) + 20 * multiplier;
  }

  private calculateCommunityPosts(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 200 * multiplier) + 75 * multiplier;
  }

  private calculateAchievementsShared(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 120 * multiplier) + 40 * multiplier;
  }

  private calculateGuildActivity(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 60 * multiplier) + 15 * multiplier;
  }

  private calculateMentorshipConnections(timeRange: string): number {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    return Math.floor(Math.random() * 30 * multiplier) + 5 * multiplier;
  }

  private calculateUptime(): number {
    // Return uptime in seconds (simulate 99.9% uptime)
    return Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400); // Random downtime up to 1 day
  }

  private calculatePerformanceScore(performance: any): number {
    // Calculate performance score (0-100)
    const loadTimeScore = Math.max(0, 100 - (performance.averageLoadTime / 10)); // Penalty for slow load times
    const errorScore = Math.max(0, 100 - (performance.errorRate * 1000)); // Penalty for errors
    const uptimeScore = 95; // Assume 95% uptime
    
    return Math.round((loadTimeScore + errorScore + uptimeScore) / 3);
  }

  private getMemoryUsage(): number {
    // In Node.js: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100
    return Math.random() * 80 + 10; // 10-90%
  }

  private getCpuUsage(): number {
    // Would use actual CPU monitoring library
    return Math.random() * 70 + 5; // 5-75%
  }

  // Export and reporting
  async exportAnalyticsData(format: 'json' | 'csv' = 'json', timeRange: '7d' | '30d' | '90d' = '30d'): Promise<string> {
    try {
      const data = await this.getDashboardData(timeRange === '7d' ? '7d' : '30d');
      return await this.dashboard.exportDashboardData(format);
    } catch (error) {
      this.monitoring.reportError(error as Error, { method: 'exportAnalyticsData', format, timeRange });
      throw error;
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<AnalyticsIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AnalyticsIntegrationConfig {
    return { ...this.config };
  }
}