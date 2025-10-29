import { AnalyticsManager, EventType, RevenueMetrics, EngagementMetrics, ABTestResults } from './analytics.js';
import { TrainerProfile } from '../types/trainer.js';

export interface DashboardMetrics {
  realTimeMetrics: RealTimeMetrics;
  userBehavior: UserBehaviorMetrics;
  retention: RetentionMetrics;
  revenue: RevenueMetrics;
  engagement: EngagementMetrics;
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  abTests: ABTestResults[];
}

export interface RealTimeMetrics {
  activeUsers: number;
  activeSessions: number;
  puzzlesInProgress: number;
  battlesInProgress: number;
  currentRevenue: number;
  serverHealth: ServerHealthStatus;
  lastUpdated: Date;
}

export interface UserBehaviorMetrics {
  newUsers: number;
  returningUsers: number;
  userJourney: UserJourneyStep[];
  conversionFunnel: ConversionFunnelStep[];
  topFeatures: FeatureUsage[];
  dropOffPoints: DropOffPoint[];
}

export interface RetentionMetrics {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  cohortAnalysis: CohortData[];
  churnPrediction: ChurnPrediction[];
}

export interface PerformanceMetrics {
  averageLoadTime: number;
  apiResponseTimes: ApiResponseTime[];
  errorRate: number;
  crashRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: ErrorByType[];
  criticalErrors: CriticalError[];
  errorTrends: ErrorTrend[];
  topErrorMessages: string[];
}

export interface ServerHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

export interface UserJourneyStep {
  step: string;
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface ConversionFunnelStep {
  step: string;
  users: number;
  dropOffRate: number;
}

export interface FeatureUsage {
  feature: string;
  usage: number;
  uniqueUsers: number;
  averageEngagement: number;
}

export interface DropOffPoint {
  location: string;
  dropOffRate: number;
  users: number;
  commonReasons: string[];
}

export interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskFactors: string[];
  recommendedActions: string[];
}

export interface ApiResponseTime {
  endpoint: string;
  averageTime: number;
  p95Time: number;
  errorRate: number;
}

export interface ErrorByType {
  type: string;
  count: number;
  percentage: number;
}

export interface CriticalError {
  id: string;
  message: string;
  timestamp: Date;
  userId?: string;
  stackTrace: string;
  resolved: boolean;
}

export interface ErrorTrend {
  date: Date;
  errorCount: number;
  errorRate: number;
}

export class AnalyticsDashboard {
  private analyticsManager: AnalyticsManager;
  private realTimeData: Map<string, any> = new Map();
  private performanceData: PerformanceMetrics[] = [];
  private errorLog: CriticalError[] = [];
  private serverMetrics: ServerHealthStatus;

  constructor(analyticsManager: AnalyticsManager) {
    this.analyticsManager = analyticsManager;
    this.serverMetrics = {
      status: 'healthy',
      uptime: 0,
      responseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0
    };
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  // Real-time dashboard data
  async getDashboardMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<DashboardMetrics> {
    const endDate = new Date();
    const startDate = this.getStartDate(endDate, timeRange);

    const [
      realTimeMetrics,
      userBehavior,
      retention,
      revenue,
      engagement,
      performance,
      errors,
      abTests
    ] = await Promise.all([
      this.getRealTimeMetrics(),
      this.getUserBehaviorMetrics(startDate, endDate),
      this.getRetentionMetrics(startDate, endDate),
      this.analyticsManager.calculateRevenueMetrics(startDate, endDate),
      this.analyticsManager.calculateEngagementMetrics(endDate),
      this.getPerformanceMetrics(startDate, endDate),
      this.getErrorMetrics(startDate, endDate),
      this.getABTestResults()
    ]);

    return {
      realTimeMetrics,
      userBehavior,
      retention,
      revenue,
      engagement,
      performance,
      errors,
      abTests
    };
  }

  // Real-time metrics
  private async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      activeUsers: this.realTimeData.get('activeUsers') || 0,
      activeSessions: this.realTimeData.get('activeSessions') || 0,
      puzzlesInProgress: this.realTimeData.get('puzzlesInProgress') || 0,
      battlesInProgress: this.realTimeData.get('battlesInProgress') || 0,
      currentRevenue: this.realTimeData.get('currentRevenue') || 0,
      serverHealth: this.serverMetrics,
      lastUpdated: now
    };
  }

  // User behavior analytics
  private async getUserBehaviorMetrics(startDate: Date, endDate: Date): Promise<UserBehaviorMetrics> {
    const userJourney = this.calculateUserJourney(startDate, endDate);
    const conversionFunnel = this.calculateConversionFunnel(startDate, endDate);
    const topFeatures = this.calculateFeatureUsage(startDate, endDate);
    const dropOffPoints = this.calculateDropOffPoints(startDate, endDate);

    return {
      newUsers: this.calculateNewUsers(startDate, endDate),
      returningUsers: this.calculateReturningUsers(startDate, endDate),
      userJourney,
      conversionFunnel,
      topFeatures,
      dropOffPoints
    };
  }

  // Retention analytics
  private async getRetentionMetrics(startDate: Date, endDate: Date): Promise<RetentionMetrics> {
    const cohortAnalysis = this.calculateCohortAnalysis(startDate, endDate);
    const churnPrediction = this.predictChurn();

    return {
      day1Retention: this.calculateRetentionRate(1),
      day7Retention: this.calculateRetentionRate(7),
      day30Retention: this.calculateRetentionRate(30),
      cohortAnalysis,
      churnPrediction
    };
  }

  // Performance monitoring
  private async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<PerformanceMetrics> {
    const recentMetrics = this.performanceData.filter(m => 
      m.averageLoadTime >= startDate.getTime() && m.averageLoadTime <= endDate.getTime()
    );

    return {
      averageLoadTime: this.calculateAverageLoadTime(recentMetrics),
      apiResponseTimes: this.getApiResponseTimes(),
      errorRate: this.calculateErrorRate(startDate, endDate),
      crashRate: this.calculateCrashRate(startDate, endDate),
      memoryUsage: this.serverMetrics.memoryUsage,
      cpuUsage: this.serverMetrics.cpuUsage
    };
  }

  // Error monitoring
  private async getErrorMetrics(startDate: Date, endDate: Date): Promise<ErrorMetrics> {
    const errors = this.errorLog.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    );

    const errorsByType = this.groupErrorsByType(errors);
    const criticalErrors = errors.filter(e => !e.resolved);
    const errorTrends = this.calculateErrorTrends(startDate, endDate);

    return {
      totalErrors: errors.length,
      errorsByType,
      criticalErrors,
      errorTrends,
      topErrorMessages: this.getTopErrorMessages(errors)
    };
  }

  // A/B test results
  private async getABTestResults(): Promise<ABTestResults[]> {
    const activeTests = ['pricing_optimization_test', 'premium_pricing_test', 'onboarding_flow_test'];
    return activeTests
      .map(testId => this.analyticsManager.getABTestResults(testId))
      .filter(result => result !== null) as ABTestResults[];
  }

  // Real-time monitoring
  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.updateRealTimeMetrics();
      this.updateServerHealth();
    }, 30000); // Update every 30 seconds
  }

  private updateRealTimeMetrics(): void {
    const now = new Date();
    const lastMinute = new Date(now.getTime() - 60 * 1000);

    // Simulate real-time data (in production, this would come from actual monitoring)
    this.realTimeData.set('activeUsers', Math.floor(Math.random() * 1000) + 500);
    this.realTimeData.set('activeSessions', Math.floor(Math.random() * 800) + 400);
    this.realTimeData.set('puzzlesInProgress', Math.floor(Math.random() * 200) + 50);
    this.realTimeData.set('battlesInProgress', Math.floor(Math.random() * 100) + 25);
    this.realTimeData.set('currentRevenue', Math.floor(Math.random() * 10000) + 5000);
  }

  private updateServerHealth(): void {
    // Simulate server health monitoring
    const memoryUsage = Math.random() * 80 + 10; // 10-90%
    const cpuUsage = Math.random() * 70 + 5; // 5-75%
    const responseTime = Math.random() * 200 + 50; // 50-250ms

    this.serverMetrics = {
      status: this.determineHealthStatus(memoryUsage, cpuUsage, responseTime),
      uptime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours uptime
      responseTime,
      memoryUsage,
      cpuUsage,
      activeConnections: Math.floor(Math.random() * 500) + 100
    };
  }

  private determineHealthStatus(memory: number, cpu: number, responseTime: number): 'healthy' | 'warning' | 'critical' {
    if (memory > 85 || cpu > 80 || responseTime > 200) {
      return 'critical';
    }
    if (memory > 70 || cpu > 60 || responseTime > 150) {
      return 'warning';
    }
    return 'healthy';
  }

  // Helper methods for calculations
  private getStartDate(endDate: Date, timeRange: string): Date {
    const start = new Date(endDate);
    switch (timeRange) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }
    return start;
  }

  private calculateNewUsers(startDate: Date, endDate: Date): number {
    // Implementation would count first-time users in the period
    return Math.floor(Math.random() * 100) + 50;
  }

  private calculateReturningUsers(startDate: Date, endDate: Date): number {
    // Implementation would count returning users in the period
    return Math.floor(Math.random() * 200) + 100;
  }

  private calculateUserJourney(startDate: Date, endDate: Date): UserJourneyStep[] {
    return [
      { step: 'Landing', users: 1000, conversionRate: 1.0, averageTime: 30 },
      { step: 'Registration', users: 800, conversionRate: 0.8, averageTime: 120 },
      { step: 'First Puzzle', users: 600, conversionRate: 0.75, averageTime: 180 },
      { step: 'First Battle', users: 400, conversionRate: 0.67, averageTime: 240 },
      { step: 'Premium Signup', users: 80, conversionRate: 0.2, averageTime: 300 }
    ];
  }

  private calculateConversionFunnel(startDate: Date, endDate: Date): ConversionFunnelStep[] {
    return [
      { step: 'Visit', users: 1000, dropOffRate: 0.0 },
      { step: 'Signup', users: 800, dropOffRate: 0.2 },
      { step: 'First Game', users: 600, dropOffRate: 0.25 },
      { step: 'Second Session', users: 400, dropOffRate: 0.33 },
      { step: 'Premium', users: 80, dropOffRate: 0.8 }
    ];
  }

  private calculateFeatureUsage(startDate: Date, endDate: Date): FeatureUsage[] {
    return [
      { feature: 'Daily Puzzle', usage: 850, uniqueUsers: 600, averageEngagement: 4.2 },
      { feature: 'Battle System', usage: 420, uniqueUsers: 300, averageEngagement: 3.8 },
      { feature: 'Animal Collection', usage: 380, uniqueUsers: 280, averageEngagement: 4.5 },
      { feature: 'Trading', usage: 150, uniqueUsers: 120, averageEngagement: 3.2 },
      { feature: 'Tournaments', usage: 80, uniqueUsers: 60, averageEngagement: 4.8 }
    ];
  }

  private calculateDropOffPoints(startDate: Date, endDate: Date): DropOffPoint[] {
    return [
      { 
        location: 'Tutorial Step 3', 
        dropOffRate: 0.25, 
        users: 200, 
        commonReasons: ['Too complex', 'Loading issues', 'Unclear instructions'] 
      },
      { 
        location: 'First Battle', 
        dropOffRate: 0.18, 
        users: 150, 
        commonReasons: ['Difficulty spike', 'Connection issues', 'UI confusion'] 
      },
      { 
        location: 'Premium Signup', 
        dropOffRate: 0.85, 
        users: 680, 
        commonReasons: ['Price concerns', 'Feature unclear', 'Payment issues'] 
      }
    ];
  }

  private calculateCohortAnalysis(startDate: Date, endDate: Date): CohortData[] {
    return [
      { cohort: 'Week 1', size: 1000, retention: [1.0, 0.7, 0.5, 0.4, 0.35] },
      { cohort: 'Week 2', size: 1200, retention: [1.0, 0.75, 0.55, 0.45, 0.38] },
      { cohort: 'Week 3', size: 800, retention: [1.0, 0.72, 0.52, 0.42] },
      { cohort: 'Week 4', size: 900, retention: [1.0, 0.78, 0.58] }
    ];
  }

  private predictChurn(): ChurnPrediction[] {
    return [
      {
        userId: 'user_123',
        churnProbability: 0.85,
        riskFactors: ['Low engagement', 'No premium features', 'Declining session time'],
        recommendedActions: ['Send re-engagement email', 'Offer premium trial', 'Show new features']
      },
      {
        userId: 'user_456',
        churnProbability: 0.72,
        riskFactors: ['Missed daily puzzles', 'No social interactions'],
        recommendedActions: ['Friend recommendations', 'Achievement notifications']
      }
    ];
  }

  private calculateRetentionRate(days: number): number {
    // Simplified calculation - in production would use actual user data
    const baseRate = 0.8;
    const decay = Math.pow(0.95, days - 1);
    return Math.max(0.1, baseRate * decay);
  }

  private calculateAverageLoadTime(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.averageLoadTime, 0) / metrics.length;
  }

  private getApiResponseTimes(): ApiResponseTime[] {
    return [
      { endpoint: '/api/puzzle', averageTime: 120, p95Time: 200, errorRate: 0.02 },
      { endpoint: '/api/battle', averageTime: 180, p95Time: 300, errorRate: 0.05 },
      { endpoint: '/api/user', averageTime: 80, p95Time: 150, errorRate: 0.01 },
      { endpoint: '/api/leaderboard', averageTime: 250, p95Time: 400, errorRate: 0.03 }
    ];
  }

  private calculateErrorRate(startDate: Date, endDate: Date): number {
    const errors = this.errorLog.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    );
    // Simplified calculation
    return errors.length / 10000; // errors per 10k requests
  }

  private calculateCrashRate(startDate: Date, endDate: Date): number {
    const crashes = this.errorLog.filter(e => 
      e.timestamp >= startDate && 
      e.timestamp <= endDate && 
      e.message.includes('crash')
    );
    return crashes.length / 1000; // crashes per 1k sessions
  }

  private groupErrorsByType(errors: CriticalError[]): ErrorByType[] {
    const typeCount = new Map<string, number>();
    errors.forEach(error => {
      const type = this.categorizeError(error.message);
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    const total = errors.length;
    return Array.from(typeCount.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? count / total : 0
    }));
  }

  private categorizeError(message: string): string {
    if (message.includes('network') || message.includes('connection')) return 'Network';
    if (message.includes('timeout')) return 'Timeout';
    if (message.includes('validation')) return 'Validation';
    if (message.includes('auth')) return 'Authentication';
    if (message.includes('database')) return 'Database';
    return 'Other';
  }

  private calculateErrorTrends(startDate: Date, endDate: Date): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayErrors = this.errorLog.filter(e => 
        e.timestamp.toDateString() === current.toDateString()
      );
      
      trends.push({
        date: new Date(current),
        errorCount: dayErrors.length,
        errorRate: dayErrors.length / 1000 // per 1k requests
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return trends;
  }

  private getTopErrorMessages(errors: CriticalError[]): string[] {
    const messageCount = new Map<string, number>();
    errors.forEach(error => {
      messageCount.set(error.message, (messageCount.get(error.message) || 0) + 1);
    });

    return Array.from(messageCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message]) => message);
  }

  // Public methods for logging errors and performance
  logError(error: Omit<CriticalError, 'id' | 'timestamp' | 'resolved'>): void {
    const criticalError: CriticalError = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false
    };
    
    this.errorLog.push(criticalError);
    
    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }
  }

  logPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceData.push(metric);
    
    // Keep only last 100 performance metrics
    if (this.performanceData.length > 100) {
      this.performanceData.shift();
    }
  }

  resolveError(errorId: string): void {
    const error = this.errorLog.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  // Export dashboard data
  async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = await this.getDashboardMetrics('30d');
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(data);
    }
  }

  private convertToCSV(data: DashboardMetrics): string {
    // Simplified CSV conversion - in production would be more comprehensive
    const headers = ['Metric', 'Value', 'Date'];
    const rows = [
      ['Active Users', data.realTimeMetrics.activeUsers.toString(), new Date().toISOString()],
      ['Revenue', data.revenue.totalRevenue.toString(), new Date().toISOString()],
      ['DAU', data.engagement.dailyActiveUsers.toString(), new Date().toISOString()],
      ['Error Rate', data.performance.errorRate.toString(), new Date().toISOString()]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}