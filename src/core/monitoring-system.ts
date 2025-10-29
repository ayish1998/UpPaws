import { AnalyticsDashboard, CriticalError, PerformanceMetrics } from './analytics-dashboard.js';
import { AnalyticsManager, EventType } from './analytics.js';

export interface MonitoringConfig {
  errorReporting: {
    enabled: boolean;
    maxErrors: number;
    alertThreshold: number;
    excludePatterns: string[];
  };
  performanceMonitoring: {
    enabled: boolean;
    sampleRate: number;
    slowThreshold: number;
    memoryThreshold: number;
  };
  crashReporting: {
    enabled: boolean;
    autoRestart: boolean;
    maxCrashes: number;
    cooldownPeriod: number;
  };
  alerting: {
    enabled: boolean;
    channels: AlertChannel[];
    escalationRules: EscalationRule[];
  };
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationRule {
  condition: string;
  delay: number; // minutes
  action: string;
}

export interface MonitoringAlert {
  id: string;
  type: 'error' | 'performance' | 'crash' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  lastCheck: Date;
  details: Record<string, any>;
}

export class MonitoringSystem {
  private dashboard: AnalyticsDashboard;
  private analyticsManager: AnalyticsManager;
  private config: MonitoringConfig;
  private alerts: MonitoringAlert[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private crashCount: number = 0;
  private lastCrashTime: Date | null = null;

  constructor(
    dashboard: AnalyticsDashboard, 
    analyticsManager: AnalyticsManager,
    config?: Partial<MonitoringConfig>
  ) {
    this.dashboard = dashboard;
    this.analyticsManager = analyticsManager;
    this.config = this.mergeConfig(config);
    
    this.initializeMonitoring();
  }

  private mergeConfig(userConfig?: Partial<MonitoringConfig>): MonitoringConfig {
    const defaultConfig: MonitoringConfig = {
      errorReporting: {
        enabled: true,
        maxErrors: 1000,
        alertThreshold: 10,
        excludePatterns: ['404', 'timeout']
      },
      performanceMonitoring: {
        enabled: true,
        sampleRate: 0.1,
        slowThreshold: 2000,
        memoryThreshold: 85
      },
      crashReporting: {
        enabled: true,
        autoRestart: true,
        maxCrashes: 5,
        cooldownPeriod: 60
      },
      alerting: {
        enabled: true,
        channels: [
          {
            type: 'email',
            config: { recipients: ['admin@uppaws.com'] },
            severity: 'high'
          }
        ],
        escalationRules: [
          {
            condition: 'unresolved_critical_alert',
            delay: 15,
            action: 'escalate_to_oncall'
          }
        ]
      }
    };

    return {
      errorReporting: { ...defaultConfig.errorReporting, ...userConfig?.errorReporting },
      performanceMonitoring: { ...defaultConfig.performanceMonitoring, ...userConfig?.performanceMonitoring },
      crashReporting: { ...defaultConfig.crashReporting, ...userConfig?.crashReporting },
      alerting: { ...defaultConfig.alerting, ...userConfig?.alerting }
    };
  }

  private initializeMonitoring(): void {
    // Set up global error handlers
    this.setupErrorHandlers();
    
    // Start health checks
    this.startHealthChecks();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Set up alert processing
    this.startAlertProcessing();
  }

  // Error reporting and crash detection
  reportError(error: Error, context?: Record<string, any>, userId?: string): void {
    if (!this.config.errorReporting.enabled) return;

    const errorMessage = error.message;
    
    // Check if error should be excluded
    if (this.shouldExcludeError(errorMessage)) return;

    const criticalError: Omit<CriticalError, 'id' | 'timestamp' | 'resolved'> = {
      message: errorMessage,
      stackTrace: error.stack || '',
      userId
    };

    this.dashboard.logError(criticalError);

    // Track in analytics
    this.analyticsManager.trackEvent(
      userId || 'system',
      EventType.USER_LOGOUT, // Using existing event type, would add ERROR event type
      {
        errorType: error.name,
        errorMessage: errorMessage,
        context: context || {}
      },
      this.generateSessionId()
    );

    // Check if this constitutes a crash
    if (this.isCriticalError(error)) {
      this.handleCrash(error, context, userId);
    }

    // Create alert if threshold exceeded
    this.checkErrorThreshold();
  }

  private shouldExcludeError(message: string): boolean {
    return this.config.errorReporting.excludePatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      'out of memory',
      'stack overflow',
      'segmentation fault',
      'fatal error',
      'system crash'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  private handleCrash(error: Error, context?: Record<string, any>, userId?: string): void {
    if (!this.config.crashReporting.enabled) return;

    this.crashCount++;
    this.lastCrashTime = new Date();

    // Create critical alert
    this.createAlert({
      type: 'crash',
      severity: 'critical',
      title: 'Application Crash Detected',
      message: `Critical error: ${error.message}`,
      metadata: {
        crashCount: this.crashCount,
        stackTrace: error.stack,
        context: context || {},
        userId
      }
    });

    // Check if we've exceeded crash limit
    if (this.crashCount >= this.config.crashReporting.maxCrashes) {
      this.handleCrashLimit();
    }

    // Auto-restart if configured
    if (this.config.crashReporting.autoRestart) {
      this.scheduleRestart();
    }
  }

  private handleCrashLimit(): void {
    this.createAlert({
      type: 'crash',
      severity: 'critical',
      title: 'Crash Limit Exceeded',
      message: `Application has crashed ${this.crashCount} times. Manual intervention required.`,
      metadata: {
        crashCount: this.crashCount,
        lastCrashTime: this.lastCrashTime
      }
    });
  }

  private scheduleRestart(): void {
    // In a real implementation, this would trigger a graceful restart
    console.warn('Scheduling application restart due to crash...');
    
    setTimeout(() => {
      // Reset crash count after cooldown period
      this.crashCount = 0;
    }, this.config.crashReporting.cooldownPeriod * 60 * 1000);
  }

  // Performance monitoring
  private startPerformanceMonitoring(): void {
    if (!this.config.performanceMonitoring.enabled) return;

    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000); // Collect every minute
  }

  private collectPerformanceMetrics(): void {
    // Sample based on configured rate
    if (Math.random() > this.config.performanceMonitoring.sampleRate) return;

    const metrics: PerformanceMetrics = {
      averageLoadTime: this.measureLoadTime(),
      apiResponseTimes: [],
      errorRate: this.calculateCurrentErrorRate(),
      crashRate: this.calculateCurrentCrashRate(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage()
    };

    this.dashboard.logPerformanceMetric(metrics);

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
  }

  private measureLoadTime(): number {
    // Simulate load time measurement
    return Math.random() * 3000 + 500; // 500-3500ms
  }

  private calculateCurrentErrorRate(): number {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    // This would be calculated from actual error data
    return Math.random() * 0.05; // 0-5% error rate
  }

  private calculateCurrentCrashRate(): number {
    return this.crashCount / 1000; // crashes per 1000 sessions
  }

  private getMemoryUsage(): number {
    // In Node.js, you would use process.memoryUsage()
    return Math.random() * 100; // 0-100%
  }

  private getCpuUsage(): number {
    // Would use actual CPU monitoring
    return Math.random() * 100; // 0-100%
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.averageLoadTime > this.config.performanceMonitoring.slowThreshold) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        title: 'Slow Response Time Detected',
        message: `Average load time: ${metrics.averageLoadTime}ms`,
        metadata: { metrics }
      });
    }

    if (metrics.memoryUsage > this.config.performanceMonitoring.memoryThreshold) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'High Memory Usage',
        message: `Memory usage: ${metrics.memoryUsage}%`,
        metadata: { metrics }
      });
    }
  }

  // Health checks
  private startHealthChecks(): void {
    // Database health check
    this.registerHealthCheck('database', async () => {
      try {
        // Simulate database ping
        const start = Date.now();
        await this.simulateAsyncOperation(100);
        const responseTime = Date.now() - start;
        
        return {
          status: responseTime < 200 ? 'healthy' : 'warning',
          responseTime,
          details: { connectionPool: 'active', queries: 'normal' }
        };
      } catch (error) {
        return {
          status: 'critical',
          responseTime: -1,
          details: { error: (error as Error).message }
        };
      }
    });

    // Redis health check
    this.registerHealthCheck('redis', async () => {
      try {
        const start = Date.now();
        await this.simulateAsyncOperation(50);
        const responseTime = Date.now() - start;
        
        return {
          status: 'healthy',
          responseTime,
          details: { memory: '45%', connections: 150 }
        };
      } catch (error) {
        return {
          status: 'critical',
          responseTime: -1,
          details: { error: (error as Error).message }
        };
      }
    });

    // API health check
    this.registerHealthCheck('api', async () => {
      const responseTime = Math.random() * 500 + 50;
      return {
        status: responseTime < 300 ? 'healthy' : 'warning',
        responseTime,
        details: { endpoints: 'operational', rateLimit: 'normal' }
      };
    });

    // Run health checks every 30 seconds
    setInterval(() => {
      this.runHealthChecks();
    }, 30000);
  }

  private registerHealthCheck(name: string, checkFunction: () => Promise<Omit<HealthCheck, 'name' | 'lastCheck'>>): void {
    this.healthChecks.set(name, {
      name,
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      details: {}
    });

    // Store the check function for later execution
    (this.healthChecks.get(name) as any).checkFunction = checkFunction;
  }

  private async runHealthChecks(): Promise<void> {
    for (const [name, healthCheck] of this.healthChecks) {
      try {
        const checkFunction = (healthCheck as any).checkFunction;
        if (checkFunction) {
          const result = await checkFunction();
          
          this.healthChecks.set(name, {
            name,
            status: result.status,
            responseTime: result.responseTime,
            lastCheck: new Date(),
            details: result.details
          });

          // Create alert if health check fails
          if (result.status === 'critical') {
            this.createAlert({
              type: 'error',
              severity: 'high',
              title: `${name} Health Check Failed`,
              message: `${name} is not responding properly`,
              metadata: { healthCheck: result }
            });
          }
        }
      } catch (error) {
        this.healthChecks.set(name, {
          name,
          status: 'critical',
          responseTime: -1,
          lastCheck: new Date(),
          details: { error: (error as Error).message }
        });
      }
    }
  }

  // Alert management
  private createAlert(alertData: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: MonitoringAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);

    // Send alert through configured channels
    this.sendAlert(alert);

    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts.shift();
    }
  }

  private sendAlert(alert: MonitoringAlert): void {
    if (!this.config.alerting.enabled) return;

    const relevantChannels = this.config.alerting.channels.filter(channel => 
      this.shouldSendToChannel(channel, alert.severity)
    );

    relevantChannels.forEach(channel => {
      this.sendToChannel(channel, alert);
    });
  }

  private shouldSendToChannel(channel: AlertChannel, severity: string): boolean {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const channelLevel = severityLevels.indexOf(channel.severity);
    const alertLevel = severityLevels.indexOf(severity);
    
    return alertLevel >= channelLevel;
  }

  private sendToChannel(channel: AlertChannel, alert: MonitoringAlert): void {
    // In production, this would integrate with actual alerting services
    console.log(`[${channel.type.toUpperCase()}] ${alert.severity.toUpperCase()}: ${alert.title}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${alert.timestamp.toISOString()}`);
    
    if (channel.type === 'webhook') {
      // Would make HTTP request to webhook URL
      this.sendWebhookAlert(channel.config.url, alert);
    }
  }

  private async sendWebhookAlert(url: string, alert: MonitoringAlert): Promise<void> {
    try {
      // Simulate webhook call
      console.log(`Sending webhook to ${url}:`, {
        alert_id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  private startAlertProcessing(): void {
    // Process escalation rules every minute
    setInterval(() => {
      this.processEscalationRules();
    }, 60000);
  }

  private processEscalationRules(): void {
    const unresolvedAlerts = this.alerts.filter(alert => !alert.resolved);
    
    unresolvedAlerts.forEach(alert => {
      const alertAge = Date.now() - alert.timestamp.getTime();
      const alertAgeMinutes = alertAge / (1000 * 60);

      this.config.alerting.escalationRules.forEach(rule => {
        if (this.shouldEscalate(alert, rule, alertAgeMinutes)) {
          this.executeEscalationAction(alert, rule);
        }
      });
    });
  }

  private shouldEscalate(alert: MonitoringAlert, rule: EscalationRule, ageMinutes: number): boolean {
    if (ageMinutes < rule.delay) return false;
    
    switch (rule.condition) {
      case 'unresolved_critical_alert':
        return alert.severity === 'critical';
      case 'unresolved_high_alert':
        return alert.severity === 'high' || alert.severity === 'critical';
      default:
        return false;
    }
  }

  private executeEscalationAction(alert: MonitoringAlert, rule: EscalationRule): void {
    console.log(`Escalating alert ${alert.id}: ${rule.action}`);
    
    // Create escalation alert
    this.createAlert({
      type: alert.type,
      severity: 'critical',
      title: `Escalated: ${alert.title}`,
      message: `Alert ${alert.id} has been escalated due to: ${rule.condition}`,
      metadata: {
        originalAlert: alert.id,
        escalationRule: rule.condition
      }
    });
  }

  // Public API methods
  getHealthStatus(): Record<string, HealthCheck> {
    const status: Record<string, HealthCheck> = {};
    this.healthChecks.forEach((check, name) => {
      status[name] = check;
    });
    return status;
  }

  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  getAllAlerts(): MonitoringAlert[] {
    return [...this.alerts];
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  getSystemStatus(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: Record<string, HealthCheck>;
    activeAlerts: number;
    criticalAlerts: number;
  } {
    const components = this.getHealthStatus();
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (criticalAlerts.length > 0) {
      overall = 'critical';
    } else if (Object.values(components).some(c => c.status === 'critical')) {
      overall = 'critical';
    } else if (Object.values(components).some(c => c.status === 'warning') || activeAlerts.length > 0) {
      overall = 'warning';
    }

    return {
      overall,
      components,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length
    };
  }

  // Error threshold checking
  private checkErrorThreshold(): void {
    const recentErrors = this.alerts.filter(alert => 
      alert.type === 'error' && 
      Date.now() - alert.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentErrors.length >= this.config.errorReporting.alertThreshold) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        title: 'Error Threshold Exceeded',
        message: `${recentErrors.length} errors in the last hour`,
        metadata: { errorCount: recentErrors.length }
      });
    }
  }

  // Utility methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async simulateAsyncOperation(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Configuration management
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = this.mergeConfig(newConfig);
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // Setup global error handlers
  private setupErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason, promise) => {
        this.reportError(new Error(`Unhandled Promise Rejection: ${reason}`), {
          promise: promise.toString()
        });
      });

      process.on('uncaughtException', (error) => {
        this.reportError(error, { type: 'uncaughtException' });
      });
    }

    // Handle window errors in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.reportError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.reportError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          type: 'unhandledrejection'
        });
      });
    }
  }
}